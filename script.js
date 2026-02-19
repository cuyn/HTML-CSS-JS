// --- داخل دالة initWebSocket ---
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') return;

    if (data.type === 'searching') {
        addStatusMessage("Searching for a partner...");
    } 
    else if (data.type === 'connected') {
        chatMessages.innerHTML = "";
        addStatusMessage("Connected with a real person! Say hi!");

        if (chatInput) { chatInput.disabled = false; chatInput.placeholder = "Type a message..."; }
        if (sendButton) sendButton.disabled = false;

        const nextChatBtn = document.getElementById('next-chat');
        if (nextChatBtn) {
            nextChatBtn.disabled = false;
            nextChatBtn.style.opacity = "1";
            nextChatBtn.style.pointerEvents = "auto";
        }

        if (partnerName && data.partnerColor) {
            partnerName.innerText = `Anonymous`;
            partnerName.style.color = data.partnerColor;
        }
    } 
    else if (data.type === 'message') {
        // أهم تعديل: لا تعرض الرسالة القادمة من السيرفر إلا إذا كانت من الشريك
        if (data.sender === 'partner') {
            removeTypingIndicator();
            addMessage(data.text, 'received');
        }
    } 
    else if (data.type === 'typing') {
        showTypingIndicator();
    } 
    else if (data.type === 'disconnected' || data.type === 'skipped') {
        if (chatInput) { chatInput.disabled = true; chatInput.placeholder = "Partner left. Searching..."; }
        if (sendButton) sendButton.disabled = true;
        addStatusMessage(data.type === 'disconnected' ? "Partner disconnected." : "User skipped you.");
        if (data.type === 'skipped') setTimeout(() => findPartner(), 1500);
    }
};

// --- دالة إرسال الرسالة المصلحة ---
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

            // 1. إرسال البيانات للسيرفر (سيستلمها الشريك فقط)
            socket.send(JSON.stringify({ type: 'message', text: text }));

            // 2. عرض الرسالة في شاشتك فوراً كمرسل (sent)
            addMessage(text, 'sent');

            chatInput.value = '';
        }
    }
};
