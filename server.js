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
        }
    }
}

// إزالة مستخدم من الانتظار
function removeFromWaiting(ws) {
    waitingUsers = waitingUsers.filter(u => u !== ws);
}

wss.on('connection', (ws) => {

    ws.partner = null;

    ws.on('message', (message) => {
        let data;
        try { data = JSON.parse(message); } catch { return; }

        if (data.type === 'find_partner' || data.type === 'next') {

            // لو عنده شريك حالياً
            if (ws.partner) {
                const partner = ws.partner;

                // 🔥 أهم خطوة: إشعار الطرف الثاني فوراً
                if (partner.readyState === WebSocket.OPEN) {
                    partner.send(JSON.stringify({ type: 'partner_left' }));
                }

                // نفصل بينهم
                partner.partner = null;
                ws.partner = null;

                // ندخل الطرف الثاني انتظار مباشرة
                if (partner.readyState === WebSocket.OPEN) {
                    removeFromWaiting(partner);
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
            }

            // ندخل المستخدم الحالي انتظار
            removeFromWaiting(ws);
            waitingUsers.push(ws);

            ws.send(JSON.stringify({ type: 'searching' }));

            // نحاول المطابقة فوراً
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
server.listen(PORT, '0.0.0.0');