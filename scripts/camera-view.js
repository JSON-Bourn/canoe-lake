document.addEventListener("DOMContentLoaded", function () {
  const openButton = document.getElementById("cameraBtn");
  const stopButton = document.getElementById("stopCameraBtn");
  const preview = document.getElementById("cameraPreview");
  const video = document.getElementById("cameraFeed");
  const status = document.getElementById("cameraStatus");
  const scanResult = document.getElementById("scanResult");
  const scanLink = document.getElementById("scanLink");

  let stream;
  let scanInterval;
  let barcodeDetector;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if ("BarcodeDetector" in window) {
    barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
  }

  function setScanResult(text) {
    scanResult.hidden = false;
    scanResult.textContent = "Scanned QR: " + text;

    const trimmedText = text.trim();
    if (!trimmedText) {
      scanLink.hidden = true;
      return;
    }

    const isWebLink = /^https?:\/\//i.test(trimmedText);
    const isRelativePath = /^(\.\/|\.\.\/|\/).+/.test(trimmedText);
    const looksLikeHtmlFile = /^[\w-]+\.html?(\?.*)?$/i.test(trimmedText);

    if (isWebLink || isRelativePath || looksLikeHtmlFile) {
      scanLink.href = trimmedText;
      scanLink.hidden = false;
    } else {
      scanLink.hidden = true;
    }
  }

  async function detectQRCode() {
    if (!stream || !video.videoWidth || !video.videoHeight || !context) {
      return;
    }

    if (barcodeDetector) {
      try {
        const barcodes = await barcodeDetector.detect(video);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          setScanResult(barcodes[0].rawValue);
          status.textContent = "QR code detected.";
          stopCamera();
        }
      } catch (error) {
        console.error("BarcodeDetector scan failed:", error);
      }
      return;
    }

    if (typeof window.jsQR !== "function") {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert"
    });

    if (code && code.data) {
      setScanResult(code.data);
      status.textContent = "QR code detected.";
      stopCamera();
    }
  }

  function beginScanning() {
    if (scanInterval) {
      window.clearInterval(scanInterval);
    }

    scanInterval = window.setInterval(function () {
      detectQRCode();
    }, 250);
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = "This browser cannot open the camera. Try Chrome or Safari on mobile.";
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      video.srcObject = stream;
      await video.play();
      preview.hidden = false;
      stopButton.hidden = false;
      scanResult.hidden = true;
      scanLink.hidden = true;
      status.textContent = "Camera is live. Point it at a QR code.";
      beginScanning();
    } catch (error) {
      status.textContent = "Camera access was blocked or unavailable. Allow camera permissions and try again.";
      console.error("Unable to start camera:", error);
    }
  }

  function stopCamera() {
    if (scanInterval) {
      window.clearInterval(scanInterval);
      scanInterval = null;
    }

    if (!stream) {
      return;
    }

    stream.getTracks().forEach(function (track) {
      track.stop();
    });

    stream = null;
    video.srcObject = null;
    preview.hidden = true;
    stopButton.hidden = true;

    if (scanResult.hidden) {
      status.textContent = "Camera stopped.";
    }
  }

  openButton.addEventListener("click", startCamera);
  stopButton.addEventListener("click", stopCamera);

  window.addEventListener("beforeunload", stopCamera);
});
