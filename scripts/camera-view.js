const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resultEl = document.getElementById("result");

let html5QrCode = null;
let scanning = false;

function setResult(text) {
  resultEl.textContent = text;
}

async function startCamera() {
  if (!window.isSecureContext) {
    setResult("Camera requires HTTPS");
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,

        // BIG FIX: dynamic scan area
        qrbox: (w, h) => {
          const size = Math.min(w, h) * 0.8;
          return { width: size, height: size };
        }
      },

      // SUCCESS
      (decodedText) => {
        console.log("DETECTED:", decodedText);
        setResult("Detected: " + decodedText);

        stopCamera();

        // Redirect if URL
        if (/^https?:\/\//i.test(decodedText)) {
          setTimeout(() => {
            window.location.href = decodedText;
          }, 500);
        }
      },

      // ERROR (important for debugging)
      (errorMessage) => {
        console.log("Scan error:", errorMessage);
      }
    );

    scanning = true;
    setResult("Scanning...");

    startBtn.disabled = true;
    stopBtn.disabled = false;

  } catch (err) {
    setResult("Camera error: " + err);
  }
}

async function stopCamera() {
  if (!html5QrCode || !scanning) return;

  try {
    await html5QrCode.stop();
    await html5QrCode.clear();
  } catch (e) {
    console.log("Stop error:", e);
  }

  scanning = false;

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);