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

### Step 2.5 Because we have only been running the development server (npm run dev), Vite hasn't actually generated those static files yet, so the dist folder doesn't exist. Electron is looking for a file that isn't there, resulting in a blank screen.
(Note: You can safely ignore the "Access is denied" cache warnings at the top of your log. Those are very common, harmless Electron quirks on Windows).)
```bash
npm run build
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

#=======================================================================================================================#

Here is the bulletproof way to fix this Windows conflict.
1. Rename Your Desktop File

In your project folder (I:\Gargadusa Apps Project-latest\desktop-mode), find the file named electron.js (or elextron.js) and rename it to main.js.

(This removes the conflict so Windows doesn't get confused by the word "electron" anymore).
2. Update package.json

Since you renamed the file, you need to tell package.json where the new entry point is.
Open package.json and change line 6 from "main": "electron.js", to "main": "main.js",.
& add npx on "desktop:run": "npx electron .",

3. Force the Correct Command

To guarantee Windows never makes this mistake again, we can use npx in your script. npx strictly tells your computer, "Do not guess. Use the npm module."

Change your "desktop:run" script to include npx. Your updated package.json lines should look exactly like this:

"main": "main.js",
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit",
    "desktop:run": "npx electron .",
    "desktop:build": "vite build && electron-builder"
  },
  
#=======================================================================================================================#

## 🔒 Security & Performance Features Included
1. **Context Isolation**: Direct system APIs are isolated securely inside `preload.cjs`.
2. **Offline-First Persistence**: Data stored in locally bound `localStorage` keys automatically carries over into the desktop sandbox, allowing you to run your tactical squads offline.
