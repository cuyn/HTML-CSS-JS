const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUsers = [];

// دالة المطابقة المحسنة
function matchUsers() {
    // تصفية القائمة من أي اتصالات مقطوعة قبل البدء
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

// إزالة مستخدم من الانتظار
function removeFromWaiting(ws) {
    waitingUsers = waitingUsers.filter(u => u !== ws);
}

wss.on('connection', (ws) => {
    ws.partner = null;

    // محاولة مطابقة فورية عند دخول أي مستخدم جديد
    matchUsers();

    ws.on('message', (message) => {
        let data;
        try { 
            data = JSON.parse(message.toString()); 
        } catch { return; }

        // معالجة طلب البحث أو الانتقال للتالي
        if (data.type === 'find_partner' || data.type === 'next') {

            // --- الجزء الخاص بالتنبيه عند التجاهل (Next) ---
            if (ws.partner) {
                const partner = ws.partner;
                if (partner.readyState === WebSocket.OPEN) {
                    // إرسال تنبيه فوري للطرف الآخر بأنه تم تخطيه
                    partner.send(JSON.stringify({ type: 'partner_left' }));

                    partner.partner = null;
                    // إعادة الطرف الآخر لقائمة الانتظار تلقائياً
                    removeFromWaiting(partner);
                    waitingUsers.push(partner);
                    partner.send(JSON.stringify({ type: 'searching' }));
                }
                ws.partner = null;
            }
            // --------------------------------------------

            removeFromWaiting(ws); 
            waitingUsers.push(ws);
            ws.send(JSON.stringify({ type: 'searching' }));

            // تشغيل عملية البحث
            matchUsers();
        }

        else if (data.type === 'message' || data.type === 'typing') {
            if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
                ws.partner.send(JSON.stringify(data));
            }
        }

        else if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
        }
    });

    ws.on('close', () => {
        removeFromWaiting(ws);

        if (ws.partner) {
            const partner = ws.partner;
            if (partner.readyState === WebSocket.OPEN) {
                partner.partner = null;
                // إرسال تنبيه للشريك بأن الطرف الآخر أغلق الصفحة
                partner.send(JSON.stringify({ type: 'partner_left' }));

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
