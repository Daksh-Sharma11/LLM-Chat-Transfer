// Content script - injected into supported AI chat pages
// Listens for extraction requests from the popup via background

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_CHAT") {
    const messages = extractChat();
    sendResponse({ success: true, messages });
    return true;
  }
});

function extractChat() {
  const host = window.location.hostname;
  let messages = [];

  try {
    if (host.includes("chatgpt.com") || host.includes("openai.com")) {
      document.querySelectorAll("[data-message-author-role]").forEach(el => {
        const role = el.getAttribute("data-message-author-role");
        const text = el.innerText?.trim();
        if (text) messages.push({ role: role === "assistant" ? "Assistant" : "User", content: text });
      });
    } else if (host.includes("gemini.google.com")) {
      const userEls = [...document.querySelectorAll(".user-query-text, .query-text")];
      const botEls  = [...document.querySelectorAll(".model-response-text, .response-content, model-response")];
      const maxLen  = Math.max(userEls.length, botEls.length);
      for (let i = 0; i < maxLen; i++) {
        if (userEls[i]) messages.push({ role: "User",      content: userEls[i].innerText.trim() });
        if (botEls[i])  messages.push({ role: "Assistant", content: botEls[i].innerText.trim() });
      }
    } else if (host.includes("claude.ai")) {
      document.querySelectorAll('[data-testid="human-turn"], [data-testid="ai-turn"]').forEach(el => {
        const isHuman = el.getAttribute("data-testid") === "human-turn";
        messages.push({ role: isHuman ? "User" : "Assistant", content: el.innerText.trim() });
      });
    } else if (host.includes("perplexity.ai")) {
      document.querySelectorAll(".break-words, [class*='query'], [class*='answer']").forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 5) messages.push({ role: "Unknown", content: text });
      });
    } else if (host.includes("grok.com") || host.includes("x.com")) {
      document.querySelectorAll("[class*='message'], [class*='bubble']").forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 5) messages.push({ role: "Unknown", content: text });
      });
    } else {
      // Generic fallback
      document.querySelectorAll("p, [class*='message'], [class*='chat']").forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 10) messages.push({ role: "Unknown", content: text });
      });
    }
  } catch (e) {
    console.error("[LLM Transfer] Extraction error:", e);
  }

  return messages.filter(m => m.content.length > 0);
}
