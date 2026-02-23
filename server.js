const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

// دالة المطابقة
function matchUsers() {
    while (waitingUsers.length >= 2) {
        const user1 = waitingUsers.shift();
        const user2 = waitingUsers.shift();

        if (
            user1.readyState === WebSocket.OPEN &&
            user2.readyState === WebSocket.OPEN
        ) {
            user1.partner = user2;
            user2.partner = user1;

            user1.send(JSON.stringify({ type: 'connected' }));
            user2.send(JSON.stringify({ type: 'connected' }));
        } else {
            if (user1.readyState === WebSocket.OPEN) waitingUsers.unshift(user1);
            if (user2.readyState === WebSocket.OPEN) waitingUsers.unshift(user2);
            break; 
        }
    }
}

function removeFromWaiting(ws) {
    waitingUsers = waitingUsers.filter(u => u !== ws);
}

wss.on('connection', (ws) => {
    ws.partner = null;

    ws.on('message', (message) => {
        let data;
        try { 
            data = JSON.parse(message.toString()); 
        } catch { return; }

        if (data.type === 'find_partner' || data.type === 'next') {
            if (ws.partner) {
                const partner = ws.partner;
                if (partner.readyState === WebSocket.OPEN) {
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
            
            // محاولة مطابقة فورية
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
