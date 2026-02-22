// CONFIGURABLE ADS
const AD_CONFIGS = [{
    name: "Advertise",
    link: "https://www.instagram.com/chawaniiy?igsh=MWgwbDFuYjFraDdpbw%3D%3D&utm_source=qr",
    text: "BO REKLAME DM US: @chawaniiy"
}];

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
    if (bannerTextChat) bannerTextChat.textContent = ad.text;
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
    const nextChatBtn = document.getElementById('next-chat');

    updateBanners();
    startCountdown();

    const addStatusMessage = (text) => {
        if (chatMessages) {
            const msgDiv = document.createElement('div');
            msgDiv.className = "self-center bg-amber-500/20 text-amber-500 text-xs font-medium px-4 py-2 rounded-2xl border border-amber-500/40 mb-2 status-msg w-fit text-center";
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    const addMessage = (text, type = 'sent') => {
        const container = document.createElement('div');
        container.className = `message-container ${type}-container`;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        container.appendChild(msgDiv);
        chatMessages.appendChild(container);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    let socket = null;

    const initWebSocket = () => {
        if (socket) return;
        const host = 'html-css-js--mtaaaaqlk1.replit.app'; // تأكد من هذا الرابط
        socket = new WebSocket(`wss://${host}`);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'find_partner' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'searching') {
                chatMessages.innerHTML = "";
                addStatusMessage("Searching for a partner...");
                chatInput.disabled = true;
            } else if (data.type === 'connected') {
                chatMessages.innerHTML = "";
                addMessage("Connected! Say hi!", 'status'); // رسالة بسيطة للربط
                chatInput.disabled = false;
                chatInput.placeholder = "Type a message...";
            } else if (data.type === 'message') {
                addMessage(data.text, 'received');
            } else if (data.type === 'partner_left') {
                addStatusMessage("Stranger skipped you! Redirecting...");
            }
        };

        socket.onclose = () => {
            socket = null;
            if (!chatPage.classList.contains('hidden')) setTimeout(initWebSocket, 2000);
        };
    };

    if (startRandom) startRandom.addEventListener('click', () => {
        landingPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        initWebSocket();
    });

    if (nextChatBtn) nextChatBtn.addEventListener('click', () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'next' }));
        }
    });

    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (text && socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'message', text: text }));
            addMessage(text, 'sent');
            chatInput.value = '';
        }
    };

    if (sendButton) sendButton.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
});
