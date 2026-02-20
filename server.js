Const express = require('express');
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
                // Inform the partner they were skipped
                partner.send(JSON.stringify({ type: 'partner_left' }));
                partner.partner = null;
                ws.partner = null;

                // Automatically put the abandoned partner back in the waiting list
                if (!waitingUsers.find(u => u.id === partner.id)) {
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
            }
            // Clear current user from waiting list if they were in it
            waitingUsers = waitingUsers.filter(u => u.id !== ws.id && u.readyState === WebSocket.OPEN);

            // Try to find a new partner for the person who clicked Next
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
        } else if (data.type === 'message' || data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(u => u.id !== ws.id);
        if (ws.partner) {
            ws.partner.send(JSON.stringify({ type: 'partner_left' }));
            ws.partner.partner = null;
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0');