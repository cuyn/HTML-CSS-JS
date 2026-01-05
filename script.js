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

    // Add fade-in class for smooth transition
    [bannerText, bannerTextChat].forEach(el => {
        if (el) {
            el.classList.remove('ad-fade-in');
            void el.offsetWidth; // Trigger reflow
            el.classList.add('ad-fade-in');
            el.textContent = ad.text;
        }
    });

    if (bannerLink) bannerLink.href = ad.link;
    if (bannerLinkChat) bannerLinkChat.href = ad.link;

    currentAdIndex = (currentAdIndex + 1) % AD_CONFIGS.length;
    countdownSeconds = 15; // Reset countdown
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

    // 1. Initialize Elements
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

    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // 2. Initialize and Start Ad Rotation with Countdown
    updateBanners(); 
    startCountdown();

    // 3. Gender Selection
    const genderButtons = document.querySelectorAll('.gender-btn');
    let selectedGender = null;

    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedGender = btn.dataset.gender;
            console.log("Gender selected:", selectedGender);
        });
    });

    // 4. Status Messaging
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

    const addErrorMessage = (text) => {
        if (chatMessages) {
            const existingMsgs = chatMessages.querySelectorAll('.status-msg');
            existingMsgs.forEach(msg => msg.remove());

            const msgDiv = document.createElement('div');
            msgDiv.className = "self-center bg-red-500/20 text-red-500 text-xs font-medium px-4 py-2 rounded-2xl border border-red-500/40 mb-2 animate-pulse status-msg w-fit max-w-[90%] text-center shadow-lg shadow-red-500/10";
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return msgDiv;
        }
    };

    // 5. WebSocket Logic
    let socket = null;

    const initWebSocket = () => {
        if (socket) return;
        
        // Use the current Replit domain dynamically or the fixed one
        const replitUrl = 'db21fdab-266a-4e5d-bdc7-5aa3772a0c01-00-sjrjfhqyepy5.picard.replit.dev';
        
        // Determine the correct host
        const isReplit = window.location.hostname.includes('replit.dev');
        const host = isReplit ? window.location.host : replitUrl;
        
        console.log("Attempting WebSocket connection to:", host);
        // Netlify is HTTPS, Replit is HTTPS. Always use WSS for security and compatibility.
        const wsProtocol = 'wss';
        
        try {
            socket = new WebSocket(`${wsProtocol}://${host}`);

            socket.onopen = () => {
                console.log("WebSocket connected to:", host);
                const existingMsgs = chatMessages.querySelectorAll('.status-msg');
                existingMsgs.forEach(msg => {
                    if (msg.textContent.includes("Connection lost")) msg.remove();
                });
                // Send a ping to keep connection alive every 30s
                socket.pingInterval = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'pong') return; // Ignore pong responses
                if (data.type === 'searching') {
                    addStatusMessage("Searching for a partner...");
                } else if (data.type === 'connected') {
                    chatMessages.innerHTML = "";
                    const msgDiv = document.createElement('div');
                    msgDiv.className = "self-center bg-green-500/10 text-green-500 text-[10px] px-3 py-1 rounded-full border border-green-500/20";
                    msgDiv.textContent = "Connected with a real person! Say hi!";
                    chatMessages.appendChild(msgDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;

                    if (chatInput) {
                        chatInput.disabled = false;
                        chatInput.placeholder = "Type a message...";
                    }
                    if (sendButton) sendButton.disabled = false;
                    if (partnerName) partnerName.innerText = `Anonymous`;
                } else if (data.type === 'message') {
                    removeTypingIndicator();
                    addMessage(data.text, 'received', data.replyTo);
                } else if (data.type === 'typing') {
                    showTypingIndicator();
                } else if (data.type === 'disconnected' || data.type === 'skipped') {
                    if (chatInput) {
                        chatInput.disabled = true;
                        chatInput.placeholder = "Partner left. Searching...";
                    }
                    if (sendButton) sendButton.disabled = true;
                    if (data.type === 'disconnected') {
                        addStatusMessage("Partner disconnected.");
                    } else {
                        addStatusMessage("User skipped you. Finding someone else...");
                        setTimeout(() => findPartner(), 1500);
                    }
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };

            socket.onclose = (event) => {
                console.log("WebSocket closed. Code:", event.code, "Reason:", event.reason);
                if (socket.pingInterval) clearInterval(socket.pingInterval);
                socket = null;
                if (!chatPage.classList.contains('hidden')) {
                    addErrorMessage("Connection lost. Trying to reconnect...");
                    setTimeout(initWebSocket, 2000); // Faster retry
                }
            };
        } catch (err) {
            console.error("WebSocket construction failed:", err);
            setTimeout(initWebSocket, 5000);
        }
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
        addStatusMessage("Searching for a partner...");
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = "Searching for partner...";
        }
        if (sendButton) sendButton.disabled = true;
    };

    const openChat = (isNearby = false) => {
        if (isNearby) {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const randomDistance = (Math.random() * 19 + 0.5).toFixed(1);
                    if (landingPage) landingPage.classList.add('hidden');
                    if (chatPage) chatPage.classList.remove('hidden');
                    if (chatSubtitle) chatSubtitle.innerHTML = `<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ${randomDistance}km away`;
                    findPartner();
                },
                (error) => {
                    alert("Unable to retrieve your location. Using random match instead.");
                    if (landingPage) landingPage.classList.add('hidden');
                    if (chatPage) chatPage.classList.remove('hidden');
                    findPartner();
                }
            );
        } else {
            if (landingPage) landingPage.classList.add('hidden');
            if (chatPage) chatPage.classList.remove('hidden');
            findPartner();
        }
    };

    if (startNearby) startNearby.addEventListener('click', () => openChat(true));
    if (startRandom) startRandom.addEventListener('click', () => openChat(false));
    if (exitChat) {
        exitChat.addEventListener('click', () => {
            if (chatPage) chatPage.classList.add('hidden');
            if (landingPage) landingPage.classList.remove('hidden');
        });
    }

    const nextChatBtn = document.getElementById('next-chat');
    if (nextChatBtn) {
        nextChatBtn.addEventListener('click', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'next' }));
            }
        });
    }

    let replyingTo = null;

    const addMessage = (text, type = 'sent', replyText = null) => {
        if (chatMessages) {
            removeTypingIndicator();
            const container = document.createElement('div');
            container.className = `message-container ${type}-container`;
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}`;
            
            if (replyText) {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'reply-context';
                replyDiv.textContent = replyText;
                msgDiv.appendChild(replyDiv);
                
                const textSpan = document.createElement('span');
                textSpan.textContent = text;
                msgDiv.appendChild(textSpan);
            } else {
                msgDiv.textContent = text;
            }

            // Reply button container (positioned under message)
            const replyBtnContainer = document.createElement('div');
            replyBtnContainer.className = 'reply-btn-container';
            
            const replyBtn = document.createElement('button');
            replyBtn.className = 'reply-btn';
            replyBtn.innerHTML = '<i data-lucide="reply"></i>';
            replyBtn.onclick = () => {
                replyingTo = text;
                const preview = document.getElementById('reply-preview');
                const previewText = document.getElementById('reply-text');
                const chatInputArea = document.querySelector('.chat-input-area');
                if (preview && previewText) {
                    previewText.textContent = text;
                    preview.classList.add('active');
                    if (chatInputArea) chatInputArea.classList.add('has-reply');
                }
                if (chatInput) chatInput.focus();
                if (window.lucide) lucide.createIcons();
            };

            replyBtnContainer.appendChild(replyBtn);
            container.appendChild(msgDiv);
            container.appendChild(replyBtnContainer);
            chatMessages.appendChild(container);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            if (window.lucide) lucide.createIcons();
        }
    };

    const cancelReplyBtn = document.getElementById('cancel-reply');
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', () => {
            replyingTo = null;
            const preview = document.getElementById('reply-preview');
            const chatInputArea = document.querySelector('.chat-input-area');
            if (preview) preview.classList.remove('active');
            if (chatInputArea) chatInputArea.classList.remove('has-reply');
        });
    }

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    const showTypingIndicator = () => {
        if (document.getElementById('typing-indicator')) return;
        if (chatMessages) {
            const msgDiv = document.createElement('div');
            msgDiv.id = 'typing-indicator';
            msgDiv.className = "self-start bg-zinc-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 mb-2";
            msgDiv.innerHTML = `
                <div class="flex gap-1">
                    <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                    <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                    <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                </div>
            `;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    if (chatInput) {
        chatInput.addEventListener('input', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'typing' }));
            }
        });
    }

    const sendMessage = () => {
        if (chatInput && socket && socket.readyState === WebSocket.OPEN) {
            const text = chatInput.value.trim();
            if (text) {
                const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;
                if (urlPattern.test(text)) {
                    addErrorMessage("Links are not allowed.");
                    chatInput.value = '';
                    return;
                }
                
                const messageData = { type: 'message', text: text };
                if (replyingTo) {
                    messageData.replyTo = replyingTo;
                }
                
                socket.send(JSON.stringify(messageData));
                addMessage(text, 'sent', replyingTo);
                
                // Clear reply state
                replyingTo = null;
                const preview = document.getElementById('reply-preview');
                const chatInputArea = document.querySelector('.chat-input-area');
                if (preview) preview.classList.remove('active');
                if (chatInputArea) chatInputArea.classList.remove('has-reply');
                
                chatInput.value = '';
            }
        }
    };

    if (sendButton) sendButton.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
    if (chatInput) chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

    setInterval(() => {
        const count = document.getElementById('online-count');
        if (count) {
            const current = parseInt(count.innerText) || 280;
            const change = Math.floor(Math.random() * 5) - 2;
            count.innerText = Math.max(100, current + change);
        }
    }, 5000);

    const initBackground = () => {
        const container = document.querySelector('.stars-container');
        if (!container) return;
        for (let i = 0; i < 60; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 1.5 + 0.5;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${Math.random() * 4 + 3}s`);
            container.appendChild(star);
        }
        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';
            meteor.style.left = `${Math.random() * 100 + 40}%`;
            meteor.style.top = `${Math.random() * 30}%`;
            meteor.style.setProperty('--duration', `${Math.random() * 1.5 + 1}s`);
            container.appendChild(meteor);
            setTimeout(() => meteor.remove(), 3000);
        };
        const scheduleMeteor = () => {
            setTimeout(() => { createMeteor(); scheduleMeteor(); }, Math.random() * 8000 + 4000);
        };
        scheduleMeteor();
    };
    initBackground();
});