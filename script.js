document.addEventListener('DOMContentLoaded', () => {
    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startRandom = document.getElementById('start-random');
    const nextChatBtn = document.getElementById('next-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const backBtn = document.getElementById('back-to-home');

    if (window.lucide) lucide.createIcons();
    let socket = null;
    let typingTimeout = null;

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (socket) { socket.close(); socket = null; }
            chatPage.classList.add('hidden');
            landingPage.classList.remove('hidden');
            location.reload(); 
        });
    }

    const showSearchingStatus = () => {
        chatMessages.innerHTML = "";
        const msgDiv = document.createElement('div');
        msgDiv.className = "self-center bg-amber-500/10 text-amber-500 text-[11px] font-medium px-4 py-2 rounded-full border border-amber-500/20 my-4 animate-pulse";
        msgDiv.textContent = "Searching for a partner...";
        chatMessages.appendChild(msgDiv);
        disableChat("Searching...");
    };

    const showConnectedStatus = () => {
        chatMessages.innerHTML = ""; 
        const msgDiv = document.createElement('div');
        msgDiv.className = "self-center bg-green-500/10 text-green-500 text-[11px] font-medium px-4 py-1.5 rounded-full border border-green-500/20 my-4";
        msgDiv.textContent = "Connected! Say hello 👋🏻";
        chatMessages.appendChild(msgDiv);
        enableChat();
    };

    const showSkipStatus = () => {
        removeTypingIndicator();
        const msgDiv = document.createElement('div');
        msgDiv.className = "self-center bg-red-500/10 text-red-500 text-[11px] font-bold px-4 py-2 rounded-full border border-red-500/20 my-4 shadow-lg shadow-red-500/5 animate-bounce";
        msgDiv.textContent = "Stranger skipped you. Click Next.";
        chatMessages.appendChild(msgDiv);
        disableChat("Partner left...");
        nextChatBtn.disabled = false;
        nextChatBtn.style.opacity = "1";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const disableChat = (placeholder) => {
        chatInput.disabled = true;
        chatInput.value = "";
        chatInput.placeholder = placeholder;
        nextChatBtn.disabled = true;
        nextChatBtn.style.opacity = "0.5";
        sendButton.disabled = true;
    };

    const enableChat = () => {
        chatInput.disabled = false;
        chatInput.placeholder = "Type a message...";
        nextChatBtn.disabled = false;
        nextChatBtn.style.opacity = "1";
        sendButton.disabled = false;
        chatInput.focus();
    };

    const initWebSocket = () => {
        if (socket && socket.readyState === WebSocket.OPEN) return;
        const REPLIT_URL = "wss://html-css-js--mtaaaaqlk1.replit.app"; 
        socket = new WebSocket(REPLIT_URL);

        socket.onopen = () => socket.send(JSON.stringify({ type: 'find_partner' }));

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'searching') {
                showSearchingStatus();
            } else if (data.type === 'connected') {
                showConnectedStatus();
            } else if (data.type === 'message') {
                removeTypingIndicator();
                addMessage(data.text, 'received');
            } else if (data.type === 'typing') {
                showTypingIndicator();
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(removeTypingIndicator, 3000);
            } else if (data.type === 'partner_skipped') {
                showSkipStatus();
            }
        };
    };

    const findPartner = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) initWebSocket();
        else socket.send(JSON.stringify({ type: 'find_partner' }));
        showSearchingStatus();
    };

    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (text && socket?.readyState === WebSocket.OPEN && !chatInput.disabled) {
            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMessage(text, 'sent');
            chatInput.value = '';
        }
    };

    chatInput.addEventListener('input', () => {
        if (socket?.readyState === WebSocket.OPEN && !chatInput.disabled) {
            socket.send(JSON.stringify({ type: 'typing' }));
        }
    });

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

    const showTypingIndicator = () => {
        if (document.getElementById('typing-indicator')) return;
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = "self-start flex items-center gap-1 ml-4 mb-2 opacity-90";
        typingDiv.innerHTML = `<span class="text-[10px] text-orange-500 font-bold uppercase">typing</span><div class="flex gap-0.5"><span class="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style="animation-delay:0s"></span><span class="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style="animation-delay:0.2s"></span><span class="w-1 h-1 bg-orange-500 rounded-full animate-bounce" style="animation-delay:0.4s"></span></div>`;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    };

    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            starsContainer.appendChild(star);
        }
    }
});
