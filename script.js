// كود الإعلانات الأصلي حقك
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

    let socket = null;

    const initWebSocket = () => {
        if (socket) return;
        const host = 'html-css-js--mtaaaaqlk1.replit.app';
        try {
            socket = new WebSocket(`wss://${host}`);
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'connected') {
                    chatMessages.innerHTML = "";
                    addMessage("Connected! Say hi!", "status-msg");
                    if (chatInput) chatInput.disabled = false;
                    if (sendButton) sendButton.disabled = false;
                } else if (data.type === 'message') {
                    // التعديل: اعرض الرسالة فقط لو جاية من الشريك
                    if (data.sender === 'partner') {
                        removeTypingIndicator();
                        addMessage(data.text, 'received');
                    }
                }
                // ... باقي كود الـ onmessage حقك
            };
        } catch (err) { setTimeout(initWebSocket, 5000); }
    };

    const sendMessage = () => {
        if (chatInput && socket && socket.readyState === WebSocket.OPEN) {
            const text = chatInput.value.trim();
            if (text) {
                socket.send(JSON.stringify({ type: 'message', text: text }));
                addMessage(text, 'sent'); // تظهر مرة واحدة في اليمين
                chatInput.value = '';
            }
        }
    };

    if (sendButton) sendButton.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    // كود النجوم حقك
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

    // تشغيل الـ Random Chat
    if (startRandom) startRandom.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        initWebSocket();
        setTimeout(() => socket.send(JSON.stringify({ type: 'find_partner' })), 500);
    });
});

function removeTypingIndicator() { const el = document.getElementById('typing-indicator'); if(el) el.remove(); }
