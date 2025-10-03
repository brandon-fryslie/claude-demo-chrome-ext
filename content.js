// Content script for DOM reading and console monitoring

// Store console logs
let consoleLogs = [];
const MAX_LOGS = 100;

// Intercept console methods
(function() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  function captureLog(level, args) {
    const message = Array.from(args).map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = `[${level.toUpperCase()}] ${new Date().toISOString()}: ${message}`;

    consoleLogs.push(logEntry);
    if (consoleLogs.length > MAX_LOGS) {
      consoleLogs.shift();
    }
  }

  console.log = function(...args) {
    captureLog('log', args);
    originalLog.apply(console, args);
  };

  console.error = function(...args) {
    captureLog('error', args);
    originalError.apply(console, args);
  };

  console.warn = function(...args) {
    captureLog('warn', args);
    originalWarn.apply(console, args);
  };

  console.info = function(...args) {
    captureLog('info', args);
    originalInfo.apply(console, args);
  };

  // Capture uncaught errors
  window.addEventListener('error', (event) => {
    const errorLog = `[ERROR] ${event.filename}:${event.lineno}:${event.colno} - ${event.message}`;
    consoleLogs.push(errorLog);
    if (consoleLogs.length > MAX_LOGS) {
      consoleLogs.shift();
    }
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorLog = `[PROMISE REJECTION] ${event.reason}`;
    consoleLogs.push(errorLog);
    if (consoleLogs.length > MAX_LOGS) {
      consoleLogs.shift();
    }
  });
})();

// Get simplified DOM structure
function getSimplifiedDOM() {
  const maxLength = 10000; // Limit to avoid too much data

  // Get page title
  const title = document.title;

  // Get meta description
  const metaDescription = document.querySelector('meta[name="description"]')?.content || '';

  // Get main headings
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .slice(0, 20)
    .map(h => `${h.tagName}: ${h.textContent.trim()}`)
    .join('\n');

  // Get visible text content from main areas
  const mainContent = document.querySelector('main')?.textContent ||
                      document.querySelector('article')?.textContent ||
                      document.body.textContent;

  const cleanedContent = mainContent
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  // Get links
  const links = Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 10)
    .map(a => `${a.textContent.trim()} (${a.href})`)
    .join('\n');

  // Get form inputs
  const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
    .slice(0, 10)
    .map(input => {
      const label = input.labels?.[0]?.textContent || input.placeholder || input.name || input.id;
      return `${input.tagName} (${input.type || 'text'}): ${label}`;
    })
    .join('\n');

  let result = `Title: ${title}\n\n`;

  if (metaDescription) {
    result += `Description: ${metaDescription}\n\n`;
  }

  if (headings) {
    result += `Headings:\n${headings}\n\n`;
  }

  if (links) {
    result += `Links:\n${links}\n\n`;
  }

  if (inputs) {
    result += `Form Fields:\n${inputs}\n\n`;
  }

  result += `Content:\n${cleanedContent}`;

  // Trim to max length
  if (result.length > maxLength) {
    result = result.slice(0, maxLength) + '\n\n[Content truncated...]';
  }

  return result;
}

// Listen for messages from the sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDOM') {
    const dom = getSimplifiedDOM();
    sendResponse({ dom: dom });
  } else if (request.action === 'getConsole') {
    sendResponse({ logs: consoleLogs });
  }
  return true;
});

// Log that content script is loaded
console.log('Claude Demo content script loaded');
