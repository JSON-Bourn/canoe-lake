const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const fileInput = document.getElementById("fileInput");
const resultEl = document.getElementById("result");
const scanLink = document.getElementById("scanLink");

let html5QrCode = null;
let scanning = false;
let hasNavigated = false;

function setResult(text, flash = false) {
  resultEl.textContent = text;
  if (flash) {
    resultEl.classList.add("flash");
    setTimeout(() => resultEl.classList.remove("flash"), 1000);
  }
}

function updateScanLink(href = "") {
  if (!href) {
    scanLink.hidden = true;
    scanLink.removeAttribute("href");
    return;
  }
  scanLink.href = href;
  scanLink.hidden = false;
}

function resolveUrl(text) {
  if (!text) return "";

  try {
    if (/^https?:\/\//i.test(text)) return text;
    if (/^www\./i.test(text)) return "https://" + text;
  } catch {}

  return "";
}

function handleResult(decodedText) {
  if (hasNavigated) return;

  setResult("QR found: " + decodedText, true);

  const url = resolveUrl(decodedText);
  updateScanLink(url);

  stopCamera();

  if (url) {
    hasNavigated = true;
    setResult("Redirecting...", true);
    setTimeout(() => window.location.href = url, 400);
  }
}

async function startCamera() {
  if (!window.isSecureContext) {
    setResult("HTTPS required", true);
    return;
  }

  html5QrCode = new Html5Qrcode("video"); // IMPORTANT: attach to your existing UI

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: (w, h) => {
          const size = Math.min(w, h) * 0.75;
          return { width: size, height: size };
        }
      },
      (decodedText) => handleResult(decodedText),
      (err) => {
        // keep silent (iOS produces noise here)
      }
    );

    scanning = true;
    hasNavigated = false;

    setResult("Scanning...");
    startBtn.disabled = true;
    stopBtn.disabled = false;
    restartBtn.disabled = true;

  } catch (e) {
    setResult("Camera error: " + e, true);
  }
}

async function stopCamera() {
  if (!html5QrCode || !scanning) return;

  try {
    await html5QrCode.stop();
    await html5QrCode.clear();
  } catch {}

  scanning = false;

  startBtn.disabled = false;
  stopBtn.disabled = true;
  restartBtn.disabled = false;
}

function restartCamera() {
  stopCamera().then(startCamera);
}

// image upload fallback
if (fileInput) {
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode("video");
    }

    try {
      const result = await html5QrCode.scanFile(file, true);
      handleResult(result);
    } catch {
      setResult("No QR found in image", true);
    }
  });
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
restartBtn.addEventListener("click", restartCamera);