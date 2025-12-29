// CONFIGURABLE ADS - The banner will rotate through these every 15s
const AD_CONFIGS = [
    {
        name: "@duhannad",
        link: "https://www.instagram.com/duhannad",
        timer: "2s",
        text: "Check out @duhannad for more updates!"
    },
    {
        name: "@example",
        link: "https://instagram.com/example",
        timer: "New",
        text: "Follow us on Instagram for latest news!"
    }
];

let currentAdIndex = 0;

function updateBanners() {
    const ad = AD_CONFIGS[currentAdIndex];
    const banners = [
        { link: document.getElementById('ad-banner-link'), text: document.getElementById('ad-banner-text') },
        { link: document.getElementById('ad-banner-link-chat'), text: document.querySelector('#ad-banner-link-chat p') }
    ];

    banners.forEach(b => {
        if (b.link) b.href = ad.link;
        if (b.text) b.textContent = ad.text;
        
        // Update the badge if it exists
        const badge = b.link ? b.link.querySelector('span') : null;
        if (badge) badge.textContent = ad.timer;
    });

    currentAdIndex = (currentAdIndex + 1) % AD_CONFIGS.length;
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

    // 2. Initialize and Start Ad Rotation
    updateBanners(); // Set initial ad
    setInterval(updateBanners, 15000); // Rotate every 15 seconds

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
            const msgDiv = document.createElement('div');
            msgDiv.className = "self-center bg-amber-500/10 text-amber-500 text-[10px] px-4 py-2 rounded-2xl border border-amber-500/20 mb-2 animate-pulse";
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    const findPartner = () => {
        if (chatMessages) {
            console.log("Finding new partner...");
            chatMessages.innerHTML = "";
            addStatusMessage("Finding a random chat partner...");
            
            setTimeout(() => {
                const partnerGender = Math.random() > 0.5 ? '👦' : '👧';
                if (partnerName) partnerName.innerText = `Anonymous ${partnerGender}`;
                
                chatMessages.innerHTML = `
                    <div class="self-center bg-amber-500/10 text-amber-500 text-[10px] px-3 py-1 rounded-full border border-amber-500/20">
                        Connected with an anonymous. Say hi!
                    </div>
                `;
            }, 1000);
        }
    };

    const openChat = (isNearby = false) => {
        if (!selectedGender) {
            alert("Please select your gender first!");
            return;
        }

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

    if (nextChat) {
        nextChat.addEventListener('click', () => {
            console.log("Next chat button clicked");
            findPartner();
        });
    }

    // 6. Messaging Logic
    const addMessage = (text, type = 'sent') => {
        if (chatMessages) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}`;
            msgDiv.textContent = text;
            chatMessages.appendChild(msgDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    const sendMessage = () => {
        console.log("sendMessage called");
        if (chatInput) {
            const text = chatInput.value.trim();
            if (text) {
                console.log("Message text:", text);
                addMessage(text, 'sent');
                chatInput.value = '';
                // Bot responses removed to prepare for real user integration
            }
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
});