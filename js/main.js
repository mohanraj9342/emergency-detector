const video = document.getElementById("webcam");
const uploadPreview = document.getElementById("uploadPreview");
const overlay = document.getElementById("overlay");
const overlayCtx = overlay.getContext("2d");

const cameraModeBtn = document.getElementById("cameraModeBtn");
const uploadModeBtn = document.getElementById("uploadModeBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadBtn = document.getElementById("uploadBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearUploadBtn = document.getElementById("clearUploadBtn");
const clearCameraBtn = document.getElementById("clearCameraBtn");
const fileInput = document.getElementById("fileInput");
const cameraControls = document.getElementById("cameraControls");
const uploadControls = document.getElementById("uploadControls");
const loadingMask = document.getElementById("loadingMask");
const engineState = document.getElementById("engineState");

const alertBadge = document.getElementById("alertBadge");
const emergencyScoreText = document.getElementById("emergencyScore");
const normalScoreText = document.getElementById("normalScore");
const rawScoreText = document.getElementById("rawScore");
const emergencyBar = document.getElementById("emergencyBar");

let stream = null;
let running = false;
let loopHandle = null;
let currentMode = "camera";
let lastInferAt = 0;
const INFER_INTERVAL_MS = 550;

async function requestUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    const legacyGetUserMedia =
        navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!legacyGetUserMedia) {
        throw new Error("Camera API unavailable. Use modern browser over localhost/https.");
    }

    return new Promise((resolve, reject) => {
        legacyGetUserMedia.call(navigator, constraints, resolve, reject);
    });
}

function setEngine(text) {
    engineState.textContent = text;
}

function setLoadingText(text) {
    const lt = document.getElementById('loadingText');
    if (lt) lt.textContent = text;
}

function setAlert(result) {
    const emergencyPercent = (result.emergencyProbability * 100).toFixed(2);
    const normalPercent = (result.nonEmergencyProbability * 100).toFixed(2);
    const raw = result.raw.toFixed(4);

    emergencyScoreText.textContent = `${emergencyPercent}%`;
    if (normalScoreText) normalScoreText.textContent = `${normalPercent}%`;  // guard — element may not be in DOM
    rawScoreText.textContent = raw;

    emergencyBar.style.width = `${emergencyPercent}%`;

    if (result.isEmergency) {
        alertBadge.textContent = "EMERGENCY";
        alertBadge.className   = "threat-badge emergency";
    } else {
        alertBadge.textContent = "NO EMERGENCY";
        alertBadge.className   = "threat-badge normal";
    }

    // Drive the new SVG gauges & alert card
    if (typeof updateSentinelUI === 'function') updateSentinelUI(result);
}

function switchMode(mode) {
    currentMode = mode;
    cameraModeBtn.classList.toggle("active", mode === "camera");
    uploadModeBtn.classList.toggle("active", mode === "upload");

    cameraControls.hidden = mode !== "camera";
    uploadControls.hidden = mode !== "upload";

    if (mode === "camera") {
        uploadPreview.hidden = true;
        video.hidden = false;
        overlay.style.display = "block";
        loadingMask.style.display = running ? "none" : "grid";
        setLoadingText(running ? "" : "Ready");
    } else {
        stopCamera();
        video.hidden = true;
        overlay.style.display = "none";
        // Show placeholder box in upload mode too (hidden when image is loaded)
        if (uploadPreview.hidden || !uploadPreview.src) {
            loadingMask.style.display = "grid";
            setLoadingText("Choose an image");
        } else {
            loadingMask.style.display = "none";
        }
    }
}

async function startCamera() {
    if (running) return;

    try {
        setEngine("Loading model");
        setLoadingText("Loading model...");
        loadingMask.style.display = "grid";
        if (typeof setStatusDot === 'function') setStatusDot('idle');
        await loadOldEmergencyModel();

        setEngine("Starting camera");
        setLoadingText("Starting camera...");
        stream = await requestUserMedia({
            video: { facingMode: "environment", width: 640, height: 480 },
            audio: false
        });

        video.srcObject = stream;
        await video.play();

        running = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        loadingMask.style.display = "none";
        setEngine("Running");
        if (typeof setStatusDot   === 'function') setStatusDot('active');
        if (typeof setScanOverlay === 'function') setScanOverlay(true);

        const loop = async () => {
            if (!running) return;

            const now = performance.now();
            if (now - lastInferAt > INFER_INTERVAL_MS) {
                lastInferAt = now;
                try {
                    const result = await predictEmergency(video);
                    setAlert(result);

                    overlay.width = video.videoWidth || 640;
                    overlay.height = video.videoHeight || 480;
                    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
                    // Neon border color
                    overlayCtx.strokeStyle = result.isEmergency ? "#ff3d6e" : "#10ffa0";
                    overlayCtx.shadowColor = result.isEmergency ? "#ff3d6e" : "#10ffa0";
                    overlayCtx.shadowBlur  = 10;
                    overlayCtx.lineWidth = 2;
                    overlayCtx.strokeRect(10, 10, overlay.width - 20, overlay.height - 20);
                } catch (err) {
                    setEngine("Prediction error");
                    if (typeof setStatusDot === 'function') setStatusDot('error');
                    console.error(err);
                }
            }

            loopHandle = requestAnimationFrame(loop);
        };

        loopHandle = requestAnimationFrame(loop);
    } catch (err) {
        console.error(err);
        setEngine("Camera error");
        setLoadingText(`Error: ${err.message}`);
        if (typeof setStatusDot === 'function') setStatusDot('error');
    }
}

