# X.com Emoji Picker Extension 🎯

A Chrome extension that brings Discord-style emoji picking to X.com (formerly Twitter). Type messages naturally with inline emoji suggestions and manage your emoji collection easily.

## ✨ Features

- **Inline Emoji Suggestions**: Type `:` to trigger emoji suggestions while composing posts
- **Smart Matching**: Finds emojis by name and aliases (e.g., `:joy:`, `:happy:`)
- **Popup Interface**: Access all emojis through a convenient popup in the top right
- **Search Functionality**: Quickly find the perfect emoji using the search bar
- **Copy to Clipboard**: One-click copying of any emoji
- **Customizable**: Easily add or remove emojis by modifying the emoji database

## 🚀 Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## 💡 Usage

### Inline Suggestions
1. Start typing in any X.com text input
2. Type `:` followed by the emoji name (e.g., `:smile:`)
3. Select from the suggestion dropdown using arrow keys or mouse

### Popup Interface
1. Click the extension icon in your Chrome toolbar
2. Browse all available emojis
3. Use the search bar to filter emojis
4. Click any emoji to copy it to your clipboard

### Customizing Emojis

To add or remove emojis, modify the `emojiData.json` file:

```json
{
  "emojis": [
    { "emoji": "🙏", "name": "pray", "aliases": ["prayer", "hands", "god"] },
    // Add more emojis here
  ]
}
```

Each emoji entry requires:
- `emoji`: The actual emoji character
- `name`: Primary name for the emoji
- `aliases`: Array of alternative names (optional)

## 🛠️ Development

### Project Structure
```
extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   └── content.js
└── data/
    └── emojiData.json
```

### Local Development
1. Make your changes
2. Reload the extension in `chrome://extensions/`
3. Test the changes on X.com

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- Inspired by Discord's emoji picker
- Thanks to all contributors who have helped shape this project

## 📮 Support

If you encounter any issues or have suggestions, please [open an issue](../../issues) on GitHub.
