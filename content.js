class EmojiPicker {
    constructor() {
        this.init();
        this.selectedIndex = 0;
        this.isOpen = false;
        this.currentInput = null;
        this.searchText = '';
        this.observer = null;
        this.insertMode = false;
        this.activeDiv = null;
        this.lastCursorPosition = null; // Track the last cursor position
    }

    async init() {
        await this.setupEmojiData();
        this.createUI();
        this.setupMutationObserver();
    }

    async setupEmojiData() {
        try {
            const response = await fetch(chrome.runtime.getURL('emojiData.json'));
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
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
            if (!this.picker.contains(e.target)) {
                this.close();
            }
        });

        this.picker.addEventListener('click', (e) => {
            const option = e.target.closest('.emoji-option');
            if (option) {
                e.preventDefault();
                e.stopPropagation();
                const emoji = option.dataset.emoji;
                // Use the stored cursor position for click insertion
                this.insertEmoji(emoji, true);
            }
        });
    }

    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const tweetContainer = document.querySelector('[data-testid="tweetTextarea_0"]')?.closest('div[role="textbox"]');
                    if (tweetContainer && !tweetContainer.dataset.emojiPickerInitialized) {
                        this.initializeTweetContainer(tweetContainer);
                    }
                }
            }
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        const tweetContainer = document.querySelector('[data-testid="tweetTextarea_0"]')?.closest('div[role="textbox"]');
        if (tweetContainer) {
            this.initializeTweetContainer(tweetContainer);
        }
    }

    initializeTweetContainer(container) {
        container.dataset.emojiPickerInitialized = 'true';

        container.addEventListener('focusin', (e) => {
            const div = e.target.closest('[data-testid="tweetTextarea_0"]');
            if (div) {
                this.activeDiv = div;
                this.currentInput = div;
            }
        });
        container.addEventListener('click', (e) => {
            const div = e.target.closest('[data-testid="tweetTextarea_0"]');
            if (div) {
                this.activeDiv = div;
                this.currentInput = div;
            }
        });
        container.addEventListener('keydown', (e) => this.handleKeydown(e));
        container.addEventListener('compositionstart', () => this.insertMode = true);
        container.addEventListener('compositionend', () => this.insertMode = false);
    }

    handleKeydown(e) {
        if (this.insertMode) return;
        const element = e.target.closest('[data-testid="tweetTextarea_0"]');
        if (!element) return;
        this.currentInput = element;
        this.activeDiv = element;

        if (this.isOpen) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentMatches.length - 1);
                    this.updateSelection();
                    return;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                    this.updateSelection();
                    return;
                case 'Enter':
                case 'Tab':
                    if (this.currentMatches[this.selectedIndex]) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.insertEmoji(this.currentMatches[this.selectedIndex].emoji, false);
                        return false;
                    }
                    return;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    return;
            }
        }

        // Store cursor position whenever typing occurs
        this.storeCursorPosition();

        setTimeout(() => {
            const currentText = this.getTextBeforeCursor();
            const match = currentText.match(/:(\w+)$/);
            
            if (match) {
                const searchTerm = match[1].toLowerCase();
                const matches = this.searchEmojis(searchTerm);
                if (matches.length > 0) {
                    this.showPicker(matches);
                    this.positionPicker(this.activeDiv);
                } else {
                    this.close();
                }
            } else {
                this.close();
            }
        }, 0);
    }

    storeCursorPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            this.lastCursorPosition = {
                node: range.startContainer,
                offset: range.startOffset,
                text: this.getTextBeforeCursor()
            };
        }
    }

    getTextBeforeCursor() {
        if (!this.activeDiv) return '';
        const selection = window.getSelection();
        if (!selection.rangeCount) return '';
        
        const range = selection.getRangeAt(0).cloneRange();
        const textNode = this.findFirstTextNode(this.activeDiv);
        
        if (textNode) {
            range.setStart(textNode, 0);
        } else {
            range.setStart(this.activeDiv, 0);
        }
        
        return range.toString();
    }

    findFirstTextNode(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            return element;
        }
        
        for (const child of element.childNodes) {
            const textNode = this.findFirstTextNode(child);
            if (textNode) {
                return textNode;
            }
        }
        
        return null;
    }

    insertEmoji(emoji, isClick) {
        if (this.isInserting || !this.activeDiv) return;
        this.isInserting = true;

        try {
            const textNode = isClick && this.lastCursorPosition ? 
                this.lastCursorPosition.node : 
                window.getSelection().getRangeAt(0).startContainer;

            if (textNode.nodeType === Node.TEXT_NODE) {
                const fullText = textNode.textContent;
                let cursorPosition;
                
                if (isClick && this.lastCursorPosition) {
                    // For clicks, find the end of the emoji text sequence instead of using stored position
                    const beforeText = this.lastCursorPosition.text;
                    const colonMatch = beforeText.match(/:[^:\s]*$/);
                    if (colonMatch) {
                        cursorPosition = this.lastCursorPosition.offset + 
                            (beforeText.length - colonMatch.index);
                    } else {
                        cursorPosition = this.lastCursorPosition.offset;
                    }
                } else {
                    cursorPosition = window.getSelection().getRangeAt(0).startOffset;
                }
                
                const beforeCursor = fullText.substring(0, cursorPosition);
                const afterCursor = fullText.substring(cursorPosition);

                const colonMatch = beforeCursor.match(/:[^:\s]*$/);
                if (!colonMatch) return;

                const colonIndex = colonMatch.index;
                const newText = fullText.substring(0, colonIndex) + emoji + 
                    fullText.substring(cursorPosition);
                
                textNode.textContent = newText;

                const range = document.createRange();
                const selection = window.getSelection();
                const newPosition = colonIndex + emoji.length;
                range.setStart(textNode, newPosition);
                range.setEnd(textNode, newPosition);
                selection.removeAllRanges();
                selection.addRange(range);
            }

            this.activeDiv.dispatchEvent(new Event('input', { bubbles: true }));
            this.close();
        } finally {
            setTimeout(() => {
                this.isInserting = false;
            }, 100);
        }
    }

    searchEmojis(query) {
        return this.emojiList
            .filter(emoji => {
                const searchTerms = [emoji.name, ...emoji.aliases];
                return searchTerms.some(term => term.includes(query.toLowerCase()));
            })
            .slice(0, 8);
    }

    findExactMatch(query) {
        return this.emojiList.find(emoji => {
            const searchTerms = [emoji.name, ...emoji.aliases];
            return searchTerms.some(term => term === query.toLowerCase());
        });
    }

    showPicker(matches) {
        this.currentMatches = matches;
        this.selectedIndex = 0;
        this.isOpen = true;
        this.picker.innerHTML = matches.map((emoji, index) => `
            <div class="emoji-option ${index === 0 ? 'selected' : ''}" data-emoji="${emoji.emoji}">
                <span class="emoji-char">${emoji.emoji}</span>
                <span class="emoji-name">:${emoji.name}:</span>
            </div>
        `).join('');
        this.picker.style.display = 'block';
    }

    positionPicker(target) {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const pickerHeight = this.picker.offsetHeight;
        
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
            this.picker.style.top = `${rect.top + window.scrollY - pickerHeight - 5}px`;
        } else {
            this.picker.style.top = `${rect.bottom + window.scrollY + 5}px`;
        }
        
        this.picker.style.left = `${rect.left + window.scrollX}px`;
    }

    updateSelection() {
        const options = this.picker.querySelectorAll('.emoji-option');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === this.selectedIndex);
        });
        options[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }

    close() {
        this.isOpen = false;
        this.picker.style.display = 'none';
        this.currentMatches = [];
        this.selectedIndex = 0;
    }
}

// // Handle messages from background script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'insertEmoji') {
//         const activeElement = document.querySelector('[data-testid="tweetTextarea_0"]');
//         if (activeElement) {
//             const emoji = request.emoji;
//             activeElement.dispatchEvent(new Event('focusin'));
//             picker.activeDiv = activeElement;
//             picker.currentInput = activeElement;
//             picker.insertEmoji(emoji, false);
//         }
//     }
// });

const picker = new EmojiPicker();