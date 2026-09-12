# 🖼️➡️📄 Pic2Doc

**A fast, private, browser-based Image to PDF converter.**
Upload images, hit convert, download your PDF — nothing ever leaves your device.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![No backend](https://img.shields.io/badge/backend-none-7C5CFC)
![Made with](https://img.shields.io/badge/made%20with-HTML%2FCSS%2FJS-4FD1C5)

## ✨ Features

- 📤 Drag-and-drop or click-to-browse image upload (JPG, JPEG, PNG, WebP)
- 🖼️ Live thumbnail grid with per-image remove, plus a one-click "Clear all"
- ⚡ Instant client-side PDF generation with [jsPDF](https://github.com/parallax/jsPDF) — no server, no upload
- 🎉 Polished UI: animated gradient background, entrance animations, hover effects, and a confetti celebration on success
- 📱 Fully responsive, works on desktop and mobile
- 🔒 Private by design — your images never leave your browser

## 🚀 Live demo

_Add your deployed URL here once you publish it (e.g. via GitHub Pages, Vercel, or Netlify)._

## 🛠️ Tech stack

Plain HTML, CSS, and JavaScript — no build step, no dependencies to install.

- [jsPDF](https://github.com/parallax/jsPDF) (loaded via CDN) for PDF generation
- Native browser APIs: File, Canvas-free `Image`, `URL.createObjectURL`

## 📂 Project structure

```text
pic2doc/
├── index.html    # App markup
├── style.css     # All styling & animations
├── script.js     # Upload, convert, and download logic
├── LICENSE
└── README.md
```

## ▶️ Running locally

No build tools needed.

**Option A — just open it**
Double-click `index.html` to open it in your browser.

**Option B — local server (optional)**
```bash
npx serve .
# or
python3 -m http.server 5173
```
Then visit `http://localhost:5173`.

## 🌐 Deploying

Pic2Doc is a static site, so any static host works:

- **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root.
- **Vercel**: import the repo, no build command needed.
- **Netlify**: drag-and-drop the folder, or connect the repo (no build command, publish directory `.`).

## 🔐 Privacy

All image processing and PDF generation happens locally in your browser. Images are never uploaded to a server or any third-party API.

## 📄 License

Released under the [MIT License](./LICENSE).
