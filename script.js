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
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;
    const adBannerLink = document.getElementById('ad-banner-link');
    const adBannerLinkChat = document.getElementById('ad-banner-link-chat');
    const adBannerText = document.getElementById('ad-banner-text');
    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startNearby = document.getElementById('start-nearby');
    const startRandom = document.getElementById('start-random');
    const exitChat = document.getElementById('exit-chat');
    const nextChat = document.getElementById('next-chat');
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

    // 3. Theme Toggle Removed
    
    // 4. Gender Selection
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

    // 5. Navigation & Chat Logic
    const addStatusMessage = (text) => {
        if (chatMessages) {
            // Remove any existing status messages to prevent duplicates
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
        if (socket) return;
        
        // IMPORTANT: Use the public URL provided by Replit for the backend
        const replitUrl = 'db21fdab-266a-4e5d-bdc7-5aa3772a0c01-00-sjrjfhqyepy5.picard.replit.dev';
        
        // Determine the correct host
        const isReplit = window.location.hostname.includes('replit.dev');
        const host = isReplit ? window.location.host : replitUrl;
        
        console.log("Attempting WebSocket connection to:", host);
        // Add protocol check for production (Netlify uses https, so we need wss)
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        // Force WSS for the specific Replit domain as it requires SSL
        const wsProtocol = host.includes('replit.dev') ? 'wss' : protocol;
        
        socket = new WebSocket(`${wsProtocol}://${host}`);

        socket.onopen = () => {
            console.log("WebSocket connected to:", host);
            // Clear any error messages if connection is successful
            const existingMsgs = chatMessages.querySelectorAll('.status-msg');
            existingMsgs.forEach(msg => {
                if (msg.textContent.includes("Connection lost")) msg.remove();
            });
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            addErrorMessage("Connection lost. Trying to reconnect...");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'searching') {
                addStatusMessage("Searching for a partner...");
                setTimeout(() => {
                    const msg = Array.from(chatMessages.querySelectorAll('.status-msg')).find(el => el.textContent === "Searching for a partner...");
                    if (msg) msg.textContent = "We are searching, please wait...";
                }, 3000);
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
                if (sendButton) {
                    sendButton.disabled = false;
                }

                if (partnerName) {
                    partnerName.innerText = `Anonymous`;
                }
            } else if (data.type === 'message') {
                removeTypingIndicator();
                addMessage(data.text, 'received');
            } else if (data.type === 'typing') {
                showTypingIndicator();
            } else if (data.type === 'disconnected' || data.type === 'skipped') {
                if (chatInput) {
                    chatInput.disabled = true;
                    chatInput.placeholder = "Partner left. Searching...";
                }
                if (sendButton) {
                    sendButton.disabled = true;
                }
                if (data.type === 'disconnected') {
                    addStatusMessage("Partner disconnected.");
                } else {
                    addStatusMessage("User skipped you. Finding someone else...");
                    setTimeout(() => findPartner(), 1500);
                }
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            socket = null;
        };
    };

    const findPartner = () => {
        if (!socket) initWebSocket();
        
        chatMessages.innerHTML = "";
        const searchMsg = addStatusMessage("Searching for a partner...");
        
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = "Searching for partner...";
        }
        if (sendButton) {
            sendButton.disabled = true;
        }

        setTimeout(() => {
            if (searchMsg && searchMsg.parentNode) {
                searchMsg.textContent = "We are searching, please wait...";
            }
        }, 3000);

        // Wait for socket to be open if it's new
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'find_partner' }));
        } else {
            socket.onopen = () => {
                socket.send(JSON.stringify({ type: 'find_partner' }));
            };
        }
    };


    const openChat = (isNearby = false) => {
        if (isNearby) {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            if (startNearby) {
                startNearby.style.opacity = '0.5';
                const h3 = startNearby.querySelector('h3');
                if (h3) h3.innerText = "Searching nearby...";
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const randomDistance = (Math.random() * 19 + 0.5).toFixed(1);
                    if (startNearby) {
                        startNearby.style.opacity = '1';
                        const h3 = startNearby.querySelector('h3');
                        if (h3) h3.innerText = "Chat Nearby";
                    }
                    if (landingPage) landingPage.classList.add('hidden');
                    if (chatPage) chatPage.classList.remove('hidden');
                    if (chatSubtitle) chatSubtitle.innerHTML = `<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ${randomDistance}km away`;
                    findPartner();
                },
                (error) => {
                    if (startNearby) {
                        startNearby.style.opacity = '1';
                        const h3 = startNearby.querySelector('h3');
                        if (h3) h3.innerText = "Chat Nearby";
                    }
                    alert("Unable to retrieve your location. Using random match instead.");
                    if (landingPage) landingPage.classList.add('hidden');
                    if (chatPage) chatPage.classList.remove('hidden');
                    if (chatSubtitle) chatSubtitle.innerHTML = "";
                    findPartner();
                }
            );
        } else {
            if (landingPage) landingPage.classList.add('hidden');
            if (chatPage) chatPage.classList.remove('hidden');
            if (chatSubtitle) chatSubtitle.innerHTML = "";
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
            console.log("Next chat button clicked");
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'next' }));
            }
        });
    }

    // 6. Messaging Logic
    const addMessage = (text, type = 'sent') => {
        if (chatMessages) {
            removeTypingIndicator();
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}`;
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    const showTypingIndicator = () => {
        if (document.getElementById('typing-indicator')) return;
        if (chatMessages) {
            const msgDiv = document.createElement('div');
            msgDiv.id = 'typing-indicator';
            msgDiv.className = "self-start bg-zinc-800/50 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5 mb-2 animate-fadeIn";
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

    let typingTimeout = null;
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'typing' }));
            }
        });
    }

    const addErrorMessage = (text) => {
        if (chatMessages) {
            // Remove any existing status messages to prevent duplicates
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

    const sendMessage = () => {
        console.log("sendMessage called");
        if (chatInput && socket && socket.readyState === WebSocket.OPEN) {
            const text = chatInput.value.trim();
            if (text) {
                // Clear any existing error/status messages when sending a new message
                const existingMsgs = chatMessages.querySelectorAll('.status-msg');
                existingMsgs.forEach(msg => msg.remove());

                // Link detection regex
                const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;
                if (urlPattern.test(text)) {
                    addErrorMessage("Links are not allowed for safety reasons.");
                    chatInput.value = '';
                    return;
                }
                
                socket.send(JSON.stringify({ type: 'message', text: text }));
                addMessage(text, 'sent');
                chatInput.value = '';
            }
        } else {
            addStatusMessage("No one is connected yet.");
        }
    };

    if (sendButton) {
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // 7. Online Count Simulation
    setInterval(() => {
        const count = document.getElementById('online-count');
        if (count) {
            const current = parseInt(count.innerText) || 280;
            const change = Math.floor(Math.random() * 5) - 2;
            count.innerText = Math.max(100, current + change);
        }
    }, 5000);

    // 8. Background Animation (Stars & Meteors)
    const initBackground = () => {
        const container = document.querySelector('.stars-container');
        if (!container) return;

        // Add static stars
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

        // Add meteors periodically
        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'meteor';
            meteor.style.left = `${Math.random() * 100 + 40}%`;
            meteor.style.top = `${Math.random() * 30}%`;
            meteor.style.setProperty('--duration', `${Math.random() * 1.5 + 1}s`);
            container.appendChild(meteor);
            
            setTimeout(() => meteor.remove(), 3000);
        };

        // Randomized meteor timing
        const scheduleMeteor = () => {
            const delay = Math.random() * 8000 + 4000;
            setTimeout(() => {
                createMeteor();
                scheduleMeteor();
            }, delay);
        };
        scheduleMeteor();
    };

    initBackground();
});