const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

function tryMatch() {
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
        }
    }
}

wss.on('connection', (ws) => {
    ws.id = Math.random().toString(36).substr(2, 9);
    ws.partner = null;

    ws.on('message', (message) => {
        let data;
        try { data = JSON.parse(message); } catch { return; }

        if (data.type === 'find_partner' || data.type === 'next') {

            // إذا عنده شريك
            if (ws.partner) {
                const partner = ws.partner;

                // نفصل بينهم
                partner.partner = null;
                ws.partner = null;

                if (partner.readyState === WebSocket.OPEN) {
                    partner.send(JSON.stringify({ type: 'partner_left' }));

                    // ندخله فوراً قائمة الانتظار
                    waitingUsers.push(partner);
                }
            }

            // نحذف المستخدم الحالي من الانتظار لو موجود
            waitingUsers = waitingUsers.filter(u => u !== ws);

            // ندخله انتظار
            waitingUsers.push(ws);
            ws.send(JSON.stringify({ type: 'searching' }));

            // نحاول نزوّج أي اثنين متاحين
            tryMatch();
        }

        else if (data.type === 'message' || data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        }
    });

    ws.on('close', () => {
        waitingUsers = waitingUsers.filter(u => u !== ws);

        if (ws.partner) {
            const partner = ws.partner;
            partner.partner = null;

            if (partner.readyState === WebSocket.OPEN) {
                partner.send(JSON.stringify({ type: 'partner_left' }));
                waitingUsers.push(partner);
                tryMatch();
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0');