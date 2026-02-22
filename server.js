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
            // إذا كان أحدهم مغلقاً، نحاول مطابقة الباقي
            if (user1.readyState === WebSocket.OPEN) waitingUsers.unshift(user1);
            if (user2.readyState === WebSocket.OPEN) waitingUsers.unshift(user2);
            break; 
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
        try { 
            // تحويل Buffer إلى string أولاً لتجنب المشاكل في بعض البيئات
            data = JSON.parse(message.toString()); 
        } catch { return; }

        if (data.type === 'find_partner' || data.type === 'next') {
            // لو عنده شريك حالياً
            if (ws.partner) {
                const partner = ws.partner;

                // إشعار الطرف الثاني فوراً
                if (partner.readyState === WebSocket.OPEN) {
                    partner.send(JSON.stringify({ type: 'partner_left' }));

                    partner.partner = null;
                    // ندخل الطرف الثاني انتظار مباشرة
                    removeFromWaiting(partner);
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
                ws.partner = null;
            }

            // ندخل المستخدم الحالي انتظار
            removeFromWaiting(ws); // نضمن عدم تكرار المستخدم في القائمة
            waitingUsers.push(ws);

            ws.send(JSON.stringify({ type: 'searching' }));

            // نحاول المطابقة فوراً لكل من في الانتظار
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
            ws.partner = null; // تنظيف الذاكرة

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

    // معالجة الأخطاء لمنع توقف السيرفر
    ws.on('error', () => {
        removeFromWaiting(ws);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});