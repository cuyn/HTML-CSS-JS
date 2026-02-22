const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

function matchUsers() {
    waitingUsers = waitingUsers.filter(u => u.readyState === WebSocket.OPEN);
    while (waitingUsers.length >= 2) {
        const user1 = waitingUsers.shift();
        const user2 = waitingUsers.shift();
        user1.partner = user2;
        user2.partner = user1;
        user1.send(JSON.stringify({ type: 'connected' }));
        user2.send(JSON.stringify({ type: 'connected' }));
    }
}

function removeFromWaiting(ws) {
    waitingUsers = waitingUsers.filter(u => u !== ws);
}

wss.on('connection', (ws) => {
    ws.partner = null;
    ws.on('message', (message) => {
        let data;
        try { data = JSON.parse(message.toString()); } catch { return; }

        if (data.type === 'find_partner' || data.type === 'next') {
            if (ws.partner) {
                const partner = ws.partner;
                if (partner.readyState === WebSocket.OPEN) {
                    partner.send(JSON.stringify({ type: 'partner_left' })); // التنبيه ليوسف
                    partner.partner = null;
                    removeFromWaiting(partner);
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
                ws.partner = null;
            }
            removeFromWaiting(ws);
            waitingUsers.push(ws);
            ws.send(JSON.stringify({ type: 'searching' }));
            matchUsers();
        } else if (data.type === 'message' || data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        removeFromWaiting(ws);
        if (ws.partner) {
            const partner = ws.partner;
            if (partner.readyState === WebSocket.OPEN) {
                partner.partner = null;
                partner.send(JSON.stringify({ type: 'partner_left' }));
                removeFromWaiting(partner);
                waitingUsers.push(partner);
                partner.send(JSON.stringify({ type: 'searching' }));
                matchUsers();
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => { console.log(`Server running on port ${PORT}`); });
