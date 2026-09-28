export class CVHandler {
  constructor() {
    this.cv = null;
    this.onReady = null;
  }

  load() {
    return new Promise((resolve, reject) => {
      if (typeof cv !== 'undefined' && cv['Document']) {
        this.cv = cv;
        resolve(this.cv);
        return;
      }
      if (window.cv && window.cv['Document']) {
        this.cv = window.cv;
        resolve(this.cv);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.x/opencv.js';
      script.async = true;
      script.onload = () => this._waitForOpenCV(resolve, reject);
      script.onerror = () => reject(new Error('OpenCV.js failed to load'));
      document.head.appendChild(script);
    });
  }

  _waitForOpenCV(resolve, reject) {
    let tries = 0;
    const interval = setInterval(() => {
      if (typeof cv !== 'undefined' && cv['Document']) {
        clearInterval(interval);
        this.cv = cv;
        resolve(this.cv);
      }
      tries++;
      if (tries > 240) {
        clearInterval(interval);
        reject(new Error('OpenCV.js failed to initialize'));
      }
    }, 250);
  }

  findLargestContour(contours) {
    let maxArea = 0;
    let maxContour = null;
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = this.cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        if (maxContour) maxContour.delete();
        maxContour = contour;
      } else {
        contour.delete();
      }
    }
    return maxContour;
  }

  approxPolygon(contour, epsilonFactor = 0.02) {
    const peri = this.cv.arcLength(contour, true);
    const epsilon = epsilonFactor * peri;
    const approx = this.cv.Mat();
    this.cv.approxPolyDP(contour, approx, epsilon, true);
    return approx;
  }

  findDocumentCorners(srcMat) {
    const gray = this.cv.Mat();
    const edges = this.cv.Mat();
    const dilated = this.cv.Mat();
    const contours = new this.cv.MatVector();
    const hierarchy = this.cv.Mat();

    this.cv.cvtColor(srcMat, gray, this.cv.COLOR_RGBA2GRAY);
    this.cv.GaussianBlur(gray, gray, new this.cv.Size(5, 5), 0);
    this.cv.Canny(gray, edges, 50, 150);
    const kernel = this.cv.getStructuringElement(this.cv.MORPH_RECT, new this.cv.Size(3, 3));
    this.cv.dilate(edges, dilated, kernel);

    this.cv.findContours(
      dilated, contours, hierarchy,
      this.cv.RETR_EXTERNAL, this.cv.CHAIN_APPROX_SIMPLE
    );

    let bestContour = null;
    let maxArea = 0;
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      const approx = this.approxPolygon(cnt, 0.02);
      if (approx.rows === 4) {
        const area = Math.abs(this.cv.contourArea(approx));
        if (area > maxArea && area > srcMat.rows * srcMat.cols * 0.01) {
          maxArea = area;
          if (bestContour) bestContour.delete();
          bestContour = approx;
        } else {
          approx.delete();
        }
      } else {
        approx.delete();
      }
      cnt.delete();
    }

    gray.delete();
    edges.delete();
    dilated.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();

    return bestContour;
  }

  orderPoints(points) {
    const pts = [];
    for (let i = 0; i < points.rows; i++) {
      pts.push({ x: points.floatAt(i, 0), y: points.floatAt(i, 1) });
    }

    pts.sort((a, b) => (a.x + a.y) - (b.x + b.y));
    const topLeft = pts[0];
    const bottomRight = pts[3];

    const mid = pts.slice(1, 3);
    let topRight, bottomLeft;
    if (mid[0].x > mid[1].x) {
      topRight = mid[0];
      bottomLeft = mid[1];
    } else {
      topRight = mid[1];
      bottomLeft = mid[0];
    }

    return [topLeft, topRight, bottomRight, bottomLeft];
  }

  fourPointTransform(src, ordered) {
    const [tl, tr, br, bl] = ordered;
    const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
    const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const maxWidth = Math.max(Math.ceil(widthA), Math.ceil(widthB));

    const heightA = Math.hypot(br.x - tr.x, br.y - tr.y);
    const heightB = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const maxHeight = Math.max(Math.ceil(heightA), Math.ceil(heightB));

    const dst = this.cv.matFromArray(
      4, 1, this.cv.CV_32FC2,
      [0, 0, maxWidth - 1, 0, maxWidth - 1, maxHeight - 1, 0, maxHeight - 1]
    );
    const srcPts = this.cv.matFromArray(
      4, 1, this.cv.CV_32FC2,
      [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]
    );
    const M = this.cv.getPerspectiveTransform(srcPts, dst);
    const warped = this.cv.Mat(maxWidth, maxHeight, src.type());
    this.cv.warpPerspective(src, warped, M, new this.cv.Size(maxWidth, maxHeight));

    srcPts.delete();
    dst.delete();
    M.delete();
    return warped;
  }

  enhanceDocument(mat) {
    // Shadow removal + background normalization via background division (grayscale)
    const gray = this.cv.Mat();
    this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

    const blurred = this.cv.Mat();
    this.cv.GaussianBlur(gray, blurred, new this.cv.Size(15, 15), 0);

    const normalized = this.cv.Mat();
    this.cv.divide(gray, blurred, normalized, 255.0, this.cv.CV_8U);

    const result = this.cv.Mat();
    this.cv.cvtColor(normalized, result, this.cv.COLOR_GRAY2RGBA);

    gray.delete();
    blurred.delete();
    normalized.delete();
    mat.delete();
    return result;
  }

  enhanceDocumentColor(mat) {
    // Color-preserving shadow/background removal
    // Split RGBA into RGB, divide each channel by its blurred version, merge back
    const rgb = this.cv.Mat();
    this.cv.cvtColor(mat, rgb, this.cv.COLOR_RGBA2RGB);

    const channels = new this.cv.MatVector();
    this.cv.split(rgb, channels);

    for (let i = 0; i < 3; i++) {
      const ch = channels.get(i);
      const blurred = this.cv.Mat();
      this.cv.GaussianBlur(ch, blurred, new this.cv.Size(15, 15), 0);
      const normalized = this.cv.Mat();
      this.cv.divide(ch, blurred, normalized, 255.0, this.cv.CV_8U);
      channels.set(i, normalized);
      ch.delete();
      blurred.delete();
      normalized.delete();
    }
    this.cv.merge(channels, rgb);

    const result = this.cv.Mat();
    this.cv.cvtColor(rgb, result, this.cv.COLOR_RGB2RGBA);

    rgb.delete();
    channels.delete();
    mat.delete();
    return result;
  }

  applyMode(mat, mode) {
    if (mode === 'color') {
      return mat;
    }
    if (mode === 'gray') {
      const gray = this.cv.Mat();
      this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);
      // Contrast boost for photocopier look
      this.cv.multiply(gray, gray, gray, 1.2, this.cv.CV_8U);
      this.cv.cvtColor(gray, mat, this.cv.COLOR_GRAY2RGBA);
      gray.delete();
      return mat;
    }
    if (mode === 'bw') {
      const gray = this.cv.Mat();
      this.cv.cvtColor(mat, gray, this.cv.COLOR_RGBA2GRAY);

      // Unsharp mask for crisp text
      const blurred = this.cv.Mat();
      this.cv.GaussianBlur(gray, blurred, new this.cv.Size(3, 3), 0);
      const sharpened = this.cv.Mat();
      this.cv.subtract(gray, blurred, sharpened);
      this.cv.add(gray, sharpened, gray);
      blurred.delete();
      sharpened.delete();

      const bw = this.cv.Mat();
      this.cv.adaptiveThreshold(
        gray, bw, 255,
        this.cv.ADAPTIVE_THRESH_GAUSSIAN,
        this.cv.THRESH_BINARY, 11, 4
      );

      // Morphological opening to clean noise
      const kernel = this.cv.getStructuringElement(this.cv.MORPH_ELLIPSE, new this.cv.Size(3, 3));
      const cleaned = this.cv.Mat();
      this.cv.morphologyEx(bw, cleaned, this.cv.MORPH_OPEN, kernel);
      kernel.delete();
      bw.delete();

      this.cv.cvtColor(cleaned, mat, this.cv.COLOR_GRAY2RGBA);
      gray.delete();
      cleaned.delete();
      return mat;
    }
    return mat;
  }

  process(srcMat, mode) {
    // Input srcMat is RGBA (from cv.imread of an HTMLImageElement)
    const corners = this.findDocumentCorners(srcMat);
    let warped;
    let hasCorner = false;

    if (corners && corners.rows === 4) {
      const ordered = this.orderPoints(corners);
      warped = this.fourPointTransform(srcMat, ordered);
      hasCorner = true;
      corners.delete();
    } else {
      if (corners) corners.delete();
      warped = srcMat.clone();
    }

    // Enhance: shadow + background removal
    if (mode === 'color') {
      warped = this.enhanceDocumentColor(warped);
    } else {
      warped = this.enhanceDocument(warped);
    }

    // Apply final mode
    warped = this.applyMode(warped, mode);

    return { mat: warped, hasCorner };
  }
}
