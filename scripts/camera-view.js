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
let hasNavigated = false;
let lastJsQrAttemptAt = 0;
let hasWarnedAboutJsQrLoad = false;

const JSQR_INTERVAL_MS = 180;
const MAX_SCAN_DIMENSION = 640;

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

function resolveScannedHref(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    if (/^https?:\/\//i.test(trimmedValue) || /^file:\/\//i.test(trimmedValue)) {
      return new URL(trimmedValue).href;
    }

    if (/^www\./i.test(trimmedValue)) {
      return new URL(`https://${trimmedValue}`).href;
    }

    if (/^(\.\/|\.\.\/|\/)/.test(trimmedValue) || /\.html?(?:[?#].*)?$/i.test(trimmedValue)) {
      return new URL(trimmedValue, window.location.href).href;
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeScanValue(value) {
  if (typeof value !== "string") {
    return { text: "", href: "" };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { text: "", href: "" };
  }

  return {
    text: trimmedValue,
    href: resolveScannedHref(trimmedValue),
  };
}

async function startCamera() {
  try {
    if (!window.isSecureContext) {
      setResult("Camera requires HTTPS on iPhone. Open this site over HTTPS (not plain HTTP).", true);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setResult("This browser does not support camera access.");
      return;
    }

    const preferredConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" },
      });
    }

    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.muted = true;
    video.srcObject = stream;
    await video.play();

    scanning = true;
    hasNavigated = false;
    updateScanLink();
    clearOverlay();
    setResult("Scanning...");

    startBtn.disabled = true;
    stopBtn.disabled = false;
    restartBtn.disabled = true;
    scanLoop();
  } catch (err) {
    setResult("Unable to access camera: " + err.message, true);
  }
}

function stopCamera() {
  scanning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  clearOverlay();
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
  if (hasNavigated) {
    return;
  }

  const normalized = normalizeScanValue(value);

  if (!normalized.text) {
    return;
  }

  drawDetectionOutline(location);
  setResult("QR Code found: " + normalized.text, true);
  updateScanLink(normalized.href);
  stopCamera();

  if (normalized.href) {
    hasNavigated = true;
    setResult("QR Code found. Redirecting...", true);
    window.setTimeout(() => {
      window.location.assign(normalized.href);
    }, 350);
  } else {
    setResult("QR code found, but it does not contain a navigable URL.", true);
  }
}

function scanLoop() {
  if (!scanning) return;

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
    if (!hasWarnedAboutJsQrLoad) {
      setResult("Loading QR scanner library...");
      hasWarnedAboutJsQrLoad = true;
    }
    return;
  }
  hasWarnedAboutJsQrLoad = false;

  const now = performance.now();
  if (now - lastJsQrAttemptAt < JSQR_INTERVAL_MS) {
    return;
  }
  lastJsQrAttemptAt = now;

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const scale = Math.min(1, MAX_SCAN_DIMENSION / Math.max(sourceWidth, sourceHeight));

  canvas.width = Math.max(1, Math.floor(sourceWidth * scale));
  canvas.height = Math.max(1, Math.floor(sourceHeight * scale));

  syncOverlaySize();
  clearOverlay();
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (code && code.data) {
    handleResult(code.data, code.location);
    return;
  }

  const cropWidth = Math.floor(canvas.width * 0.7);
  const cropHeight = Math.floor(canvas.height * 0.7);
  const cropX = Math.floor((canvas.width - cropWidth) / 2);
  const cropY = Math.floor((canvas.height - cropHeight) / 2);

  if (cropWidth > 0 && cropHeight > 0) {
    const croppedImageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
    const croppedCode = window.jsQR(croppedImageData.data, croppedImageData.width, croppedImageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (croppedCode && croppedCode.data) {
      handleResult(croppedCode.data, null);
    }
  }
}

function scanImageFile(file) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      handleResult(code.data, code.location || null);
    } else {
      setResult("No QR code found in image.");
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