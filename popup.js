let emojiList = []; // Initialize the emojiList array

document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const emojiGrid = document.getElementById('emojiGrid');
    const status = document.getElementById('status');

    try {
        // Fetch the JSON file instead of a JS file
        const response = await fetch(chrome.runtime.getURL('emojiData.json'));
        
        // Check if the response is okay (status in the range 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        // Parse the JSON directly
        const jsonData = await response.json();
        
        // Store the emoji data in emojiList
        emojiList = jsonData.all; // Populate emojiList with the emoji data
    
        // Display all emojis initially
        displayEmojis(emojiList); // Display the emojis after loading them
    } catch (error) {
        console.error('Error loading emoji data:', error);
    }
    
    // Search functionality
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEmojis = emojiList.filter(emoji =>
            emoji.name.includes(searchTerm) ||
            emoji.aliases.some(alias => alias.includes(searchTerm))
        );
        displayEmojis(filteredEmojis);
    });

    function displayEmojis(emojis) {
        emojiGrid.innerHTML = emojis.map(emoji => {
            // Parse each emoji in the map function directly
            return `
                <div class="emoji-card" data-emoji="${emoji.emoji}">
                    <span class="emoji">${emoji.emoji}</span>
                    <span class="emoji-name">:${emoji.name.replace(':','')}:</span>
                </div>
            `;
        }).join('');
    }

    // Handle emoji clicks
    emojiGrid.addEventListener('click', async (e) => {
        const card = e.target.closest('.emoji-card');
        if (!card) return;

        const emoji = card.dataset.emoji;

        // Try to insert into active X input first
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'insertEmoji',
                emoji: emoji
            });
        } catch (error) {
            // If insertion fails, copy to clipboard
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
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    }
});
