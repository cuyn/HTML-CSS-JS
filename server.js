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

        if (data.type === 'find_partner' || data.type === 'next') {
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'disconnected' }));
                ws.partner.partner = null;
                ws.partner = null;
            }
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id);

            // التصحيح: يبحث عن شخص "آخر" حصراً
            const otherUser = waitingUsers.find(u => u.id !== ws.id);

            if (otherUser) {
                waitingUsers = waitingUsers.filter(u => u.id !== otherUser.id);
                ws.partner = otherUser;
                otherUser.partner = ws;

                ws.send(JSON.stringify({ type: 'connected', partnerColor: otherUser.userColor }));
                otherUser.send(JSON.stringify({ type: 'connected', partnerColor: ws.userColor }));
            } else {
                waitingUsers.push(ws);
                ws.send(JSON.stringify({ type: 'searching' }));
            }
        } else if (data.type === 'message') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                // يرسل للشريك فقط ويضع علامة 'partner' لمنع التكرار
                ws.partner.send(JSON.stringify({ type: 'message', text: data.text, sender: 'partner' }));
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

server.listen(5000, '0.0.0.0');
