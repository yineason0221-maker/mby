# DocuScan — Free Online Document Scanner

A privacy-first, **100 % client-side** document scanner that runs entirely in your browser.  
Upload a photo of any document — DocuScan auto-detects the four corners, corrects perspective, removes shadows, and lets you download a clean **PNG** or **PDF**.

## ✨ Features

| Feature | Status |
|---|---|
| Plain HTML + CSS + JavaScript (no React, no Python) | ✅ |
| OpenCV.js auto corner detection | ✅ |
| Auto perspective / skew correction | ✅ |
| Auto shadow & background removal | ✅ |
| 3 scan modes (Color / Grayscale / Black & White) | ✅ |
| Download PNG | ✅ |
| Download PDF | ✅ |
| Responsive (mobile + desktop) | ✅ |
| One-click deploy to GitHub Pages (free) | ✅ |

## 🚀 Quick — Deploy to GitHub Pages in 1 click

[![Deploy to GitHub Pages](https://github.com/stevekrouse/GitHubPagesDeployButton/blob/master/button.svg?raw=true)](https://github.com/new?template=your-repo-here&filename=README.md)

### One-click setup (fork & deploy)

1. **Fork** this repo (or create a new repo from this template).
2. Go to **Settings → Pages → Build and deployment**.
3. Set **Source** → **GitHub Actions**.
4. The included GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys on every push to `main`.
5. Your site is live at `https://<your-username>.github.io/<repo-name>/`!

> The deploy workflow triggers **automatically** on every push to `main`. You can also trigger it manually via **Actions → Deploy to GitHub Pages → Run workflow**.

## 🛠 Local development

```bash
# 1. Install (no dependencies required for the static build, but Node is needed for dev server)
npm install

# 2. Serve locally
npm run dev
# → http://localhost:3000

# 3. Build for production
npm run build
```

## 📖 How it works

1. **Upload** — Drag & drop or use the file picker (supports JPG, PNG, WebP, up to 10 MB).
2. **Detect** — OpenCV.js finds the document's four corners using Canny edge detection + contour approximation.
3. **Correct** — A perspective transform (homography) flattens the document to a clean rectangle.
4. **Enhance** — Background division removes shadows and normalises the background.
5. **Mode** — Choose Color, Grayscale, or Black & White output.
6. **Export** — Download as PNG or save as PDF.

## 📁 Project structure

```
document-scanner/
├── index.html            # Main page
├── css/
│   ├── style.css         # Base styles
│   ├── mobile.css        # Mobile (≤ 768px)
│   └── desktop.css       # Desktop (≥ 769px)
├── js/
│   ├── app.js            # App logic (upload, UI, download)
│   └── cv-handler.js     # OpenCV.js processing (corners, warp, shadow removal)
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions → GitHub Pages
├── package.json
└── README.md
```

## 🌐 Browser support

| Chrome | Firefox | Safari | Edge | iOS Safari | Android Chrome |
|--------|---------|--------|------|------------|-----------------|
| ✅ 70+ | ✅ 65+  | ✅ 13+ | ✅ 79+ | ✅ 13+     | ✅ 70+          |

## 🔒 Privacy

All processing happens **in your browser**. No image is uploaded to any server. You can even open the site offline after the first load.

## 📄 License

MIT
