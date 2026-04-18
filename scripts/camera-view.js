const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const overlay = document.getElementById("overlay");
const overlayCtx = overlay ? overlay.getContext("2d") : null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const fileInput = document.getElementById("fileInput");
const resultEl = document.getElementById("result");
const scanLink = document.getElementById("scanLink");

let stream = null;
let scanning = false;
let rafId = null;
let barcodeDetector = null;
let lastScanAt = 0;

const SCAN_INTERVAL_MS = 180;
const MAX_SCAN_DIMENSION = 960;

if ("BarcodeDetector" in window) {
  try {
    barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
  } catch (error) {
    barcodeDetector = null;
  }
}

function setResult(text, flash = false) {
  if (!resultEl) {
    return;
  }

  resultEl.textContent = text;
  if (flash) {
    resultEl.classList.add("flash");
    window.setTimeout(() => resultEl.classList.remove("flash"), 1000);
  }
}

function updateScanLink(href = "") {
  if (!scanLink) {
    return;
  }

  if (!href) {
    scanLink.hidden = true;
    scanLink.removeAttribute("href");
    return;
  }

  scanLink.href = href;
  scanLink.hidden = false;
}

function clearOverlay() {
  if (!overlayCtx || !overlay) {
    return;
  }

  overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
}

function syncOverlaySize() {
  if (!overlay || !video.videoWidth || !video.videoHeight) {
    return;
  }

  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
}

function getScaledScanSize(width, height) {
  const largestDimension = Math.max(width, height);

  if (!largestDimension || largestDimension <= MAX_SCAN_DIMENSION) {
    return { width, height, scaleX: 1, scaleY: 1 };
  }

  const ratio = MAX_SCAN_DIMENSION / largestDimension;

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
    scaleX: width / Math.round(width * ratio),
    scaleY: height / Math.round(height * ratio),
  };
}

function scaleLocation(location, scaleX, scaleY) {
  if (!location) {
    return null;
  }

  const scalePoint = (point) => {
    if (!point) {
      return null;
    }

    return {
      x: point.x * scaleX,
      y: point.y * scaleY,
    };
  };

  return {
    topLeftCorner: scalePoint(location.topLeftCorner),
    topRightCorner: scalePoint(location.topRightCorner),
    bottomRightCorner: scalePoint(location.bottomRightCorner),
    bottomLeftCorner: scalePoint(location.bottomLeftCorner),
  };
}

function isLikelyNavigableTarget(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmedValue = value.trim();
  return /^(https?:|\.\/|\.\.\/|\/|[^\s?#]+\.html(?:[?#].*)?)$/i.test(trimmedValue);
}

function drawDetectionOutline(location) {
  if (!overlayCtx || !overlay || !location) {
    return;
  }

  syncOverlaySize();
  clearOverlay();

  const points = [
    location.topLeftCorner,
    location.topRightCorner,
    location.bottomRightCorner,
    location.bottomLeftCorner,
  ].filter(Boolean);

  if (points.length !== 4) {
    return;
  }

  overlayCtx.strokeStyle = "#F1DD42";
  overlayCtx.lineWidth = 8;
  overlayCtx.fillStyle = "rgba(241, 221, 66, 0.18)";
  overlayCtx.beginPath();
  overlayCtx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    overlayCtx.lineTo(points[index].x, points[index].y);
  }
  overlayCtx.closePath();
  overlayCtx.fill();
  overlayCtx.stroke();
}

function normalizeScanValue(value) {
  if (typeof value !== "string") {
    return { text: "", href: "" };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { text: "", href: "" };
  }

  if (!isLikelyNavigableTarget(trimmedValue)) {
    return { text: trimmedValue, href: "" };
  }

  try {
    return {
      text: trimmedValue,
      href: new URL(trimmedValue, window.location.href).href,
    };
  } catch {
    return { text: trimmedValue, href: "" };
  }
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setResult("This browser does not support camera access.");
      return;
    }

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    await video.play();

    const [track] = stream.getVideoTracks();
    if (track) {
      const capabilities = typeof track.getCapabilities === "function" ? track.getCapabilities() : null;
      const advanced = [];

      if (capabilities?.focusMode && capabilities.focusMode.includes("continuous")) {
        advanced.push({ focusMode: "continuous" });
      }

      if (capabilities?.zoom && typeof capabilities.zoom.max === "number" && capabilities.zoom.max >= 1.5) {
        advanced.push({ zoom: Math.min(2, capabilities.zoom.max) });
      }

      if (advanced.length > 0) {
        try {
          await track.applyConstraints({ advanced });
        } catch (error) {
          // Ignore unsupported mobile camera constraint combinations.
        }
      }
    }

    scanning = true;
    lastScanAt = 0;
    updateScanLink();
    clearOverlay();
    setResult("Scanning... Hold the QR code steady inside the frame.");

    startBtn.disabled = true;
    stopBtn.disabled = false;
    restartBtn.disabled = true;
    scanLoop();
  } catch (err) {
    alert("Error accessing camera: " + err.message);
  }
}

