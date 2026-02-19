// ... (الأكواد العلوية الخاصة بالإعلانات والنجوم تبقى كما هي دون تغيير) ...

document.addEventListener('DOMContentLoaded', () => {
    // العناصر الأساسية
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const nextChatBtn = document.getElementById('next-chat');
    const partnerName = document.getElementById('partner-name');
    let socket = null;

    const addMessage = (text, type = 'sent') => {
        if (!chatMessages) return;
        removeTypingIndicator();
        const container = document.createElement('div');
        container.className = `message-container ${type}-container`;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const initWebSocket = () => {
        if (socket) return;
        socket = new WebSocket(`wss://html-css-js--mtaaaaqlk1.replit.app`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'searching') {
                addStatusMessage("Searching for a partner...");
                if (nextChatBtn) nextChatBtn.disabled = true; // تعطيل الزر أثناء البحث
            } else if (data.type === 'connected') {
                chatMessages.innerHTML = "";
                addStatusMessage("Connected! Say hi!");
                if (nextChatBtn) nextChatBtn.disabled = false; // تفعيل الزر فقط عند وجود شخص
                if (chatInput) chatInput.disabled = false;
                if (sendButton) sendButton.disabled = false;
                if (partnerName) {
                    partnerName.innerText = "Anonymous";
                    if (data.partnerColor) partnerName.style.color = data.partnerColor;
                }
            } else if (data.type === 'message') {
                if (data.sender === 'partner') {
                    addMessage(data.text, 'received');
                }
            } else if (data.type === 'disconnected') {
                addStatusMessage("Partner left.");
                if (nextChatBtn) nextChatBtn.disabled = true; 
                setTimeout(findPartner, 2000);
            }
        };
    };

    const findPartner = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'find_partner' }));
        } else {
            initWebSocket();
        }
        if (nextChatBtn) nextChatBtn.disabled = true; // قفل الزر حتى يجد شخصاً
    };

    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (text && socket && socket.readyState === WebSocket.OPEN) {
            // منع الروابط
            if (/(https?:\/\/[^\s]+)/g.test(text)) return alert("No links!");

            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMessage(text, 'sent'); // عرض رسالتي فوراً
            chatInput.value = '';
        }
    };

    // ربط الأزرار (تأكد أن IDs مطابقة لكود HTML عندك)
    if (document.getElementById('start-random')) document.getElementById('start-random').addEventListener('click', () => {
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('chat-page').classList.remove('hidden');
        findPartner();
    });

    if (nextChatBtn) nextChatBtn.addEventListener('click', findPartner);
    if (sendButton) sendButton.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendMessage(); });

    // ... (باقي كود النجوم والخلفية والإعلانات يوضع هنا) ...
});
