const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");
const saveBtn = document.getElementById("saveBtn");
const startCamera = document.getElementById("startCamera");
const captureList = document.getElementById("captureList");
const studentNameInput = document.getElementById("studentName");
const studentIdInput = document.getElementById("studentId");
const studentClassInput = document.getElementById("studentClass");

let images = [];
let stream = null;

// Populate fields if URL has studentId
const urlParams = new URLSearchParams(window.location.search);
const studentIdParam = urlParams.get('studentId'); 

async function initFields() {
    if (studentIdParam) {
        try {
            const res = await fetch("http://localhost:5000/api/students");
            const students = await res.json();
            const student = students.find(s => s._id === studentIdParam || s.studentId === studentIdParam);
            if (student) {
                studentNameInput.value = student.name;
                studentIdInput.value = student.studentId;
                if (student.class) studentClassInput.value = student.class;
            }
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    }
}
initFields();

startCamera.addEventListener("click", async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        
        startCamera.disabled = true;
        startCamera.innerHTML = '<i class="fas fa-video"></i> Camera Active';
        captureBtn.disabled = false;
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Could not access webcam. Please allow permissions.");
    }
});

captureBtn.addEventListener("click", () => {
    if (images.length >= 10) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg");
    
    images.push(imageData);

    if (images.length === 1 && captureList.querySelector('.empty-state')) {
        captureList.innerHTML = "";
    }

    captureList.innerHTML += `
        <div class="result-item present">
            <div class="result-info">
                <strong>Image ${images.length}/10</strong>
                <span>Captured successfully</span>
            </div>
            <div class="result-status"><i class="fas fa-check-circle"></i></div>
        </div>
    `;
    
    captureList.scrollTop = captureList.scrollHeight;

    if (images.length >= 10) {
        captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capture Finished';
        captureBtn.disabled = true;
        saveBtn.disabled = false;
    }
});

saveBtn.addEventListener("click", async () => {
    const name = studentNameInput.value.trim();
    const id = studentIdInput.value.trim();
    const studentClass = studentClassInput.value.trim();

    if (!name || !id || !studentClass) {
        alert("Please enter student name, ID, and class");
        return;
    }

    if (images.length < 10) {
        alert("Please capture images first");
        return;
    }

    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training Model...';
    saveBtn.disabled = true;

    try {
        const response = await fetch("http://localhost:5000/api/train/register-face", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, id, studentClass, images })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert("Face data saved successfully and training started!");
            // Stop camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            window.location.href = "students.html";
        } else {
            alert(data.error || "Failed to register face.");
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save & Train';
            saveBtn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server");
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save & Train';
        saveBtn.disabled = false;
    }
});