function stopCamera({ clearHighlight = true } = {}) {
  scanning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (clearHighlight) {
    clearOverlay();
  }
  if (stream) {
    video.srcObject = null;
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  video.pause();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  restartBtn.disabled = false;
}

function restartCamera() {
  stopCamera();
  startCamera();
}

function handleResult(value, location = null) {
  const normalized = normalizeScanValue(value);

  if (!normalized.text) {
    return;
  }

  drawDetectionOutline(location);
  setResult("QR code found: " + normalized.text, true);
  updateScanLink(normalized.href);
  stopCamera({ clearHighlight: false });

  if (normalized.href) {
    window.setTimeout(() => {
      window.location.href = normalized.href;
    }, 350);
  }
}

function scanLoop() {
  if (!scanning) return;

  const now = performance.now();
  if (now - lastScanAt < SCAN_INTERVAL_MS) {
    rafId = requestAnimationFrame(scanLoop);
    return;
  }
  lastScanAt = now;

  if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    if (barcodeDetector) {
      barcodeDetector.detect(video).then((barcodes) => {
        if (!scanning) return;

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          handleResult(barcodes[0].rawValue, barcodes[0].cornerPoints ? {
            topLeftCorner: barcodes[0].cornerPoints[0],
            topRightCorner: barcodes[0].cornerPoints[1],
            bottomRightCorner: barcodes[0].cornerPoints[2],
            bottomLeftCorner: barcodes[0].cornerPoints[3],
          } : null);
          return;
        }

        scanWithJsQR();
        rafId = requestAnimationFrame(scanLoop);
      }).catch(() => {
        if (!scanning) return;
        scanWithJsQR();
        rafId = requestAnimationFrame(scanLoop);
      });
      return;
    }

    scanWithJsQR();
  }

  rafId = requestAnimationFrame(scanLoop);
}

function scanWithJsQR() {
  if (typeof window.jsQR !== "function") {
    setResult("QR scanner library did not load.");
    return;
  }

  const scanSize = getScaledScanSize(video.videoWidth, video.videoHeight);

  canvas.width = scanSize.width;
  canvas.height = scanSize.height;
  syncOverlaySize();
  clearOverlay();
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (code && code.data) {
    handleResult(code.data, scaleLocation(code.location, scanSize.scaleX, scanSize.scaleY));
  }
}

function scanImageFile(file) {
  const img = new Image();
  img.onload = () => {
    const scanSize = getScaledScanSize(img.width, img.height);

    canvas.width = scanSize.width;
    canvas.height = scanSize.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code && code.data) {
      const normalized = normalizeScanValue(code.data);
      setResult("QR code found in photo: " + normalized.text, true);
      updateScanLink(normalized.href);
      if (normalized.href) {
        window.location.href = normalized.href;
      }
    } else {
      setResult("No QR code found in image.");
      updateScanLink();
    }
  };

  img.src = URL.createObjectURL(file);
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
restartBtn.addEventListener("click", restartCamera);
if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      scanImageFile(e.target.files[0]);
    }
  });
}