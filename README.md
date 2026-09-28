# DocuScan — 免費線上掃掖器

一個**完全在瀏覽器端**執行的隱私友好文件掃描器。  
上傳照片或使用手機相機拍攝文件 — DocuScan 會自動偵測四個角落、校正透視、去陰影，並以**影印機般清晰**的效果輸出 **PNG** 或 **PDF**。

## ✨ 功能

| 功能 | 狀態 |
|---|---|
| 純 HTML + CSS + JavaScript（無 React、無 Python） | ✅ |
| OpenCV.js 自動偵測文件四個角落 | ✅ |
| 自動拉平與透視校正 | ✅ |
| 自動去陰影與背景 | ✅ |
| 手機相機拍照掃描 | ✅ |
| 三種掃描模式（彩色／灰階／黑白） | ✅ |
| 下載 PNG | ✅ |
| 下載 PDF | ✅ |
| RWD 手機與電腦雙端支援 | ✅ |
| 一鍵部署到 GitHub Pages（免費網址） | ✅ |

## 🚀 部署到 GitHub Pages（一鍵）

### 步驟 1 — 初始化 GitHub 倉庫

在終端機執行以下指令（或在瀏覽器 [github.com/new](https://github.com/new) 建立名為 `mby` 的公開倉庫）：

```bash
gh auth login --web
gh repo create yineason0221-maker/mby --public --source=. --push
```

### 步驟 2 — 啟用 GitHub Pages

推送完成後前往：
> **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**

等待 Actions 執行完畢，您的網站即上線：
```
https://yineason0221-maker.github.io/mby/
```

> 推送到 `main` 分支時會**自動建置並部署**，無需手動操作。

## 🛠️ 本地開發

```bash
npm install      # 安裝 devDependency（仅需 serve）
npm run build    # 建置到 dist/
npm run dev      # 啟動本地伺服器 http://localhost:3000
```

## 📖 使用說明

1. **拍照** — 點擊「拍照掃描」使用手機相機，或點擊「選取圖片」從相簿選擇。
2. **偵測** — OpenCV.js 自動偵測文件邊緣的四個角落。
3. **校正** — 透視變換將文件拉平為矩形。
4. **增強** — 背景除法演算法去除陰影，使背景變白。
5. **模式** — 選擇「彩色」、「灰階」或「黑白」。
6. **匯出** — 下載 PNG 或 PDF。

## 📁 專案架構

```
document-scanner/
├── index.html            # 主頁面
├── css/
│   ├── style.css         # 共用樣式
│   ├── mobile.css        # 手機版（≤768px）
│   └── desktop.css       # 桌面版（≥769px）
├── js/
│   ├── app.js            # 應用邏輯（上傳、相機、UI、下載）
│   └── cv-handler.js     # OpenCV.js 處理（角點、透視、去陰影、模式）
├── scripts/
│   └── build.js          # 跨平台建置腳本
├── .github/workflows/
│   └── deploy.yml        # 自動部署 workflow
├── package.json
└── README.md
```

## 🔒 隱私政策

所有影像處理均在您的瀏覽器中進行，**不會上傳至任何伺服器**。

## 📄 License

MIT
