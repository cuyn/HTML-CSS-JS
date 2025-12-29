document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        
        // Update icon
        themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        lucide.createIcons();
    });

    // Gender Selection
    const genderButtons = document.querySelectorAll('.gender-btn');
    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Simulated Interaction for Action Buttons
    const actionButtons = document.querySelectorAll('main button:not(.gender-btn)');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const title = btn.querySelector('h3').textContent;
            console.log(`Navigating to: ${title}`);
            // Add visual feedback
            btn.style.opacity = '0.7';
            setTimeout(() => btn.style.opacity = '1', 100);
        });
    });
});