// Configuration
let config = {
  apiKey: '',
  voice: 'alloy',
  autoSpeak: false
};

// State
let isRecording = false;
let recognition = null;
let currentAudio = null;
let pageContext = {
  dom: '',
  console: []
};
let conversationHistory = [];

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const apiKeyInput = document.getElementById('apiKey');
const voiceSelect = document.getElementById('voiceSelect');
const autoSpeakCheckbox = document.getElementById('autoSpeak');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const clearBtn = document.getElementById('clearBtn');
const screenshotBtn = document.getElementById('screenshotBtn');

// Load saved settings
chrome.storage.local.get(['apiKey', 'voice', 'autoSpeak'], (result) => {
  if (result.apiKey) {
    config.apiKey = result.apiKey;
    apiKeyInput.value = result.apiKey;
  }
  if (result.voice) {
    config.voice = result.voice;
    voiceSelect.value = result.voice;
  }
  if (result.autoSpeak !== undefined) {
    config.autoSpeak = result.autoSpeak;
    autoSpeakCheckbox.checked = result.autoSpeak;
  }
});

// Settings panel
settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.add('active');
});

closeSettings.addEventListener('click', () => {
  settingsPanel.classList.remove('active');
});

saveSettings.addEventListener('click', () => {
  config.apiKey = apiKeyInput.value;
  config.voice = voiceSelect.value;
  config.autoSpeak = autoSpeakCheckbox.checked;

  chrome.storage.local.set({
    apiKey: config.apiKey,
    voice: config.voice,
    autoSpeak: config.autoSpeak
  }, () => {
    settingsPanel.classList.remove('active');
    addMessage('Settings saved!', 'assistant');
  });
});

// Click outside to close settings
settingsPanel.addEventListener('click', (e) => {
  if (e.target === settingsPanel) {
    settingsPanel.classList.remove('active');
  }
});

// Clear conversation
clearBtn.addEventListener('click', () => {
  conversationHistory = [];
  chatContainer.innerHTML = `
    <div class="welcome-message">
      <p>👋 Hello! I'm your AI assistant.</p>
      <p>I automatically have access to:</p>
      <ul>
        <li>The current webpage content and structure</li>
        <li>JavaScript console logs and errors</li>
        <li>Voice input and output capabilities</li>
      </ul>
      <p>Just ask me anything about this page!</p>
      <p class="setup-hint">Click ⚙️ to configure your API key</p>
    </div>
  `;
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = userInput.scrollHeight + 'px';
});

// Send message
sendBtn.addEventListener('click', () => sendMessage());
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Voice recognition setup
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    micBtn.classList.remove('recording');
    isRecording = false;
  };

  recognition.onend = () => {
    micBtn.classList.remove('recording');
    isRecording = false;
  };
}

micBtn.addEventListener('click', () => {
  if (!recognition) {
    addMessage('Speech recognition is not supported in this browser.', 'assistant');
    return;
  }

  if (isRecording) {
    recognition.stop();
    micBtn.classList.remove('recording');
    isRecording = false;
  } else {
    recognition.start();
    micBtn.classList.add('recording');
    isRecording = true;
  }
});

// Screenshot analysis - THE GAME CHANGER
screenshotBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Capture visible tab
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Add visual feedback
    screenshotBtn.style.animation = 'flash 0.3s ease-out';
    setTimeout(() => {
      screenshotBtn.style.animation = '';
    }, 300);

    // Send to AI with vision
    await analyzeScreenshot(screenshot);
  } catch (error) {
    console.error('Screenshot error:', error);
    addMessage('Error capturing screenshot. Make sure you have the necessary permissions.', 'assistant');
  }
});

// Analyze screenshot with GPT-4 Vision
async function analyzeScreenshot(imageDataUrl) {
  if (!config.apiKey) {
    addMessage('Please configure your API key in settings.', 'assistant');
    return;
  }

  addMessage('📸 Screenshot captured - analyzing...', 'user');
  showTypingIndicator();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that can analyze screenshots. Describe what you see in detail, identify any UI elements, text, images, or issues. Be thorough and helpful.'
          },
          ...conversationHistory,
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this screenshot and tell me what you see. Describe the layout, content, and any notable elements.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    removeTypingIndicator();

    const messageDiv = addMessage('', 'assistant');
    const contentDiv = messageDiv.querySelector('.message-content');
    let fullText = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;

            if (content) {
              fullText += content;
              contentDiv.textContent = fullText;
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Add to conversation history
    conversationHistory.push({
      role: 'user',
      content: 'Analyze this screenshot: [Image]'
    });

    conversationHistory.push({
      role: 'assistant',
      content: fullText
    });

    if (config.autoSpeak && fullText) {
      speakText(fullText);
    }

  } catch (error) {
    removeTypingIndicator();
    addMessage(`Screenshot analysis error: ${error.message}`, 'assistant');
  }
}

