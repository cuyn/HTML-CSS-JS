Document.addEventListener('DOMContentLoaded', () => {
    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startRandom = document.getElementById('start-random');
    const nextChatBtn = document.getElementById('next-chat');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const backBtn = document.getElementById('back-to-home');

    // تفعيل الأيقونات (Lucide)
    if (window.lucide) lucide.createIcons();

    let socket = null;
    let typingTimeout = null;

    // --- وظائف الواجهة ---

    const showSearching = () => {
        chatMessages.innerHTML = ""; // لضمان تنظيف الشاشة عند البحث الجديد
        const msg = document.createElement('div');
        msg.className = "self-center bg-amber-500/10 text-amber-500 text-[11px] font-medium px-4 py-2 rounded-full border border-amber-500/20 my-4 animate-pulse";
        msg.textContent = "Looking for someone...";
        chatMessages.appendChild(msg);
        toggleUI(false, "Searching...");
    };

    const showConnected = () => {
        chatMessages.innerHTML = ""; 
        const msg = document.createElement('div');
        msg.className = "self-center bg-green-500/10 text-green-500 text-[11px] font-medium px-4 py-1.5 rounded-full border border-green-500/20 my-4";
        msg.textContent = "Stranger connected! Say hi 👋🏻";
        chatMessages.appendChild(msg);
        enableChatUI();
    };

    const handlePartnerLeft = () => {
        removeTypingIndicator();
        const msg = document.createElement('div');
        msg.className = "self-center bg-red-500/10 text-red-500 text-[11px] font-bold px-4 py-2 rounded-full border border-red-500/20 my-4 shadow-lg animate-bounce";
        msg.textContent = "Stranger skipped you! Searching for new partner...";
        chatMessages.appendChild(msg);
        toggleUI(false, "Searching...");

        // البحث التلقائي بعد ثانية ونصف
        setTimeout(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'find_partner' }));
            }
        }, 1500);
    };

    const toggleUI = (enabled, placeholder) => {
        chatInput.disabled = !enabled;
        chatInput.placeholder = placeholder;
        nextChatBtn.disabled = !enabled;
        nextChatBtn.style.opacity = enabled ? "1" : "0.5";
        sendButton.disabled = !enabled;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const enableChatUI = () => {
        chatInput.disabled = false;
        chatInput.placeholder = "Type a message...";
        nextChatBtn.disabled = false;
        nextChatBtn.style.opacity = "1";
        sendButton.disabled = false;
        chatInput.focus();
    };

    // --- إدارة الـ WebSocket ---

    const initSocket = () => {
        if (socket) return;
        socket = new WebSocket("wss://html-css-js--mtaaaaqlk1.replit.app");

        socket.onopen = () => socket.send(JSON.stringify({ type: 'find_partner' }));

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'searching') showSearching();
            else if (data.type === 'connected') showConnected();
            else if (data.type === 'message') { removeTypingIndicator(); addMsg(data.text, 'received'); }
            else if (data.type === 'typing') { showTyping(); clearTimeout(typingTimeout); typingTimeout = setTimeout(removeTypingIndicator, 3000); }
            else if (data.type === 'partner_left') handlePartnerLeft();
        };

        socket.onclose = () => { socket = null; };
    };

    // --- التعامل مع الرسائل والأزرار ---

    // كود العداد التنازلي (Countdown)
    let countdownSeconds = 15;
    const startCountdown = () => {
        setInterval(() => {
            countdownSeconds--;
            if (countdownSeconds < 0) countdownSeconds = 15;

            const badge = document.getElementById('countdown-badge');
            const badgeChat = document.querySelector('.countdown-badge-chat');
            if (badge) badge.textContent = `${countdownSeconds}s`;
            if (badgeChat) badgeChat.textContent = `${countdownSeconds}s`;
        }, 1000);
    };
    startCountdown();

    const addMsg = (text, type) => {
        const div = document.createElement('div');
        div.className = `message-container ${type}-container`;
        div.innerHTML = `<div class="message ${type}">${text}</div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTyping = () => {
        if (document.getElementById('typing-indicator')) return;
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = "self-start flex items-center gap-1 ml-4 mb-2";
        div.innerHTML = `<span class="text-[10px] text-orange-500 font-bold uppercase tracking-tight">typing</span><div class="flex gap-0.5"><span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style="animation-delay:0.2s"></span></div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    };

    // الأحداث (Events)
    startRandom.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        initSocket();
    });

    nextChatBtn.addEventListener('click', () => {
        if (!nextChatBtn.disabled) {
            socket.send(JSON.stringify({ type: 'next' }));
            showSearching(); // إظهار البحث فوراً لمن ضغط Next
        }
    });

    sendButton.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text && socket?.readyState === WebSocket.OPEN && !chatInput.disabled) {
            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMsg(text, 'sent');
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendButton.click(); });

    chatInput.addEventListener('input', () => {
        if (socket?.readyState === WebSocket.OPEN && !chatInput.disabled) {
            socket.send(JSON.stringify({ type: 'typing' }));
        }
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => { location.reload(); });
    }

    // كود النجوم (الخلفية)
    const starsContainer = document.querySelector('.stars-container');
    if (starsContainer) {
        for (let i = 0; i < 60; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            starsContainer.appendChild(star);
        }
    }
});
