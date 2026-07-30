// ================= CONFIG =================
const ATTENDANCE_API_MARK = "http://localhost:5000/api/attendance/mark";

// ================= ELEMENTS =================
const webcam = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const faceContainer = document.getElementById("faceContainer");
const resultsList = document.getElementById("resultsList");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const markedCountEl = document.getElementById("markedCount");
const scanCountEl = document.getElementById("scanCount");
const statusMsg = document.getElementById("statusMsg");

// ================= STATE =================
let stream = null;
let intervalId = null;
let scanCount = 0;
let markedStudents = new Set();
let isProcessing = false;
let sessionActive = false;

function handleVideoInterruption() {
  if (!sessionActive) return;
  statusMsg.innerText = "Reconnecting camera...";
  if (stream) {
    webcam.srcObject = stream;
    webcam.play().catch(() => {
      statusMsg.innerText = "Camera reconnect failed.";
    });
  }
}

webcam.addEventListener("pause", handleVideoInterruption);
webcam.addEventListener("ended", handleVideoInterruption);
webcam.addEventListener("stalled", handleVideoInterruption);

// ================= START CAMERA =================
startBtn.addEventListener("click", async () => {
  if (sessionActive) return;

  markedStudents.clear();
  scanCount = 0;

  resultsList.innerHTML = "";
  markedCountEl.innerText = "0";
  scanCountEl.innerText = "0";

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcam.srcObject = stream;

    stream.getTracks().forEach(track => {
      track.addEventListener("ended", handleVideoInterruption);
      track.addEventListener("mute", handleVideoInterruption);
    });

    await webcam.play();

    startBtn.disabled = true;
    stopBtn.disabled = false;
    sessionActive = true;

    statusMsg.innerText = "Session Active";

    captureAndRecognize();
    intervalId = setInterval(captureAndRecognize, 1200);
  } catch (err) {
    console.error("Camera Error:", err);
    alert("Camera access denied or unavailable.");
  }
});


// ================= STOP CAMERA =================
stopBtn.addEventListener("click", () => {
  clearInterval(intervalId);
  sessionActive = false;

  if (webcam.srcObject) {
    webcam.srcObject.getTracks().forEach(track => track.stop());
  }

  webcam.srcObject = null;
  faceContainer.innerHTML = "";

  startBtn.disabled = false;
  stopBtn.disabled = true;

  statusMsg.innerText = "Session Stopped";
});


// ================= CAPTURE IMAGE =================
async function captureAndRecognize() {
  if (!sessionActive || !webcam.srcObject || isProcessing) return;
  if (!webcam.videoWidth || !webcam.videoHeight) return;

  isProcessing = true;

  const ctx = canvas.getContext("2d");
  canvas.width = webcam.videoWidth;
  canvas.height = webcam.videoHeight;
  ctx.drawImage(webcam, 0, 0);

  const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

  scanCount++;
  scanCountEl.innerText = scanCount;

  try {
    const response = await fetch(ATTENDANCE_API_MARK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageBase64 })
    });

    const data = await response.json();

    if (!data.faces || data.faces.length === 0) {
      faceContainer.innerHTML = "";
      return;
    }

    drawFaceBoxes(data.faces);

    data.faces.forEach(face => {
      if (face.name === "Unknown") return;
      if (markedStudents.has(face.name)) return;
      if (markedStudents.size >= 50) return;

      markedStudents.add(face.name);
      updateAttendanceUI(face.name);
      markedCountEl.innerText = markedStudents.size;
      statusMsg.innerText = `${markedStudents.size} Students Marked`;
    });
  } catch (err) {
    console.error("Server connection error:", err);
    statusMsg.innerText = "Connection error";
  } finally {
    isProcessing = false;
  }
}


// ================= UPDATE UI =================
function updateAttendanceUI(name) {

  const div = document.createElement("div");

  div.className = "result-item present";

  div.innerHTML = `
    <div class="result-info">
      <strong>${name}</strong>
      <span>${new Date().toLocaleTimeString()}</span>
    </div>

    <div class="result-status">
      <i class="fas fa-check-circle"></i>
      Present
    </div>
  `;

  resultsList.prepend(div);

}


