// كود الإعلانات حقك مثل ما هو
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

    if (bannerText) {
        bannerText.classList.remove('ad-fade-in');
        void bannerText.offsetWidth; 
        bannerText.classList.add('ad-fade-in');
        bannerText.textContent = ad.text;
    }
    if (bannerTextChat) {
        bannerTextChat.classList.remove('ad-fade-in');
        void bannerTextChat.offsetWidth;
        bannerTextChat.classList.add('ad-fade-in');
        bannerTextChat.textContent = ad.text;
    }

    if (bannerLink) bannerLink.href = ad.link;
    if (bannerLinkChat) bannerLinkChat.href = ad.link;

    currentAdIndex = (currentAdIndex + 1) % AD_CONFIGS.length;
    countdownSeconds = 15; 
}

function startCountdown() {
    setInterval(() => {
        countdownSeconds--;
        if (countdownSeconds < 0) updateBanners();
        const badges = [document.getElementById('countdown-badge'), document.querySelector('.countdown-badge-chat')];
        badges.forEach(badge => { if (badge) badge.textContent = `${countdownSeconds}s`; });
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
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

    if (window.lucide) lucide.createIcons();
    updateBanners(); 
    startCountdown();

    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    if (partnerName) partnerName.style.color = userColor;

    const addStatusMessage = (text) => {
        if (chatMessages) {
            const existingMsgs = chatMessages.querySelectorAll('.status-msg');
            existingMsgs.forEach(msg => msg.remove());
            const msgDiv = document.createElement('div');
            msgDiv.className = "self-center bg-amber-500/20 text-amber-500 text-xs font-medium px-4 py-2 rounded-2xl border border-amber-500/40 mb-2 animate-pulse status-msg w-fit max-w-[90%] text-center shadow-lg shadow-amber-500/10";
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    let socket = null;

    const initWebSocket = () => {
        if (socket) return;
        const host = 'html-css-js--mtaaaaqlk1.replit.app';
        try {
            socket = new WebSocket(`wss://${host}`);
            socket.onopen = () => {
                socket.pingInterval = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
                }, 30000);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'searching') {
                    addStatusMessage("Searching for a partner...");
                } else if (data.type === 'connected') {
                    chatMessages.innerHTML = "";
                    addStatusMessage("Connected with a real person! Say hi!");
                    if (chatInput) { chatInput.disabled = false; chatInput.placeholder = "Type a message..."; }
                    if (sendButton) sendButton.disabled = false;
                    if (partnerName) { 
                        partnerName.innerText = `Anonymous`; 
                        if (data.partnerColor) partnerName.style.color = data.partnerColor; 
                    }
                } else if (data.type === 'message') {
                    // التعديل: استلام رسالة الشريك فقط
                    if (data.sender === 'partner') {
                        removeTypingIndicator();
                        addMessage(data.text, 'received');
                    }
                } else if (data.type === 'typing') {
                    showTypingIndicator();
                } else if (data.type === 'disconnected' || data.type === 'skipped') {
                    addStatusMessage(data.type === 'disconnected' ? "Partner disconnected." : "User skipped you.");
                    if (data.type === 'skipped') setTimeout(() => findPartner(), 1500);
                }
            };
        } catch (err) { setTimeout(initWebSocket, 5000); }
    };

    const findPartner = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            initWebSocket();
            const checkInt = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    clearInterval(checkInt);
                    socket.send(JSON.stringify({ type: 'find_partner' }));
                }
            }, 100);
        } else {
            socket.send(JSON.stringify({ type: 'find_partner' }));
        }
        chatMessages.innerHTML = "";
    };

    if (startRandom) startRandom.addEventListener('click', () => {
        if (landingPage) landingPage.classList.add('hidden');
        if (chatPage) chatPage.classList.remove('hidden');
        findPartner();
    });

    const nextChatBtn = document.getElementById('next-chat');
    if (nextChatBtn) {
        nextChatBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'next' }));
        });
    }

    const addMessage = (text, type = 'sent') => {
        if (chatMessages) {
            removeTypingIndicator();
            const container = document.createElement('div');
            container.className = `message-container ${type}-container`;
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}`;
            msgDiv.textContent = text;
            container.appendChild(msgDiv);
            chatMessages.appendChild(container);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    const removeTypingIndicator = () => { const indicator = document.getElementById('typing-indicator'); if (indicator) indicator.remove(); };
    const showTypingIndicator = () => {
        if (document.getElementById('typing-indicator')) return;
        const msgDiv = document.createElement('div');
        msgDiv.id = 'typing-indicator';
        msgDiv.className = "self-start bg-zinc-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 mb-2";
        msgDiv.innerHTML = `<div class="flex gap-1"><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span><span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span></div>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessage = () => {
        if (chatInput && socket && socket.readyState === WebSocket.OPEN) {
            const text = chatInput.value.trim();
            if (text) {
                socket.send(JSON.stringify({ type: 'message', text: text }));
                addMessage(text, 'sent');
                chatInput.value = '';
            }
        }
    };

    if (sendButton) sendButton.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

    // كود النجوم والخلفية حقك مثل ما هو
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
