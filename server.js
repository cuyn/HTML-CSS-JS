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
    ws.id = Math.random().toString(36).substr(2, 9);
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'find_partner') {
            if (waitingUsers.length > 0) {
                const partner = waitingUsers.shift();
                if (partner.readyState === WebSocket.OPEN) {
                    ws.partner = partner;
                    partner.partner = ws;
                    
                    ws.send(JSON.stringify({ type: 'connected', partnerId: partner.id }));
                    partner.send(JSON.stringify({ type: 'connected', partnerId: ws.id }));
                } else {
                    waitingUsers.push(ws);
                    ws.send(JSON.stringify({ type: 'searching' }));
                }
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
        } else if (data.type === 'next') {
            if (ws.partner) {
                ws.partner.send(JSON.stringify({ type: 'disconnected' }));
                ws.partner.partner = null;
                ws.partner = null;
            }
            // Logic to find new partner
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
