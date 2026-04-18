const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const fileInput = document.getElementById("fileInput");
const resultEl = document.getElementById("result");

let stream = null;
let scanning = false;
let rafId = null;
let barcodeDetector = null;

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

async function startCamera() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setResult("This browser does not support camera access.");
      return;
    }

    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    await video.play();

    scanning = true;
    setResult("Scanning...");

    startBtn.disabled = true;
    stopBtn.disabled = false;
    restartBtn.disabled = true;
    scanLoop();
  } catch (err) {
    alert("Error accessing camera: " + err.message);
  }
}

function stopCamera() {
  scanning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
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

function handleResult(value) {
  stopCamera();
  try {
    const url = new URL(value);
    window.location.href = url.href;
  } catch {
    setResult(value, true);
  }
}

function scanLoop() {
  if (!scanning) return;

  if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    if (barcodeDetector) {
      barcodeDetector.detect(video).then((barcodes) => {
        if (!scanning) return;

        if (barcodes.length > 0 && barcodes[0].rawValue) {
          handleResult(barcodes[0].rawValue);
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
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = window.jsQR(imageData.data, imageData.width, imageData.height);

  if (code && code.data) {
    handleResult(code.data);
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
      setResult("QR Code (from file): " + code.data, true);
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