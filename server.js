const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(express.static(__dirname));

let waitingUsers = [];

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'find_partner') {
            // منع المستخدم من الدخول في قائمة الانتظار مرتين
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id);

            if (waitingUsers.length > 0) {
                const partner = waitingUsers.shift();
                if (partner.readyState === WebSocket.OPEN && partner.id !== ws.id) {
                    ws.partner = partner;
                    partner.partner = ws;

                    ws.send(JSON.stringify({ type: 'connected', partnerId: partner.id, partnerColor: partner.userColor }));
                    partner.send(JSON.stringify({ type: 'connected', partnerId: ws.id, partnerColor: ws.userColor }));
                } else {
                    waitingUsers.push(ws);
                    ws.send(JSON.stringify({ type: 'searching' }));
                }
            } else {
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }
        } else if (data.type === 'message') {
            // التعديل هنا: نرسل للشريك فقط ونضيف علامة sender
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ 
                    type: 'message', 
                    text: data.text,
                    sender: 'partner' 
                }));
            }
        } else if (data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify({ type: 'typing' }));
            }
        } else if (data.type === 'next') {
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'skipped' }));
                ws.partner.partner = null;
                ws.partner = null;
            }
            // إعادة البحث تلقائياً
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id);
            if (waitingUsers.length > 0) {
                const partner = waitingUsers.shift();
                ws.partner = partner;
                partner.partner = ws;
                ws.send(JSON.stringify({ type: 'connected', partnerId: partner.id }));
                partner.send(JSON.stringify({ type: 'connected', partnerId: ws.id }));
            } else {
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }
        } else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(user => user !== ws);
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
