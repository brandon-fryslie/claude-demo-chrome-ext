# Claude Demo - Chrome Extension

A conversational AI assistant Chrome extension with voice support, DOM reading, and console monitoring capabilities.

## Features

- 💬 **Conversational AI** - Chat with OpenAI's GPT-4o-mini using streaming API
- 🎤 **Voice Input** - Speak your questions using browser speech recognition
- 🔊 **Voice Output** - Listen to responses with OpenAI's text-to-speech (multiple voice options)
- 📄 **DOM Reading** - Analyze webpage content and structure
- 🖥️ **Console Monitoring** - Track JavaScript console logs and errors
- ⚡ **Streaming Responses** - Real-time text and audio streaming
- 🎨 **Beautiful UI** - Sidebar interface with smooth animations

## Setup Instructions

### 1. Generate Icons

Before installing the extension, you need to create icon files:

1. Open `create-icons.html` in your browser
2. The page will automatically generate and download 3 icon files:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
3. Move these icon files to the extension directory

### 2. Install Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `claude-demo-chrome-ext` folder
5. The extension icon should appear in your toolbar

### 3. Configure API Key

1. Click the extension icon to open the sidebar
2. Click the ⚙️ settings icon
3. Enter your OpenAI API key (get one at https://platform.openai.com/api-keys)
4. Select your preferred voice
5. Optionally enable auto-speak for responses
6. Click "Save Settings"

## Usage

### Chat
- Type your message in the text area and press Enter or click the send button
- Responses stream in real-time

### Voice Input
- Click the 🎤 microphone button
- Speak your question
- The extension will automatically transcribe and send your message

### Voice Output
- Click the 🔊 Speak button on any assistant message to hear it
- Or enable "Auto-speak responses" in settings

### Read Webpage
- Click the 📄 button to analyze the current webpage
- The extension will extract and summarize page content, headings, links, and forms

### Console Monitoring
- Click the 🖥️ button to view recent console logs
- The extension captures logs, errors, warnings, and unhandled errors

## Files Structure

```
claude-demo-chrome-ext/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Page interaction script
├── sidebar.html           # Sidebar UI
├── sidebar.css            # Styling with animations
├── sidebar.js             # Main application logic
├── create-icons.html      # Icon generator utility
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
└── README.md             # This file
```

## Technical Details

- **Streaming API**: Uses OpenAI's streaming endpoints for both chat completions and audio
- **Speech Recognition**: Built-in browser Web Speech API for microphone input
- **Text-to-Speech**: OpenAI's TTS-1 model with 6 voice options
- **DOM Analysis**: Extracts meaningful content from webpages
- **Console Interception**: Captures all console outputs in real-time

## Privacy & Security

- Your API key is stored locally in Chrome's storage
- All API calls go directly from your browser to OpenAI
- No data is sent to third-party servers
- Console logs are stored temporarily in memory only

## Troubleshooting

**Extension not loading?**
- Make sure all icon files are present
- Check that manifest.json is valid
- Look for errors in `chrome://extensions/`

**Voice input not working?**
- Grant microphone permissions when prompted
- Check browser compatibility (works in Chrome/Edge)

**API errors?**
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure you have internet connection

## Requirements

- Google Chrome or Chromium-based browser
- OpenAI API key with access to GPT-4o-mini and TTS models
- Microphone (for voice input)

## License

MIT
