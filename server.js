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
        try { data = JSON.parse(message); } catch (e) { return; }

        if (data.type === 'find_partner' || data.type === 'next') {

            if (ws.partner) {
                const partner = ws.partner;

                // أرسل للطرف الثاني partner_left ليعرف أن الشريك ضغط Next
                if (partner.readyState === WebSocket.OPEN) {
                    partner.send(JSON.stringify({ type: 'partner_left' }));
                }

                // فصل الطرفين
                ws.partner = null;
                partner.partner = null;

                // حذفهم من waitingUsers إذا موجودين
                waitingUsers = waitingUsers.filter(u =>
                    u.id !== ws.id &&
                    u.id !== partner.id &&
                    u.readyState === WebSocket.OPEN
                );

                // إدخال الاثنين في البحث من جديد
                if (ws.readyState === WebSocket.OPEN) {
                    waitingUsers.push(ws);
                    ws.send(JSON.stringify({ type: 'searching' }));
                }
                if (partner.readyState === WebSocket.OPEN) {
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
            } else {
                // إذا ما عنده شريك
                waitingUsers = waitingUsers.filter(u => u.id !== ws.id && u.readyState === WebSocket.OPEN);
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }

            // محاولة ربط أي شخصين ينتظرون
            while (waitingUsers.length >= 2) {
                const user1 = waitingUsers.shift();
                const user2 = waitingUsers.shift();

                if (user1.readyState === WebSocket.OPEN && user2.readyState === WebSocket.OPEN) {
                    user1.partner = user2;
                    user2.partner = user1;

                    user1.send(JSON.stringify({ type: 'connected' }));
                    user2.send(JSON.stringify({ type: 'connected' }));
                }
            }

        } else if (data.type === 'message' || data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(u => u.id !== ws.id);
        if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
            ws.partner.send(JSON.stringify({ type: 'partner_left' }));
            ws.partner.partner = null;
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0');