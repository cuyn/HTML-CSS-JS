// 1. تحديث جزء استقبال الرسائل
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') return;

    if (data.type === 'searching') {
        addStatusMessage("Searching for a partner...");
    } else if (data.type === 'connected') {
        // ... كود الاتصال يبقى كما هو ...
        chatMessages.innerHTML = "";
        addStatusMessage("Connected with a real person! Say hi!");
        // (باقي الكود الخاص بتفعيل الأزرار)
    } else if (data.type === 'message') {
        removeTypingIndicator();

        // الحل هنا: لا نعرض الرسالة إلا إذا كانت قادمة من الشريك
        if (data.sender === 'partner') {
            addMessage(data.text, 'received');
        }
    } else if (data.type === 'typing') {
        showTypingIndicator();
    }
    // ... باقي الحالات (disconnected, skipped) تبقى كما هي
};

// 2. تحديث جزء إرسال الرسائل
const sendMessage = () => {
    if (chatInput && socket && socket.readyState === WebSocket.OPEN) {
        const text = chatInput.value.trim();
        if (text) {
            // كود منع الروابط الخاص بك
            const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;
            if (urlPattern.test(text)) {
                addErrorMessage("Links are not allowed.");
                chatInput.value = '';
                return;
            }

            // نرسل الرسالة للسيرفر
            socket.send(JSON.stringify({ type: 'message', text: text }));

            // نعرضها في شاشتنا نحن فقط كـ "sent" (جهة اليمين)
            addMessage(text, 'sent');

            chatInput.value = '';
        }
    }
};
