// CONFIGURABLE ADS - The banner will rotate through these every 15s
const AD_CONFIGS = [
    {
        name: "Advertise",
        link: "https://www.instagram.com/chawaniiy?igsh=MWgwbDFuYjFraDdpbw%3D%3D&utm_source=qr",
        text: "BO REKLAME DM US: @chawaniiy"
    }
];

let currentAdIndex = 0;
let countdownSeconds = 15;

function updateBanners() {
    const ad = AD_CONFIGS[currentAdIndex];
    const bannerLink = document.getElementById('ad-banner-link');
    const bannerText = document.getElementById('ad-banner-text');
    const bannerLinkChat = document.getElementById('ad-banner-link-chat');
    const bannerTextChat = document.querySelector('#ad-banner-link-chat .ticker-content span');

    [bannerText, bannerTextChat].forEach(el => {
        if (el) {
            el.classList.remove('ad-fade-in');
            void el.offsetWidth;
            el.classList.add('ad-fade-in');
            el.textContent = ad.text;
        }
    });

    if (bannerLink) bannerLink.href = ad.link;
    if (bannerLinkChat) bannerLinkChat.href = ad.link;

    currentAdIndex = (currentAdIndex + 1) % AD_CONFIGS.length;
    countdownSeconds = 15;
}

function startCountdown() {
    setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds < 0) {
            updateBanners();
        }
        const badges = [
            document.getElementById('countdown-badge'),
            document.querySelector('.countdown-badge-chat')
        ];
        badges.forEach(badge => {
            if (badge) badge.textContent = `${countdownSeconds}s`;
        });
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");

    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startNearby = document.getElementById('start-nearby');
    const startRandom = document.getElementById('start-random');
    const exitChat = document.getElementById('exit-chat');
    const chatSubtitle = document.getElementById('chat-subtitle');
    const partnerName = document.getElementById('partner-name');
    const sendButton = document.getElementById('send-button');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const nextChatBtn = document.getElementById('next-chat');

    if (window.lucide) {
        lucide.createIcons();
    }

    updateBanners(); 
    startCountdown();

    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    if (partnerName) {
        partnerName.style.color = userColor;
    }

    const genderButtons = document.querySelectorAll('.gender-btn');
    let selectedGender = null;
    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedGender = btn.dataset.gender;
        });
    });

    const addStatusMessage = (text) => {
        if (chatMessages) {
            const existingMsgs = chatMessages.querySelectorAll('.status-msg');
            existingMsgs.forEach(msg => msg.remove());
            const msgDiv = document.createElement('div');
            msgDiv.className = "self-center bg-amber-500/20 text-amber-500 text-xs font-medium px-4 py-2 rounded-2xl border border-amber-500/40 mb-2 animate-pulse status-msg w-fit max-w-[90%] text-center shadow-lg shadow-amber-500/10";
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return msgDiv;
        }
    };

    let socket = null;

    const initWebSocket = () => {
        if (socket && socket.readyState === WebSocket.OPEN) return;

        const host = 'html-css-js--mtaaaaqlk1.replit.app';
        socket = new WebSocket(`wss://${host}`);

        socket.onopen = () => {
            console.log("Connected to Server");
            // بمجرد فتح الاتصال نرسل طلب البحث فوراً
            socket.send(JSON.stringify({ type: 'find_partner' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'searching') {
                showSearching();
            } 
            else if (data.type === 'connected') {
                enableChatUI();
                chatMessages.innerHTML = "";
                const msgDiv = document.createElement('div');
                msgDiv.className = "self-center bg-green-500/10 text-green-500 text-[10px] px-3 py-1 rounded-full border border-green-500/20";
                msgDiv.textContent = "Connected with a real person! Say hi!";
                chatMessages.appendChild(msgDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } 
            else if (data.type === 'message') {
                removeTypingIndicator();
                addMessage(data.text, 'received');
            } 
            else if (data.type === 'typing') {
                showTypingIndicator();
            } 
            // الحل لمشكلة يوسف ومحمد (التنبيه عند التخطي)
            else if (data.type === 'partner_left') {
                removeTypingIndicator();
                addStatusMessage("Stranger skipped you! Redirecting...");
                toggleUI(false, "Redirecting...");
                // السيرفر سيعيد يوسف للقائمة تلقائياً، نحن فقط ننتظر التحديث للواجهة
            }
        };

        socket.onclose = () => {
            socket = null;
            if (!chatPage.classList.contains('hidden')) {
                setTimeout(initWebSocket, 2000);
            }
        };
    };

    const toggleUI = (enabled, placeholder) => {
        if (chatInput) {
            chatInput.disabled = !enabled;
            chatInput.placeholder = placeholder;
        }
        const isSearching = placeholder.toLowerCase().includes("searching") || placeholder.toLowerCase().includes("redirecting");
        if (nextChatBtn) {
            nextChatBtn.disabled = isSearching;
            nextChatBtn.style.opacity = isSearching ? "0.5" : "1";
        }
        if (sendButton) sendButton.disabled = !enabled;
    };

    const enableChatUI = () => {
        if (chatInput) {
            chatInput.disabled = false;
            chatInput.placeholder = "Type a message...";
        }
        if (nextChatBtn) {
            nextChatBtn.disabled = false;
            nextChatBtn.style.opacity = "1";
        }
        if (sendButton) sendButton.disabled = false;
    };

    const showSearching = () => {
        chatMessages.innerHTML = "";
        addStatusMessage("Searching for a partner...");
        toggleUI(false, "Searching for partner...");
    };

    const openChat = (isNearby = false) => {
        if (landingPage) landingPage.classList.add('hidden');
        if (chatPage) chatPage.classList.remove('hidden');

        if (isNearby) {
            const randomDistance = (Math.random() * 19 + 0.5).toFixed(1);
            if (chatSubtitle) chatSubtitle.innerHTML = `<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ${randomDistance}km away`;
        }

        showSearching();
        initWebSocket();
    };

    if (startNearby) startNearby.addEventListener('click', () => openChat(true));
    if (startRandom) startRandom.addEventListener('click', () => openChat(false));

    if (nextChatBtn) {
        nextChatBtn.addEventListener('click', () => {
            if (!nextChatBtn.disabled && socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'next' }));
                showSearching();
            }
        });
    }

    const addMessage = (text, type = 'sent') => {
        if (!chatMessages) return;
        const container = document.createElement('div');
        container.className = `message-container ${type}-container`;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    const showTypingIndicator = () => {
        if (document.getElementById('typing-indicator')) return;
        if (!chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.id = 'typing-indicator';
        msgDiv.className = "self-start bg-zinc-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 mb-2";
        msgDiv.innerHTML = `<div class="flex gap-1"><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span></div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'typing' }));
            }
        });
    }

    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (text && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMessage(text, 'sent');
            chatInput.value = '';
        }
    };

    if (sendButton) sendButton.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

    const initBackground = () => {
        const container = document.querySelector('.stars-container');
        if (!container) return;
        for (let i = 0; i < 60; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            container.appendChild(star);
        }
    };
    initBackground();
});
