const videoContainerId = "reader";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const resultEl = document.getElementById("result");
const scanLink = document.getElementById("scanLink");
const fileInput = document.getElementById("fileInput");

// Create a container for the scanner (replace your video element visually)
let readerDiv = document.createElement("div");
readerDiv.id = videoContainerId;
readerDiv.style.width = "100%";
readerDiv.style.maxWidth = "500px";

const videoWrapper = document.querySelector(".camera-preview");
videoWrapper.innerHTML = "";
videoWrapper.appendChild(readerDiv);

let html5QrCode = null;
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

function resolveScannedHref(value) {
  if (!value) return "";

  const trimmed = value.trim();

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      return new URL(trimmed).href;
    }

    if (/^www\./i.test(trimmed)) {
      return new URL(`https://${trimmed}`).href;
    }

    if (/^(\.\/|\.\.\/|\/)/.test(trimmed) || /\.html?/.test(trimmed)) {
      return new URL(trimmed, window.location.href).href;
    }
  } catch {
    return "";
  }

  return "";
}

function handleResult(decodedText) {
  if (hasNavigated) return;

  const href = resolveScannedHref(decodedText);

  setResult("QR Code found: " + decodedText, true);
  updateScanLink(href);

  stopCamera();

  if (href) {
    hasNavigated = true;
    setResult("Redirecting...", true);
    setTimeout(() => {
      window.location.assign(href);
    }, 300);
  } else {
    setResult("QR code found, but no valid URL.", true);
  }
}

async function startCamera() {
  if (!window.isSecureContext) {
    setResult("Camera requires HTTPS.", true);
    return;
  }

  html5QrCode = new Html5Qrcode(videoContainerId);

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        handleResult(decodedText);
      },
      () => {
        // ignore scan errors
      }
    );

    hasNavigated = false;
    setResult("Scanning...");
    updateScanLink();

    startBtn.disabled = true;
    stopBtn.disabled = false;
    restartBtn.disabled = true;

  } catch (err) {
    setResult("Camera error: " + err, true);
  }
}

async function stopCamera() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch {}
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
  restartBtn.disabled = false;
}

function restartCamera() {
  stopCamera().then(startCamera);
}

// Image file scanning
async function scanImageFile(file) {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode(videoContainerId);
  }

  try {
    const result = await html5QrCode.scanFile(file, true);
    handleResult(result);
  } catch {
    setResult("No QR code found in image.", true);
  }
}

// Event listeners
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

console.log("html5-qrcode scanner ready");