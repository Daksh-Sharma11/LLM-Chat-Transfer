🚀 Universal LLM Chat Transfer Engine
Seamlessly move your AI conversations between different Large Language Models (LLMs) with a single click. No manual highlighting, no formatting loss, and zero copy-paste friction.

This Chrome extension captures your active thread history from one platform, breaks through modern frontend reactivity walls on the target platform, and drops the context straight into the dynamic input prompt.

✨ Features
Cross-Platform Support: Instantly transfer active context between ChatGPT, Claude, Gemini, and DeepSeek.

Virtual DOM State Breaker: Bypasses framework traps (React Fiber/Props states) by deploying low-level browser InputEvent dispatches. It forces target apps to register injected text natively.

Clean Formatting: Standardizes complex multi-turn threads using structural chronological markers ([User] / [AI]).

Media Alerts: Detects images/PDFs in your source logs and issues a warning if manual file re-uploads are required.

100% Private: Operates entirely client-side via chrome.storage. No servers, no tracking, no data leaks.

📦 Quick Setup
Download/Clone this repository to your local computer.

Navigate to chrome://extensions/ in Google Chrome.

Toggle Developer mode on (top-right switch).

Click Load unpacked (top-left button) and select this project folder.

Pin the extension to your toolbar, open an LLM chat, and choose your target!

📂 File Map
manifest.json — Extension configuration footprint and host permissions.

scraper.js — Scrapes and extracts structural messages from the active DOM.

popup.html / popup.js — The compact, modern dark-theme user control panel.

background.js — Coordinates cross-tab injection using native event loops.

Suggested Repo Topics: chrome-extension, llm, chatgpt, claude, gemini, deepseek, javascript
