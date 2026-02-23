const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

// دالة المطابقة
function matchUsers() {
    console.log(`[Match] Checking queue. Size: ${waitingUsers.length}`);
    // Clear dead connections first
    waitingUsers = waitingUsers.filter(u => u.readyState === WebSocket.OPEN);
    
    while (waitingUsers.length >= 2) {
        const user1 = waitingUsers.shift();
        const user2 = waitingUsers.shift();

        if (user1 === user2) {
            waitingUsers.unshift(user1);
            continue;
        }

        console.log(`[Match] Success: ${user1.id} <-> ${user2.id}`);
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
    ws.id = Math.random().toString(36).substr(2, 9);
    console.log(`[Connection] New user: ${ws.id}`);
    ws.partner = null;

    ws.on('message', (message) => {
        let data;
        try { 
            data = JSON.parse(message.toString()); 
            console.log(`[Message] From: ${ws.id || 'unknown'}, Type: ${data.type}`);
        } catch (err) { 
            console.error(`[Error] Parse failed: ${err.message}`);
            return; 
        }

        if (data.type === 'find_partner' || data.type === 'next') {
            console.log(`[Match] User ${ws.id || 'new'} searching. Waiting queue size: ${waitingUsers.length}`);
            if (ws.partner) {
                const partner = ws.partner;
                if (partner.readyState === WebSocket.OPEN) {
                    console.log(`[Match] Informing partner ${partner.id} of leave`);
                    partner.send(JSON.stringify({ type: 'partner_left' }));
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
            
            console.log(`[Match] Attempting match. Queue: ${waitingUsers.map(u => u.id).join(', ')}`);
            matchUsers();
        }

        else if (data.type === 'message' || data.type === 'typing') {
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
                partner.send(JSON.stringify({ type: 'partner_left' }));
                partner.partner = null;
                removeFromWaiting(partner);
                waitingUsers.push(partner);
                partner.send(JSON.stringify({ type: 'searching' }));
                matchUsers();
            }
        }
    });

    ws.on('error', () => {
        removeFromWaiting(ws);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
