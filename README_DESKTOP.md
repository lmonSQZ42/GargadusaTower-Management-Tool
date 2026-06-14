# 🖥️ Packaging as a Standalone Desktop Executable (.exe)

This application is fully compatible and optimized to be compiled into a local, high-performance desktop application for Windows, MacOS, or Linux.

We have pre-configured relative path resolution (`base: './'`) in `vite.config.ts`, written the Electron Main framework (`electron.js`), and provided safe context bridging (`preload.cjs`).

---

## ⚡ Quick 3-Step Setup on Your Local Machine

Once you download the ZIP or export this repository to your local computer, follow these simple steps inside your terminal:

### Step 1: Install Electron Utilities
Ensure you have Node.js installed, then install Electron and the compiler developer tools inside the project:
```bash
npm install --save-dev electron electron-builder
```

### Step 2: Add Package Manifest Metadata
Ensure your `package.json` contains a `"main": "electron.js"` property to direct Electron to our bootstrap script. Add this line right above `"scripts"`:
```json
"main": "electron.js",
```

### Step 3: Run or Build the Standalone Application
To launch the app on your computer during local development:
```bash
# Serves assets on localhost:3000 and anchors them instantly
npm run desktop:run
```

To compile and package everything into an offline-ready, portable `.exe` installer inside a freshly generated `/dist` directory:
```bash
# Compiles React files & packages them into a portable installation file
npm run desktop:build
```

---

## 🔒 Security & Performance Features Included
1. **Context Isolation**: Direct system APIs are isolated securely inside `preload.cjs`.
2. **Offline-First Persistence**: Data stored in locally bound `localStorage` keys automatically carries over into the desktop sandbox, allowing you to run your tactical squads offline.
