// Background service worker for Claude Demo extension

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('[Content Script]:', request.data);
  }
  return true;
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Claude Demo extension installed');
});
