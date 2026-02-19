const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.partner = null;

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) { return; }

        if (data.type === 'find_partner') {
            // فصل الشريك الحالي إن وجد
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'disconnected' }));
                ws.partner.partner = null;
                ws.partner = null;
            }

            // تنظيف القائمة من المستخدم الحالي
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id && u.readyState === WebSocket.OPEN);

            // البحث عن شريك متاح
            const otherUser = waitingUsers.find(u => u.id !== ws.id && u.readyState === WebSocket.OPEN);

            if (otherUser) {
                waitingUsers = waitingUsers.filter(u => u.id !== otherUser.id);
                ws.partner = otherUser;
                otherUser.partner = ws;

                ws.send(JSON.stringify({ type: 'connected' }));
                otherUser.send(JSON.stringify({ type: 'connected' }));
            } else {
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
