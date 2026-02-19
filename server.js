const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// إعداد الملفات الثابتة
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(__dirname));

let waitingUsers = [];

wss.on('connection', (ws) => {
    // إنشاء معرف فريد ولون ثابت لكل جلسة
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // معالجة البحث عن شريك أو الانتقال للتالي
        if (data.type === 'find_partner' || data.type === 'next') {
            // 1. إنهاء الاتصال القديم إذا وجد
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'disconnected' }));
                ws.partner.partner = null;
                ws.partner = null;
            }

            // 2. التأكد من إزالة المستخدم من قائمة الانتظار قبل إضافته مجدداً لمنع التكرار
            waitingUsers = waitingUsers.filter(user => user.id !== ws.id);

            if (waitingUsers.length > 0) {
                const partner = waitingUsers.shift();

                // شرط الأمان: التأكد أن الشريك ليس هو نفس المستخدم
                if (partner.id !== ws.id && partner.readyState === WebSocket.OPEN) {
                    ws.partner = partner;
                    partner.partner = ws;

                    ws.send(JSON.stringify({ 
                        type: 'connected', 
                        partnerId: partner.id,
                        partnerColor: partner.userColor 
                    }));
                    partner.send(JSON.stringify({ 
                        type: 'connected', 
                        partnerId: ws.id,
                        partnerColor: ws.userColor
                    }));
                } else {
                    waitingUsers.push(ws);
                    ws.send(JSON.stringify({ type: 'searching' }));
                }
            } else {
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }
        } 

        else if (data.type === 'message') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                // نرسل الرسالة للشريك فقط ونضع علامة أنها قادمة منه
                ws.partner.send(JSON.stringify({ 
                    type: 'message', 
                    text: data.text,
                    sender: 'partner' 
                }));
            }
        } 

        else if (data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ type: 'typing' }));
            }
        } 

        else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(user => user.id !== ws.id);
        if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'disconnected' }));
            ws.partner.partner = null;
        }
    });
});

const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
