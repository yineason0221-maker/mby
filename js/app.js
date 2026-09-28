import { CVHandler } from './cv-handler.js';

const App = {
  init() {
    this.cvHandler = new CVHandler();
    this.originalImage = null;
    this.scannedDataUrl = null;
    this.currentMode = 'color';
    this._cvReady = false;

    this._bindElements();
    this._bindEvents();
    this._loadOpenCV();
  },

  _bindElements() {
    this.el = {
      uploadArea: document.getElementById('uploadArea'),
      fileInput: document.getElementById('fileInput'),
      editorSection: document.getElementById('editorSection'),
      originalCanvas: document.getElementById('originalCanvas'),
      scannedCanvas: document.getElementById('scannedCanvas'),
      modeSelector: document.getElementById('modeSelector'),
      modeBtns: document.querySelectorAll('.mode-btn'),
      processBtn: document.getElementById('processBtn'),
      resetBtn: document.getElementById('resetBtn'),
      downloadPng: document.getElementById('downloadPng'),
      downloadPdf: document.getElementById('downloadPdf'),
      processText: document.getElementById('processText'),
      statusBar: document.getElementById('statusBar'),
    };
  },

  _bindEvents() {
    this.el.uploadArea.addEventListener('click', () => this.el.fileInput.click());

    ['dragenter', 'dragover'].forEach(evt => {
      this.el.uploadArea.addEventListener(evt, (e) => {
        e.preventDefault();
        this.el.uploadArea.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      this.el.uploadArea.addEventListener(evt, (e) => {
        e.preventDefault();
        this.el.uploadArea.classList.remove('dragover');
      });
    });

    this.el.uploadArea.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) {
        this._handleFiles(e.dataTransfer.files);
      }
    });

    this.el.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this._handleFiles(e.target.files);
      }
    });

    this.el.modeSelector.addEventListener('click', (e) => {
      if (e.target.classList.contains('mode-btn')) {
        this._setMode(e.target.dataset.mode);
      }
    });

    this.el.processBtn.addEventListener('click', () => this._scanDocument());
    this.el.resetBtn.addEventListener('click', () => this._reset());
    this.el.downloadPng.addEventListener('click', () => this._download('png'));
    this.el.downloadPdf.addEventListener('click', () => this._download('pdf'));
  },

  _loadOpenCV() {
    this.cvHandler.load().then(() => {
      this._cvReady = true;
      this._showStatus('OpenCV ready', 2000);
    }).catch(() => {
      this._showStatus('Failed to load OpenCV', 4000);
    });
  },

  _handleFiles(fileList) {
    const file = fileList[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this._showStatus('Please select an image file', 3000);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this._showStatus('File too large (max 10MB)', 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this._drawToCanvas(img, this.el.originalCanvas);
        this.el.editorSection.style.display = 'block';
        this.el.processBtn.disabled = false;
        this.scannedDataUrl = null;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _drawToCanvas(img, canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  },

  _clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
  },

  _setMode(mode) {
    this.currentMode = mode;
    this.el.modeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    if (this.scannedDataUrl) {
      this._scanDocument();
    }
  },

  _scanDocument() {
    if (!this.originalImage) return;
    if (!this._cvReady || !this.cvHandler.cv) {
      this._showStatus('OpenCV is still loading…', 3000);
      return;
    }

    this._setProcessing(true);
    this._showStatus('Scanning…', 0);

    try {
      const cv = this.cvHandler.cv;
      const srcMat = cv.imread(this.originalImage);

      const { mat: result, hasCorner } = this.cvHandler.process(srcMat, this.currentMode);

      cv.imshow(this.el.scannedCanvas, result);
      this.scannedDataUrl = this.el.scannedCanvas.toDataURL('image/png');

      result.delete();
      srcMat.delete();

      this._showStatus(
        hasCorner ? 'Document detected and scanned!' : 'Scanned successfully',
        3000
      );
    } catch (err) {
      this._showStatus('Processing error: ' + err.message, 4000);
    } finally {
      this._setProcessing(false);
    }
  },

  _setProcessing(isProcessing) {
    this.el.processBtn.disabled = isProcessing;
    this.el.processText.textContent = isProcessing
      ? 'scanning…'
      : 'scan document';
  },

  async _download(format) {
    if (!this.scannedDataUrl) {
      this._showStatus('Please scan a document first', 3000);
      return;
    }

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = this.scannedDataUrl;
      link.download = 'scanned-document.png';
      link.click();
      this._showStatus('PNG downloaded', 2000);
      return;
    }

    if (format === 'pdf') {
      await this._generatePdf();
    }
  },

  async _generatePdf() {
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const imgData = this.el.scannedCanvas.toDataURL('image/jpeg', 0.95);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('scanned-document.pdf');

      this._showStatus('PDF downloaded', 2000);
    } catch (err) {
      this._showStatus('PDF error: ' + err.message, 4000);
    }
  },

  _reset() {
    this.originalImage = null;
    this.scannedDataUrl = null;
    this.el.editorSection.style.display = 'none';
    this._clearCanvas(this.el.originalCanvas);
    this._clearCanvas(this.el.scannedCanvas);
    this.el.fileInput.value = '';
    this._setMode('color');
    this._hideStatus();
  },

  _showStatus(message, duration = 0) {
    this.el.statusBar.textContent = message;
    this.el.statusBar.classList.add('visible');
    if (duration > 0) {
      clearTimeout(this._statusTimer);
      this._statusTimer = setTimeout(() => this._hideStatus(), duration);
    }
  },

  _hideStatus() {
    this.el.statusBar.classList.remove('visible');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
