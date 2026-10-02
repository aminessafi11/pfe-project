# MAKLADA PFE PROJECT
## Industrial Maintenance Intelligence Portal

A professional standalone desktop application built with **Electron + React**.  
"Ice Palace" glassmorphism theme · Bilingual EN/FR · Power BI embedded dashboards · AI Assistant chat.

---

## 🔐 Default Login Credentials

| Field    | Value      |
|----------|------------|
| Username | `maklada`  |
| Password | `pfe2025`  |

To change credentials, edit `src/authConfig.js`.

---

## 🚀 Quick Start (Development)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer
- npm v9+

```bash
# 1. Install dependencies
npm install

# 2. Launch in development mode (hot reload)
npm run electron-dev
```

---

## 🔗 Adding Your Power BI Dashboards

Open `src/dashboardConfig.js` and paste your embed URLs:

```js
const DASHBOARDS = [
  {
    id: 'financial',
    embedUrl: 'PASTE_YOUR_FINANCIAL_DASHBOARD_URL_HERE',
    ...
  },
  {
    id: 'technical',
    embedUrl: 'PASTE_YOUR_TECHNICAL_DASHBOARD_URL_HERE',
    ...
  },
  {
    id: 'ai',
    embedUrl: 'PASTE_YOUR_AI_DASHBOARD_URL_HERE',
    ...
  },
];
```

**How to get the embed URL from Power BI Service:**
1. Open your report on `app.powerbi.com`
2. Click **File → Embed report → Website or portal**
3. Copy the `src` value from the `<iframe>` tag shown

---

## 🤖 Connecting the AI Assistant

Open `src/pages/AIAssistantPage.js` and find the marked `BACKEND HOOK` section.  
Replace the `setTimeout` mock with your real API call:

```js
const response = await fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, history: messages }),
});
const data = await response.json();
addAIMessage(data.reply);
```

---

## 🏗️ Build the Windows .exe

```bash
# Builds React app then packages with Electron Builder
npm run dist-win
```

Output: `dist/` folder containing:
- `MAKLADA PFE PROJECT Setup.exe` — full installer with desktop shortcut
- `MAKLADA PFE PROJECT.exe` — portable version (no install needed)

---

## 🌐 Language

- Default language: **French**
- Toggle: top-right of the header (persistent via `localStorage`)
- Add more strings: edit `src/i18n/en.json` and `src/i18n/fr.json`

---

## 🎨 Customization

| What                        | Where                               |
|-----------------------------|-------------------------------------|
| Login background            | `src/assets/bg-login.jpg`           |
| Main background             | `src/assets/bg-main.jpg`            |
| App colors / tokens         | `src/global.css` → `:root` vars     |
| App name                    | `src/i18n/en.json` → `header.appName` |
| Login credentials           | `src/authConfig.js`                 |
| Dashboard URLs              | `src/dashboardConfig.js`            |
| Desktop icon (.exe)         | `assets/desk.ico`                   |
| Taskbar icon                | `public/logo.ico`                   |
| Sidebar labels              | `src/i18n/en.json` + `fr.json`      |

---

## 📁 Project Structure

```
maklada-pfe/
├── electron/
│   ├── main.js          # Electron main process (frameless window, IPC)
│   └── preload.js       # Secure Node ↔ React bridge
├── src/
│   ├── assets/          # bg-login.jpg, bg-main.jpg
│   ├── components/
│   │   ├── TitleBar.js  # Custom frameless window controls
│   │   ├── Sidebar.js   # Retractable 4-item navigation
│   │   └── Header.js    # App bar with lang toggle + logout
│   ├── pages/
│   │   ├── LoginPage.js         # Ice Palace login card
│   │   ├── MainLayout.js        # Shell: sidebar + header + page
│   │   ├── DashboardPage.js     # Power BI iframe embed
│   │   └── AIAssistantPage.js   # Chat UI with breathing AI avatar
│   ├── i18n/
│   │   ├── i18n.js      # i18next configuration
│   │   ├── en.json      # English strings
│   │   └── fr.json      # French strings
│   ├── authConfig.js    # ← Change login credentials here
│   ├── dashboardConfig.js  # ← Paste Power BI URLs here
│   └── global.css       # Design tokens (Ice Palace palette)
├── assets/
│   ├── desk.ico         # Windows .exe icon
│   └── logo.ico         # Header / taskbar icon
├── public/
│   └── index.html       # CSP configured for Power BI
└── package.json
```

---

## 🛡️ Security Notes

- `contextIsolation: true` — Renderer process is fully isolated
- `nodeIntegration: false` — No direct Node access from React
- CSP headers whitelist only `app.powerbi.com` for iframes
- Credentials are hardcoded for PFE demo only — not for production use

---

*Graduation Project (PFE) · Maklada Eljem · Industrial Maintenance · 2025*
