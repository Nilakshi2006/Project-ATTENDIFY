const express = require("express");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const Student = require("../models/Student");

const router = express.Router();

// ================= REGISTER FACE AND TRAIN =================
router.post("/register-face", async (req, res) => {
  try {
    const { name, id, studentClass, images } = req.body;

    if (!name || !id || !images || images.length === 0) {
      return res.status(400).json({ error: "Missing required fields or images" });
    }

    // 1. Ensure Face Engine Directory Exists
    const faceEngineDir = path.join(__dirname, "..", "face_engine");
    const datasetDir = path.join(faceEngineDir, "faces", "students", id);

    if (!fs.existsSync(datasetDir)) {
      fs.mkdirSync(datasetDir, { recursive: true });
    }

    // 2. Save Images to Filesystem
    images.forEach((imgBase64, index) => {
      // Remove base64 header like "data:image/jpeg;base64,"
      const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `img_${Date.now()}_${index}.jpg`;
      const filePath = path.join(datasetDir, fileName);
      fs.writeFileSync(filePath, base64Data, "base64");
    });

    // 3. Save Student to DB
    await Student.findOneAndUpdate(
      { studentId: id },
      { name, studentId: id, class: studentClass },
      { upsert: true, new: true }
    );

    // 4. Trigger Model Training
    const pythonScriptPath = path.join(faceEngineDir, "train_lbph.py");
    const python = spawn("python3", [pythonScriptPath], {
    cwd: faceEngineDir
});

    python.stdout.on("data", (data) => {
      console.log(`Train Python: ${data}`);
    });

    python.stderr.on("data", (data) => {
      console.error(`Train Python Err: ${data}`);
    });

    python.on("close", (code) => {
      console.log(`Training process exited with code ${code}`);
      if (code === 0) {
        res.json({ success: true, message: "Face registered and training complete." });
      } else {
        res.status(500).json({ error: "Failed to train AI model" });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;