document.addEventListener("DOMContentLoaded", function () {
  const openButton = document.getElementById("cameraBtn");
  const stopButton = document.getElementById("stopCameraBtn");
  const preview = document.getElementById("cameraPreview");
  const video = document.getElementById("cameraFeed");
  const status = document.getElementById("cameraStatus");

  let stream;

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
      preview.hidden = false;
      stopButton.hidden = false;
      status.textContent = "Camera is live. Point it at a QR code.";
    } catch (error) {
      status.textContent = "Camera access was blocked or unavailable. Allow camera permissions and try again.";
      console.error("Unable to start camera:", error);
    }
  }

  function stopCamera() {
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
    status.textContent = "Camera stopped.";
  }

  openButton.addEventListener("click", startCamera);
  stopButton.addEventListener("click", stopCamera);

  window.addEventListener("beforeunload", stopCamera);
});
