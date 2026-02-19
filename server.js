const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

let waitingUsers = [];

wss.on('connection', (ws) => {
    // تعريف فريد لكل مستخدم عند الاتصال
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.partner = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'find_partner') {
            // 1. قطع أي اتصال سابق
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'disconnected' }));
                ws.partner.partner = null;
                ws.partner = null;
            }

            // 2. إزالة المستخدم من قائمة الانتظار إذا كان موجوداً لتجنب التكرار
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id);

            // 3. البحث عن شخص آخر ينتظر (ليس أنت)
            const otherUser = waitingUsers.find(u => u.id !== ws.id && u.readyState === WebSocket.OPEN);

            if (otherUser) {
                // وجدنا شريك! قم بإزالته من القائمة وربطهما
                waitingUsers = waitingUsers.filter(u => u.id !== otherUser.id);

                ws.partner = otherUser;
                otherUser.partner = ws;

                ws.send(JSON.stringify({ type: 'connected' }));
                otherUser.send(JSON.stringify({ type: 'connected' }));
            } else {
                // لا يوجد أحد، أضف المستخدم لقائمة الانتظار
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }
        } else if (data.type === 'message') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ type: 'message', text: data.text }));
            }
        } else if (data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ type: 'typing' }));
            }
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(u => u.id !== ws.id);
        if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'disconnected' }));
            ws.partner.partner = null;
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
