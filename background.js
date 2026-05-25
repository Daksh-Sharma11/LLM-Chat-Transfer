// Background service worker for LLM Chat Transfer
// Uses ES module syntax (manifest declares type: "module")

const TARGET_URLS = {
  chatgpt:    "https://chatgpt.com/",
  gemini:     "https://gemini.google.com/app",
  claude:     "https://claude.ai/new",
  perplexity: "https://www.perplexity.ai/",
  grok:       "https://grok.com/",
  mistral:    "https://chat.mistral.ai/chat",
  copilot:    "https://copilot.microsoft.com/",
  deepseek:   "https://chat.deepseek.com/"
};

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_TARGET") {
    handleOpenTarget(message.target, message.prompt).then(sendResponse);
    return true; // keep channel open for async response
  }

  if (message.type === "GET_CONVERSATION") {
    handleGetConversation(sender.tab).then(sendResponse);
    return true;
  }

  if (message.type === "PING") {
    sendResponse({ status: "ok" });
  }
});

async function handleOpenTarget(target, prompt) {
  try {
    const url = TARGET_URLS[target];
    if (!url) return { success: false, error: "Unknown target: " + target };

    // Store prompt temporarily so the new tab can pick it up
    await chrome.storage.session.set({ pendingPrompt: prompt, pendingTarget: target });

    const tab = await chrome.tabs.create({ url });
    return { success: true, tabId: tab.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function handleGetConversation(tab) {
  try {
    if (!tab || !tab.id) return { success: false, error: "No active tab" };

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractConversationFromPage
    });

    const conversation = results?.[0]?.result;
    if (!conversation) return { success: false, error: "Could not extract conversation" };

    return { success: true, conversation };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// This function runs in the page context
function extractConversationFromPage() {
  const host = window.location.hostname;
  let messages = [];

  try {
    // ChatGPT
    if (host.includes("chatgpt.com") || host.includes("openai.com")) {
      const turns = document.querySelectorAll("[data-message-author-role]");
      turns.forEach(el => {
        const role = el.getAttribute("data-message-author-role");
        const text = el.innerText?.trim();
        if (text) messages.push({ role: role === "assistant" ? "assistant" : "user", content: text });
      });
    }

    // Gemini
    else if (host.includes("gemini.google.com")) {
      const userEls = document.querySelectorAll(".user-query-text, .query-text");
      const botEls = document.querySelectorAll(".model-response-text, .response-content");
      const maxLen = Math.max(userEls.length, botEls.length);
      for (let i = 0; i < maxLen; i++) {
        if (userEls[i]) messages.push({ role: "user", content: userEls[i].innerText.trim() });
        if (botEls[i]) messages.push({ role: "assistant", content: botEls[i].innerText.trim() });
      }
    }

    // Claude
    else if (host.includes("claude.ai")) {
      const turns = document.querySelectorAll('[data-testid="human-turn"], [data-testid="ai-turn"]');
      turns.forEach(el => {
        const isHuman = el.getAttribute("data-testid") === "human-turn";
        messages.push({ role: isHuman ? "user" : "assistant", content: el.innerText.trim() });
      });
    }

    // Perplexity
    else if (host.includes("perplexity.ai")) {
      const userEls = document.querySelectorAll(".break-words");
      userEls.forEach(el => {
        messages.push({ role: "user", content: el.innerText.trim() });
      });
    }

    // Generic fallback — grab all visible text blocks
    else {
      const paras = document.querySelectorAll("p, .message, .chat-message, [class*='message']");
      paras.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 10) messages.push({ role: "unknown", content: text });
      });
    }
  } catch (e) {
    // silently fail, return empty
  }

  return messages.filter(m => m.content && m.content.length > 0);
}

// On install: set default storage values
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.session.set({ pendingPrompt: null, pendingTarget: null });
});
