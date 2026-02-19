// =========================
// الإعلانات
// =========================
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
        bannerText.textContent = ad.text;
    }

    if (bannerTextChat) {
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

        const badges = [
            document.getElementById('countdown-badge'),
            document.querySelector('.countdown-badge-chat')
        ];

        badges.forEach(badge => {
            if (badge) badge.textContent = `${countdownSeconds}s`;
        });

    }, 1000);
}

// =========================
// WebSocket
// =========================
let socket = null;

const initWebSocket = () => {
    if (socket) return;

    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    socket = new WebSocket(`${protocol}://${host}`);

    socket.onopen = () => {
        socket.pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000);
    };

    socket.onclose = () => {
        if (socket.pingInterval) clearInterval(socket.pingInterval);
        socket = null;
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'searching') {
            addStatusMessage("Searching for a partner...");
        }

        else if (data.type === 'connected') {
            chatMessages.innerHTML = "";
            addStatusMessage("Connected with a real person! Say hi!");

            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = "Type a message...";

            partnerName.innerText = "Anonymous";
            if (data.partnerColor) {
                partnerName.style.color = data.partnerColor;
            }
        }

        else if (data.type === 'message') {
            removeTypingIndicator();
            addMessage(data.text, 'received');
        }

        else if (data.type === 'typing') {
            showTypingIndicator();
        }

        else if (data.type === 'disconnected') {
            addStatusMessage("Partner disconnected.");
        }

        else if (data.type === 'skipped') {
            addStatusMessage("User skipped you.");
            setTimeout(findPartner, 1500);
        }
    };
};

// =========================
// البحث
// =========================
const findPartner = () => {

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        initWebSocket();

        const check = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                clearInterval(check);
                socket.send(JSON.stringify({ type: 'find_partner' }));
            }
        }, 100);

    } else {
        socket.send(JSON.stringify({ type: 'find_partner' }));
    }

    chatMessages.innerHTML = "";
};

// =========================
// الرسائل
// =========================
const sendMessage = () => {
    const text = chatInput.value.trim();

    if (!text) return;

    socket.send(JSON.stringify({
        type: 'message',
        text
    }));

    addMessage(text, 'sent');
    chatInput.value = '';
};

// typing
chatInput.addEventListener('input', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'typing' }));
    }
});

// =========================
// الواجهة
// =========================
const addMessage = (text, type) => {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
};

const addStatusMessage = (text) => {
    const div = document.createElement('div');
    div.className = "status-msg";
    div.textContent = text;
    chatMessages.appendChild(div);
};

const removeTypingIndicator = () => {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
};

const showTypingIndicator = () => {
    if (document.getElementById('typing-indicator')) return;

    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.textContent = "Typing...";
    chatMessages.appendChild(div);
};

// =========================
// أزرار
// =========================
startRandom.onclick = () => {
    landingPage.classList.add('hidden');
    chatPage.classList.remove('hidden');
    findPartner();
};

sendButton.onclick = sendMessage;

chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});

nextChat.onclick = () => {
    if (socket) socket.send(JSON.stringify({ type: 'next' }));
};

exitChat.onclick = () => {
    if (socket) socket.close();
    location.reload();
};

// =========================
updateBanners();
startCountdown();