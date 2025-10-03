# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Demo is a Chrome Manifest V3 extension providing a conversational AI assistant in a sidebar interface. It integrates OpenAI's GPT-4o-mini for chat, GPT-4o for vision/screenshot analysis, TTS-1 for voice output, and browser Web Speech API for voice input.

## Extension Architecture

### Three-Context System

The extension operates across three isolated JavaScript contexts that communicate via Chrome's messaging APIs:

1. **Sidebar (sidebar.js)** - Main UI in side panel
   - Manages conversation state and history
   - Handles OpenAI API calls with streaming
   - Controls voice I/O and screenshot capture
   - Uses `chrome.storage.local` for API key persistence
   - Polls content script every 2 seconds for page context

2. **Content Script (content.js)** - Injected into every webpage
   - Intercepts all console methods (log, error, warn, info)
   - Captures uncaught errors and promise rejections
   - Extracts simplified DOM (title, meta, headings, links, forms)
   - Maintains rolling buffer of last 100 console logs
   - Responds to `chrome.runtime.onMessage` from sidebar

3. **Background Service Worker (background.js)** - Minimal coordinator
   - Opens side panel when extension icon clicked
   - No persistent state or logic

### Key Data Flows

**Automatic Context Injection:**
- Sidebar polls active tab every 2s for DOM + console via `chrome.tabs.sendMessage`
- Context appended to every user message in XML tags (`<webpage_context>`, `<console_logs>`)
- User never sees this context - it's injected before API call

**Screenshot Analysis:**
- Uses `chrome.tabs.captureVisibleTab` to get PNG data URL
- Sends to GPT-4o with vision using multimodal message format
- Screenshot data embedded as `image_url` type in messages array

**Conversation Memory:**
- All messages stored in `conversationHistory` array (user + assistant)
- Full history sent with every API request for context
- Screenshot descriptions summarized as "[Image]" in history

## Development Commands

### Generate Icons
```bash
# Method 1: Browser-based
# Open create-icons.html in browser, downloads icon16.png, icon48.png, icon128.png

# Method 2: Node.js (requires canvas package)
npm install
node convert-icons.js  # Generates all three PNG icons
```

### Load Extension for Development
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle
3. Click "Load unpacked"
4. Select this directory

### Reload After Changes
- **Sidebar/Content changes:** Click reload icon in `chrome://extensions/` for this extension
- **Background worker:** Changes require full extension reload
- **CSS/HTML only:** May work with sidebar refresh, but reload recommended

## Important Technical Constraints

### Chrome Extension Limitations
- **No localhost OpenAI proxy** - All API calls must go directly to `api.openai.com` (CORS restrictions)
- **Side panel vs popup** - Uses `sidePanel` API (Chrome 114+), not traditional popup
- **Service worker lifecycle** - Background.js can terminate anytime; avoid persistent state there
- **Content script isolation** - Cannot access sidebar's DOM or variables, only messaging

### OpenAI API Usage
- **Streaming required** - UI designed for SSE streaming responses (`stream: true`)
- **Vision model** - Screenshot analysis requires `gpt-4o` (not gpt-4o-mini)
- **Token limits** - DOM context capped at 10k chars, console logs at 20 most recent
- **Rate limits** - No built-in retry logic; API key must have sufficient quota

### State Management Gotchas
- `conversationHistory` resets on sidebar close/reopen (not persisted)
- `pageContext` (DOM/console) refreshes every 2s, may lag or fail on protected pages
- API key stored in `chrome.storage.local` - persists across sessions
- Voice recording state (`isRecording`) tied to button UI, no background recording

## UI Styling System

- **Dark glassmorphism theme** - `backdrop-filter: blur()` with RGBA backgrounds
- **Gradient accents** - `#667eea → #764ba2 → #f093fb` used throughout
- **Animation classes** - CSS keyframes for: `fadeIn`, `slideUp`, `messagePop`, `shimmer`, `pulse`, `flash`
- **Dynamic animations** - JavaScript adds `.recording`, `.loading` classes for state changes

## File-Specific Notes

### sidebar.js
- `updatePageContext()` function polls content script - modify interval at line 309
- `analyzeScreenshot()` handles vision API - uses different message format than text chat
- `sendMessage()` auto-appends page context invisibly before API call
- Settings saved to `chrome.storage.local` immediately on click

### content.js
- Console interception wraps native methods - avoid infinite loops if logging here
- `getSimplifiedDOM()` has 10k char hard limit - increase if needed for complex pages
- Listens for two message actions: `'getDOM'` and `'getConsole'`

### manifest.json
- Requires `"tabs"` permission for screenshot capture
- `"host_permissions": ["<all_urls>"]` needed for content script injection
- Side panel path is fixed at `sidebar.html` - cannot be changed dynamically
