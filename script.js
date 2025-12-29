// CONFIGURABLE ADS - Change these to update the banner
const AD_CONFIG = {
    name: "@duhannad",
    link: "https://www.instagram.com/duhannad", // Add any link here
    timer: "2s",
    template: "Check out {name} for more updates! {timer}"
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // 1. Initialize Ad Banner
    const adBannerLink = document.getElementById('ad-banner-link');
    const adBannerText = document.getElementById('ad-banner-text');
    
    if (adBannerLink && adBannerText) {
        adBannerLink.href = AD_CONFIG.link;
        adBannerText.innerHTML = AD_CONFIG.template
            .replace('{name}', `<span class="text-blue-300 font-bold">${AD_CONFIG.name}</span>`)
            .replace('{timer}', `<span class="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full">${AD_CONFIG.timer}</span>`);
    }

    // 2. Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        lucide.createIcons();
    });

    // 3. Gender Selection
    const genderButtons = document.querySelectorAll('.gender-btn');
    let selectedGender = null;

    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedGender = btn.dataset.gender;
        });
    });

    // 4. Navigation Logic
    const landingPage = document.getElementById('landing-page');
    const chatPage = document.getElementById('chat-page');
    const startNearby = document.getElementById('start-nearby');
    const startRandom = document.getElementById('start-random');
    const exitChat = document.getElementById('exit-chat');
    const exitChatAlt = document.getElementById('exit-chat-alt');
    const nextChat = document.getElementById('next-chat');
    const chatSubtitle = document.getElementById('chat-subtitle');

    const openChat = (isNearby = false) => {
        if (!selectedGender) {
            alert("Please select your gender first!");
            return;
        }

        const proceedToChat = (distance = null) => {
            landingPage.classList.add('hidden');
            chatPage.classList.remove('hidden');
            
            // Update subtitle with distance if nearby
            if (distance) {
                chatSubtitle.innerHTML = `<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> ${distance} away`;
            } else {
                chatSubtitle.innerHTML = `<span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online`;
            }

            // Clear previous messages and show "Finding..." status
            chatMessages.innerHTML = `
                <div class="self-center bg-amber-500/10 text-amber-500 text-[10px] px-4 py-2 rounded-2xl border border-amber-500/20 mb-2 animate-pulse">
                    Finding a random chat partner...
                </div>
            `;

            // Simulate finding someone
            setTimeout(() => {
                chatMessages.innerHTML = `
                    <div class="self-center bg-amber-500/10 text-amber-500 text-[10px] px-3 py-1 rounded-full border border-amber-500/20">
                        Connected with a ${isNearby ? 'local ' : ''}stranger. Say hi!
                    </div>
                `;
            }, 1000);
        };

        if (isNearby) {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported by your browser.");
                return;
            }

            // Show searching feedback
            startNearby.style.opacity = '0.5';
            startNearby.querySelector('h3').innerText = "Searching nearby...";

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Simulate finding someone within 20km
                    const randomDistance = (Math.random() * 19 + 0.5).toFixed(1); // 0.5km to 19.5km
                    setTimeout(() => {
                        startNearby.style.opacity = '1';
                        startNearby.querySelector('h3').innerText = "Chat Nearby";
                        proceedToChat(`${randomDistance}km`);
                    }, 1500);
                },
                (error) => {
                    startNearby.style.opacity = '1';
                    startNearby.querySelector('h3').innerText = "Chat Nearby";
                    alert("Unable to retrieve your location. Using random match instead.");
                    proceedToChat();
                }
            );
        } else {
            proceedToChat();
        }
    };

    startNearby.addEventListener('click', () => openChat(true));
    startRandom.addEventListener('click', () => openChat(false));

    const closeChat = () => {
        chatPage.classList.add('hidden');
        landingPage.classList.remove('hidden');
    };

    exitChat.addEventListener('click', closeChat);
    exitChatAlt.addEventListener('click', closeChat);

    nextChat.addEventListener('click', () => {
        // Simple visual feedback for "finding next"
        chatMessages.innerHTML = `
            <div class="self-center bg-amber-500/10 text-amber-500 text-[10px] px-4 py-2 rounded-2xl border border-amber-500/20 mb-2 animate-pulse">
                Looking for someone to chat with...
            </div>
        `;
        
        setTimeout(() => {
            chatMessages.innerHTML = `
                <div class="self-center bg-amber-500/10 text-amber-500 text-[10px] px-3 py-1 rounded-full border border-amber-500/20">
                    Connected with a new stranger. Say hi!
                </div>
            `;
        }, 1000);
    });

    // 5. Chat Functionality
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    const addMessage = (text, type = 'sent') => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            addMessage(text, 'sent');
            chatInput.value = '';

            // Simulated response
            setTimeout(() => {
                const responses = ["Hey there!", "How are you?", "What's up?", "Cool!", "Haha nice."];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse, 'received');
            }, 1000);
        }
    });

    // 6. Online Count Simulation
    setInterval(() => {
        const count = document.getElementById('online-count');
        const current = parseInt(count.innerText);
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        count.innerText = current + change;
    }, 5000);
});