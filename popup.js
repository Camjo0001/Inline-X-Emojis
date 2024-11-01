document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const emojiGrid = document.getElementById('emojiGrid');
    const status = document.getElementById('status');

    let emojiList = []; // Initialize the emoji list array

    try {
        const response = await fetch(chrome.runtime.getURL('emojiData.json'));
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const jsonData = await response.json();
        emojiList = jsonData.all; // Populate emojiList with emoji data
        displayEmojis(emojiList); // Display emojis upon loading

    } catch (error) {
        console.error('Error loading emoji data:', error);
    }

    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEmojis = emojiList.filter(emoji =>
            emoji.name.includes(searchTerm) ||
            emoji.aliases.some(alias => alias.includes(searchTerm))
        );
        displayEmojis(filteredEmojis);
    });

    function displayEmojis(emojis) {
        emojiGrid.innerHTML = emojis.map(emoji => `
            <div class="emoji-card" data-emoji="${emoji.emoji}">
                <span class="emoji">${emoji.emoji}</span>
                <span class="emoji-name">:${emoji.name}:</span>
            </div>
        `).join('');
    }

    emojiGrid.addEventListener('click', async (e) => {
        const card = e.target.closest('.emoji-card');
        if (!card) return;

        const emoji = card.dataset.emoji;
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'insertEmoji', emoji });
        } catch (error) {
            await copyToClipboard(emoji);
            showStatus();
        }
    });

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    function showStatus() {
        status.style.display = 'block';
        setTimeout(() => { status.style.display = 'none'; }, 2000);
    }
});