const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

const router = express.Router();

// ================= MARK ATTENDANCE =================
router.post("/mark", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.json({ faces: [] });
    }

    const pythonScriptPath = path.join(
      __dirname,
      "../face_engine/recognize_face.py"
    );

    // ✅ Render/Linux compatible
    const python = spawn("python3", [pythonScriptPath]);

    python.stdin.write(imageBase64);
    python.stdin.end();

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error(data.toString());
    });

    python.on("close", async (code) => {
      try {

        if (code !== 0) {
          console.error("Python Error:", errorOutput);
          return res.status(500).json({
            error: "Python process failed",
            details: errorOutput
          });
        }

        let result;

        try {
          result = JSON.parse(output);
        } catch (err) {
          console.error("Python JSON Parse Error:", output);
          return res.json({ faces: [] });
        }

        if (!result.faces || result.faces.length === 0) {
          return res.json({ faces: [] });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const processedStudents = [];

        for (const face of result.faces) {

          if (face.name === "Unknown") continue;

          let student = await Student.findOne({
            studentId: face.name
          });

          if (!student) {
            student = await Student.findOne({
              name: face.name
            });

            if (!student) continue;
          }

          const existing = await Attendance.findOne({
            student: student._id,
            date: today
          });

          if (!existing) {

            await Attendance.create({
              student: student._id,
              studentId: student.studentId,
              studentName: student.name,
              date: today,
              status: "present",
              time: new Date().toLocaleTimeString()
            });

          }

          processedStudents.push(student.name);
        }

        res.json({
          faces: result.faces,
          marked: processedStudents
        });

      } catch (err) {
        console.error(err);
        res.status(500).json({
          error: "Internal Server Error"
        });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal Server Error"
    });
  }
});

// ================= DELETE TODAY ATTENDANCE =================
router.delete("/today", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const result = await Attendance.deleteMany({
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ================= GET TODAY ATTENDANCE =================
router.get("/today", async (req, res) => {
  try {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const records = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate("student").lean();

    const formattedRecords = records.map(record => ({
      ...record,
      studentName: record.student ? record.student.name : record.studentName,
      studentClass: record.student ? record.student.class : "N/A"
    }));

    res.json(formattedRecords);

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ================= GET MONTHLY STUDENT ATTENDANCE =================
router.get("/student/:studentId", async (req, res) => {
  try {

    const { studentId } = req.params;
    let { year, month } = req.query;

    const today = new Date();

    year = year ? parseInt(year) : today.getFullYear();
    month = month ? parseInt(month) : today.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);

    let endDateForLoop = new Date(year, month, 0);

    if (
      year === today.getFullYear() &&
      month === today.getMonth() + 1
    ) {
      endDateForLoop = today;
    }

    const endBoundary = new Date(year, month, 1);

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lt: endBoundary }
    }).lean();

    const attendanceMap = {};

    records.forEach(r => {
      const yr = r.date.getFullYear();
      const mo = String(r.date.getMonth() + 1).padStart(2, "0");
      const da = String(r.date.getDate()).padStart(2, "0");

      attendanceMap[`${yr}-${mo}-${da}`] = r.status;
    });

    const monthlyData = [];
    let presentCount = 0;
    let totalClasses = 0;

    for (let d = 1; d <= endDateForLoop.getDate(); d++) {

      const dateString =
        `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      totalClasses++;

      if (attendanceMap[dateString]) {

        monthlyData.push({
          date: dateString,
          day: d,
          status: attendanceMap[dateString]
        });

        if (attendanceMap[dateString] === "present") {
          presentCount++;
        }

      } else {

        monthlyData.push({
          date: dateString,
          day: d,
          status: "absent"
        });

      }
    }

    const attendancePercent =
      totalClasses === 0
        ? 0
        : Math.round((presentCount / totalClasses) * 100);

    res.json({
      totalClasses,
      presentCount,
      attendancePercent: `${attendancePercent}%`,
      history: monthlyData,
      month,
      year
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

module.exports = router;