function stopCamera() {
    if (loopHandle !== null) {
        cancelAnimationFrame(loopHandle);
        loopHandle = null;
    }
    if (stream) {
        stream.getTracks().forEach((t) => t.stop());
    }

    stream = null;
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    setEngine("Stopped");
    if (typeof setStatusDot   === 'function') setStatusDot('idle');
    if (typeof setScanOverlay === 'function') setScanOverlay(false);

    if (currentMode === "camera") {
        loadingMask.style.display = "grid";
        setLoadingText("Ready");
    }
}

async function analyzeUploadedImage() {
    if (!uploadPreview.src) return;

    try {
        setEngine("Analyzing upload");
        if (typeof setStatusDot === 'function') setStatusDot('idle');
        await loadOldEmergencyModel();
        const result = await predictEmergency(uploadPreview);
        setAlert(result);
        setEngine("Upload analyzed");
        if (typeof setStatusDot === 'function') setStatusDot('active');
    } catch (err) {
        console.error(err);
        setEngine("Upload error");
        if (typeof setStatusDot === 'function') setStatusDot('error');
    }
}

/**
 * Resets all prediction output to the default "NO EMERGENCY" / zero state.
 * Does NOT stop the camera or remove the uploaded image.
 */
function resetPrediction() {
    const zeroPercent = '0.00%';

    // Scores
    emergencyScoreText.textContent = zeroPercent;
    if (normalScoreText) normalScoreText.textContent = zeroPercent;
    rawScoreText.textContent       = '0.0000';

    // Bars
    emergencyBar.style.width = '0%';
    const nb = document.getElementById('normalBar');
    if (nb) nb.style.width = '0%';

    const ep = document.getElementById('emergencyPct');
    const np = document.getElementById('normalPct');
    if (ep) ep.textContent = zeroPercent;
    if (np) np.textContent = zeroPercent;

    // Alert badge
    alertBadge.textContent = 'NO EMERGENCY';
    alertBadge.className   = 'threat-badge normal';

    // Drive new UI layer reset
    if (typeof updateSentinelUI === 'function') {
        updateSentinelUI({ isEmergency: false, emergencyProbability: 0, nonEmergencyProbability: 0, raw: 0 });
    }

    setEngine('Ready');

    // In upload mode: hide the image and show the placeholder box again
    if (currentMode === 'upload') {
        uploadPreview.hidden = true;
        analyzeBtn.disabled = true;
        loadingMask.style.display = 'grid';
        setLoadingText('Choose an image');
    }
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);
clearCameraBtn.addEventListener("click", resetPrediction);
cameraModeBtn.addEventListener("click", () => switchMode("camera"));
uploadModeBtn.addEventListener("click", () => switchMode("upload"));
uploadBtn.addEventListener("click", () => fileInput.click());
analyzeBtn.addEventListener("click", analyzeUploadedImage);
clearUploadBtn.addEventListener("click", resetPrediction);

fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    uploadPreview.onload = () => {
        uploadPreview.hidden = false;
        loadingMask.style.display = "none";  // hide placeholder once image is loaded
        analyzeBtn.disabled = false;
        setEngine("Image loaded");
    };
    uploadPreview.src = url;
});

window.addEventListener("beforeunload", () => {
    stopCamera();
});

switchMode("camera");
setTimeout(() => {
    loadOldEmergencyModel().catch((err) => {
        setEngine("Model not found");
        loadingMask.style.display = "grid";
        setLoadingText("Missing tfjs_graph_model/model.json");
        if (typeof setStatusDot === 'function') setStatusDot('error');
        console.warn(err.message);
    });
}, 500);
