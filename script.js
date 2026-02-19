document.addEventListener('DOMContentLoaded', () => {
    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startRandom = document.getElementById('start-random');
    const nextChatBtn = document.getElementById('next-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const backBtn = document.getElementById('back-to-home'); // سهم الرجوع

    if (window.lucide) lucide.createIcons();

    let socket = null;

    // --- وظيفة سهم الرجوع ---
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (socket) socket.close();
            chatPage.classList.add('hidden');
            landingPage.classList.remove('hidden');
            location.reload(); 
        });
    }

    const addStatusMessage = (text) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = "self-center bg-amber-500/20 text-amber-500 text-xs font-medium px-4 py-2 rounded-2xl border border-amber-500/40 mb-2 animate-pulse status-msg";
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
    };

    const initWebSocket = () => {
        if (socket) return;
        socket = new WebSocket(`wss://html-css-js--mtaaaaqlk1.replit.app`);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'searching') {
                addStatusMessage("Searching...");
                chatInput.disabled = true;
                nextChatBtn.disabled = true;
            } else if (data.type === 'connected') {
                chatMessages.innerHTML = "";
                chatInput.disabled = false;
                nextChatBtn.disabled = false;
                chatInput.placeholder = "Type a message...";
            } else if (data.type === 'message' && data.sender === 'partner') {
                addMessage(data.text, 'received');
            }
        };
    };

    const findPartner = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) initWebSocket();
        else socket.send(JSON.stringify({ type: 'find_partner' }));
        chatMessages.innerHTML = "";
    };

    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (text && socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMessage(text, 'sent');
            chatInput.value = '';
        }
    };

    startRandom.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        findPartner();
    });

    nextChatBtn.addEventListener('click', findPartner);
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    function addMessage(text, type) {
        const container = document.createElement('div');
        container.className = `message-container ${type}-container`;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
