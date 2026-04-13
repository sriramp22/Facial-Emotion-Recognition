let currentMode    = "upload";
let cameraStream   = null;
let selectedFile   = null;


function switchMode(mode) {
  currentMode = mode;

  document.getElementById("tab-upload").classList.toggle("active", mode === "upload");
  document.getElementById("tab-webcam").classList.toggle("active", mode === "webcam");

  document.getElementById("upload-ui").style.display  = mode === "upload" ? "block" : "none";
  document.getElementById("webcam-ui").style.display  = mode === "webcam" ? "block" : "none";

  if (mode !== "webcam" && cameraStream) {
    stopCamera();
  }
}


function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) loadFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById("drop-zone").classList.add("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById("drop-zone").classList.remove("drag-over");

  const file = event.dataTransfer.files[0];
  if (file) loadFile(file);
}

function loadFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    showError("Please select a JPG, PNG, or WebP image.");
    return;
  }

  selectedFile = file;

  const previewUrl = URL.createObjectURL(file);
  const preview    = document.getElementById("upload-preview");
  preview.src           = previewUrl;
  preview.style.display = "block";

  document.getElementById("drop-placeholder").style.display = "none";

  document.getElementById("analyze-upload-btn").disabled = false;
}


async function analyzeUpload() {
  if (!selectedFile) return;

  const btn = document.getElementById("analyze-upload-btn");
  btn.disabled = true;
  showLoading();

  try {
    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch("/analyze", {
      method: "POST",
      body:   formData,
    });

    const result = await response.json();

    if (result.error) {
      showError(result.error);
    } else {
      renderResults(result);
    }

  } catch (err) {
    showError("Network error — could not reach the server.");
  } finally {
    btn.disabled = false;
  }
}


async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width:  { ideal: 640 },
        height: { ideal: 480 },
      }
    });

    const video   = document.getElementById("webcam-video");
    video.srcObject   = cameraStream;
    video.style.display = "block";

    document.getElementById("webcam-placeholder").style.display = "none";
    document.getElementById("start-cam-btn").disabled = true;
    document.getElementById("snap-btn").disabled      = false;
    document.getElementById("stop-cam-btn").disabled  = false;

  } catch (err) {
    showError(
      err.name === "NotAllowedError"
        ? "Camera access was denied. Please allow camera access in your browser settings."
        : `Could not start camera: ${err.message}`
    );
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  const video = document.getElementById("webcam-video");
  video.srcObject     = null;
  video.style.display = "none";

  document.getElementById("webcam-placeholder").style.display = "flex";
  document.getElementById("start-cam-btn").disabled = false;
  document.getElementById("snap-btn").disabled      = true;
  document.getElementById("stop-cam-btn").disabled  = true;
}

function captureFrame() {
  const video  = document.getElementById("webcam-video");
  const canvas = document.createElement("canvas");

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  canvas.getContext("2d").drawImage(video, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.88);
}

async function captureAndAnalyze() {
  const btn = document.getElementById("snap-btn");
  btn.disabled = true;
  showLoading();

  try {
    const dataUrl = captureFrame();

    const response = await fetch("/analyze", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ image: dataUrl }),
    });

    const result = await response.json();

    if (result.error) {
      showError(result.error);
    } else {
      renderResults(result);
    }

  } catch (err) {
    showError("Network error — could not reach the server.");
  } finally {
    btn.disabled = false;
  }
}


function showLoading() {
  document.getElementById("results-area").innerHTML = `
    <div class="loading">
      <p class="pulse">Analyzing emotions…</p>
    </div>
  `;
}

function showError(message) {
  document.getElementById("results-area").innerHTML = `
    <div class="error-msg">${message}</div>
  `;
}

function renderResults(result) {

  if (!result.face_detected) {
    document.getElementById("results-area").innerHTML = `
      <p class="results-placeholder">
        No face detected. Please try a clearer photo with a visible face.
      </p>
    `;
    return;
  }

  const dominantColor = result.scores[0]?.color || "#818cf8";

  const badgeHTML = `
    <div class="dominant-section">
      <p class="dominant-label">Dominant Emotion</p>
      <span class="dominant-badge" style="
        background: ${dominantColor}22;
        color: ${dominantColor};
        border: 1px solid ${dominantColor}55;
      ">
        ${result.dominant} &nbsp; ${result.confidence}%
      </span>
    </div>
  `;

  const barsHTML = result.scores.map(item => `
    <div class="bar-row">
      <span class="bar-name">${item.emotion}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${item.score}%; background: ${item.color};"></div>
      </div>
      <span class="bar-pct">${item.score}%</span>
    </div>
  `).join("");

  document.getElementById("results-area").innerHTML = `
    ${badgeHTML}
    <p class="bars-label">Emotion Breakdown</p>
    ${barsHTML}
    <p class="description">${result.description}</p>
  `;
}
