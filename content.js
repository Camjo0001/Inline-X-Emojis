class EmojiPicker {
    constructor() {
        this.emojiList = [];
        this.currentMatches = [];
        this.selectedIndex = 0;
        this.isOpen = false;
        this.init();
    }

    async init() {
        await this.loadEmojiData();
        this.createUI();
        this.observeInputFields();
    }

    async loadEmojiData() {
        try {
            const response = await fetch(chrome.runtime.getURL('emojiData.json'));
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const jsonData = await response.json();
            this.emojiList = jsonData.all;
        } catch (error) {
            console.error('Error loading emoji data:', error);
        }
    }

    createUI() {
        this.picker = document.createElement('div');
        this.picker.className = 'emoji-picker';
        this.picker.style.display = 'none';
        document.body.appendChild(this.picker);

        document.addEventListener('click', (e) => {
            if (!this.picker.contains(e.target)) this.close();
        });

        this.picker.addEventListener('click', (e) => {
            const option = e.target.closest('.emoji-option');
            if (option) this.insertEmoji(option.dataset.emoji);
        });
    }

    observeInputFields() {
        const observer = new MutationObserver(() => {
            const target = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (target && !target.dataset.emojiPickerInitialized) this.setupInputField(target);
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    setupInputField(target) {
        target.dataset.emojiPickerInitialized = true;
        target.addEventListener('focusin', () => this.activeInput = target);
        target.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleKeydown(e) {
        if (this.isOpen) {
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); this.navigateOptions(1); break;
                case 'ArrowUp': e.preventDefault(); this.navigateOptions(-1); break;
                case 'Enter': e.preventDefault(); this.selectEmoji(); break;
                case 'Escape': e.preventDefault(); this.close(); break;
            }
        }
        if (e.key === ':' && this.isColonTrigger(e)) this.showSuggestions();
    }

    isColonTrigger(e) {
        return /:(\w*)$/.test(this.getTextBeforeCursor());
    }

    getTextBeforeCursor() {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0).cloneRange();
        range.setStart(this.activeInput, 0);
        return range.toString();
    }

    showSuggestions() {
        const query = this.getTextBeforeCursor().match(/:(\w+)$/)?.[1] ?? '';
        this.currentMatches = this.emojiList.filter(emoji => emoji.name.includes(query));
        this.updatePicker();
    }

    updatePicker() {
        this.picker.innerHTML = this.currentMatches.map((emoji, index) => `
            <div class="emoji-option ${index === this.selectedIndex ? 'selected' : ''}" data-emoji="${emoji.emoji}">
                ${emoji.emoji} :${emoji.name}:
            </div>
        `).join('');
        this.picker.style.display = 'block';
    }

    insertEmoji(emoji) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(emoji));
        this.close();
    }

    close() {
        this.picker.style.display = 'none';
        this.isOpen = false;
    }

    navigateOptions(step) {
        this.selectedIndex = (this.selectedIndex + step + this.currentMatches.length) % this.currentMatches.length;
        this.updatePicker();
    }

    selectEmoji() {
        const selectedEmoji = this.currentMatches[this.selectedIndex];
        if (selectedEmoji) this.insertEmoji(selectedEmoji.emoji);
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'insertEmoji') {
        const activeElement = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (activeElement) {
            const emoji = request.emoji;
            activeElement.dispatchEvent(new Event('focusin')); // Ensure the element is "active"
            picker.activeDiv = activeElement;
            picker.currentInput = activeElement;
            picker.insertEmoji(emoji);
        }
    }
});

// Create the picker instance
const picker = new EmojiPicker();