// ================= DRAW FACE BOXES =================
function drawFaceBoxes(faces) {

  faceContainer.innerHTML = "";

  const rect = webcam.getBoundingClientRect();

  faces.forEach(face => {

    if (!face.bbox) return;

    const [x, y, w, h] = face.bbox;

    const box = document.createElement("div");

    box.style.position = "absolute";
    box.style.border = "2px solid #00ff00";

    box.style.left = `${x * rect.width / webcam.videoWidth}px`;
    box.style.top = `${y * rect.height / webcam.videoHeight}px`;

    box.style.width = `${w * rect.width / webcam.videoWidth}px`;
    box.style.height = `${h * rect.height / webcam.videoHeight}px`;

    box.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        position: absolute;
        top: -20px;
      ">
        ${face.name}
      </div>
    `;

    faceContainer.appendChild(box);

  });

}
























// const webcam = document.getElementById("webcam");
// const faceContainer = document.getElementById("faceContainer");
// const resultsList = document.getElementById("resultsList");
// const startBtn = document.getElementById("startBtn");
// const stopBtn = document.getElementById("stopBtn");
// const statusMsg = document.getElementById("statusMsg");

// let faceMatcher = null;
// let intervalId = null;
// let markedStudents = new Set();

// // 🔷 STEP 1: INITIALIZE AI & DB DATA
// async function init() {
//     try {
//         const MODEL_PATH = '../models';
//         await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH);
//         await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);
//         await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);

//         const response = await fetch("http://localhost:5000/api/students/all-descriptors");
//         const students = await response.json();

//         if (students.length > 0) {
//             const labeledDescriptors = students.map(s => {
//                 return new faceapi.LabeledFaceDescriptors(
//                     s.name, 
//                     s.descriptors.map(d => new Float32Array(d))
//                 );
//             });
//             faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
//             statusMsg.innerText = "System Ready";
//         } else {
//             statusMsg.innerText = "No students in Database";
//         }
//     } catch (err) {
//         console.error(err);
//         statusMsg.innerText = "Init Failed";
//     }
// }
// init();

// // 🔷 STEP 2: START SCANNING
// startBtn.addEventListener("click", async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     webcam.srcObject = stream;
//     startBtn.disabled = true;
//     stopBtn.disabled = false;
//     intervalId = setInterval(scan, 1000);
// });

// // 🔷 STEP 3: MATCH LIVE FACE TO DB
// async function scan() {
//     if (!faceMatcher) return;

//     const detections = await faceapi.detectAllFaces(webcam)
//         .withFaceLandmarks()
//         .withFaceDescriptors();

//     faceContainer.innerHTML = ""; // Clear old boxes

//     detections.forEach(det => {
//         const match = faceMatcher.findBestMatch(det.descriptor);
        
//         // If match found in MongoDB
//         if (match.label !== "unknown" && !markedStudents.has(match.label)) {
//             markAttendance(match.label);
//         }
//     });
// }
// async function loadModels() {
//     try {
//         // Use the full URL so it doesn't matter how you open your HTML files
//         const MODEL_PATH = "http://localhost:5000/models"; 

//         await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH);
//         await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH);
//         await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH);

//         console.log("✅ AI Models Loaded Successfully!");
//     } catch (err) {
//         console.error("❌ AI Error:", err);
//     }
// }

// function markAttendance(name) {
//     markedStudents.add(name);
//     const div = document.createElement("div");
//     div.className = "result-item present";
//     div.innerHTML = `<strong>${name}</strong> <span>${new Date().toLocaleTimeString()}</span>`;
//     resultsList.prepend(div);
//     document.getElementById("markedCount").innerText = markedStudents.size;
// }

// stopBtn.addEventListener("click", () => {
//     clearInterval(intervalId);
//     if (webcam.srcObject) webcam.srcObject.getTracks().forEach(t => t.stop());
//     location.reload(); 
// });