// Auto-fetch page context on load and periodically
async function updatePageContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'getDOM' }, (response) => {
      if (response && response.dom) {
        pageContext.dom = response.dom;
      }
    });

    chrome.tabs.sendMessage(tab.id, { action: 'getConsole' }, (response) => {
      if (response && response.logs) {
        pageContext.console = response.logs;
      }
    });
  } catch (error) {
    console.error('Error updating page context:', error);
  }
}

// Update context on load and every 2 seconds
updatePageContext();
setInterval(updatePageContext, 2000);

// Add message to chat
function addMessage(text, sender) {
  // Remove welcome message if it exists
  const welcomeMessage = chatContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = text;

  messageDiv.appendChild(contentDiv);

  // Add speak button for assistant messages
  if (sender === 'assistant') {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';

    const speakBtn = document.createElement('button');
    speakBtn.className = 'speak-btn';
    speakBtn.textContent = '🔊 Speak';
    speakBtn.onclick = () => speakText(text, speakBtn);

    actionsDiv.appendChild(speakBtn);
    messageDiv.appendChild(actionsDiv);
  }

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return messageDiv;
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typing-indicator';

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    typingDiv.appendChild(dot);
  }

  chatContainer.appendChild(typingDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingDiv = document.getElementById('typing-indicator');
  if (typingDiv) {
    typingDiv.remove();
  }
}

// Send message to OpenAI with streaming
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  if (!config.apiKey) {
    addMessage('Please configure your API key in settings.', 'assistant');
    return;
  }

  // Add user message
  addMessage(message, 'user');
  userInput.value = '';
  userInput.style.height = 'auto';

  // Show typing indicator
  showTypingIndicator();

  try {
    // Build context-aware message
    let contextMessage = '';

    if (pageContext.dom) {
      contextMessage += `\n\n<webpage_context>\n${pageContext.dom}\n</webpage_context>\n`;
    }

    if (pageContext.console && pageContext.console.length > 0) {
      const recentLogs = pageContext.console.slice(-20).join('\n');
      contextMessage += `\n<console_logs>\n${recentLogs}\n</console_logs>\n`;
    }

    const userMessage = contextMessage ? message + contextMessage : message;

    // Add to conversation history
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Build messages array with system prompt and full conversation
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant with access to the current webpage content and console logs. Use this context to provide accurate, contextual answers about the page, debug errors, and answer questions. The context is automatically included - the user does not see it. Be conversational, remember previous messages in the conversation, and maintain context throughout the discussion.'
      },
      ...conversationHistory
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    removeTypingIndicator();

    // Create message div for streaming response
    const messageDiv = addMessage('', 'assistant');
    const contentDiv = messageDiv.querySelector('.message-content');
    let fullText = '';

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;

            if (content) {
              fullText += content;
              contentDiv.textContent = fullText;
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Add assistant response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: fullText
    });

    // Auto-speak if enabled
    if (config.autoSpeak && fullText) {
      speakText(fullText);
    }

  } catch (error) {
    removeTypingIndicator();
    addMessage(`Error: ${error.message}`, 'assistant');
  }
}

// Text-to-speech with OpenAI streaming
async function speakText(text, speakBtn) {
  if (!config.apiKey) {
    addMessage('Please configure your API key in settings.', 'assistant');
    return;
  }

  // If audio is playing, stop it
  if (currentAudio && speakBtn) {
    currentAudio.pause();
    currentAudio = null;
    speakBtn.textContent = '🔊 Speak';
    speakBtn.classList.remove('speaking');
    return;
  }

  // Update button to show stop state
  if (speakBtn) {
    speakBtn.textContent = '⏹️ Stop';
    speakBtn.classList.add('speaking');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: config.voice,
        input: text,
        speed: 1.0
      })
    });

    if (!response.ok) {
      throw new Error(`TTS error: ${response.status}`);
    }

    // Get audio as blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    currentAudio = new Audio(audioUrl);
    currentAudio.play();

    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (speakBtn) {
        speakBtn.textContent = '🔊 Speak';
        speakBtn.classList.remove('speaking');
      }
    };

    // Handle manual stop via button
    currentAudio.onpause = () => {
      if (speakBtn) {
        speakBtn.textContent = '🔊 Speak';
        speakBtn.classList.remove('speaking');
      }
    };

  } catch (error) {
    console.error('TTS error:', error);
    addMessage(`TTS Error: ${error.message}`, 'assistant');
    if (speakBtn) {
      speakBtn.textContent = '🔊 Speak';
      speakBtn.classList.remove('speaking');
    }
  }
}
