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
      "../../face_engine/recognize_face.py"
    );

    // Use the virtual environment python if it exists, otherwise fallback to global 'python'
    const pythonExe = path.join(__dirname, "../attendify-env/Scripts/python.exe");
    const python = spawn(pythonExe, [pythonScriptPath]);

    python.stdin.write(imageBase64);
    python.stdin.end();

    let output = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.on("close", async () => {
      try {
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

        // 🔥 LOOP THROUGH ALL DETECTED FACES
        for (const face of result.faces) {
          if (face.name === "Unknown") {
            console.log("Scanner hit an Unknown face, skipping.");
            continue;
          }

          console.log(`Scanner Detected Label ID: "${face.name}"`);

          let student = await Student.findOne({ studentId: face.name });

          if (!student) {
            // Legacy Fallback: The old system saved folders by Name instead of ID
            student = await Student.findOne({ name: face.name });
            
            if (!student) {
              console.log(`❌ ERROR: Could not find Student in MongoDB with studentId OR name: "${face.name}".`);
              continue;
            } else {
              console.log(`⚠️ LEGACY MATCH: Found student via their Name ("${face.name}") instead of ID!`);
            }
          }

          console.log(`✅ FOUND Student in DB: "${student.name}"`);

          // Check if already marked today
          const existing = await Attendance.findOne({
            student: student._id,
            date: today
          });

          if (!existing) {
            const attendance = new Attendance({
              student: student._id,
              studentId: student.studentId,
              studentName: student.name,
              date: today,
              status: "present",
              time: new Date().toLocaleTimeString()
            });

            await attendance.save();
            console.log(`✅ SUCCESS: Attendance explicitly saved to MongoDB for ${student.name}`);
            processedStudents.push(student.name);
          } else {
             console.log(`⚠️ ALREADY MARKED: Attendance already exists for ${student.name} today.`);
             processedStudents.push(student.name);
          }
        }

        res.json({
          faces: result.faces,
          marked: processedStudents
        });

      } catch(fatalErr) {
         console.error("FATAL ERROR IN ATTENDANCE MARK PIPELINE: ", fatalErr);
         res.status(500).json({ error: "Internal crash" });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
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

    // Using .lean() to make object mutation easier
    const records = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate("student").lean();
    
    // We explicitly fall back to the newly added `record.studentName` 
    // to guarantee it never shows "Unknown" if MongoDB populated-lookup fails.
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
    month = month ? parseInt(month) : today.getMonth() + 1; // 1-indexed (1-12)

    // Calculate start and end bounds
    const startDate = new Date(year, month - 1, 1);
    
    // Determine the max day we should show. If it's the current month, only go up to `today`. 
    // If it's a past month, go to the last day of that month.
    let endDateForLoop = new Date(year, month, 0); // last day of the given month
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
       endDateForLoop = today;
    }

    // Boundary for querying whole month
    const endBoundary = new Date(year, month, 1);

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lt: endBoundary }
    }).lean();

    const attendanceMap = {};
    records.forEach(r => {
      // Use local timezone to extract the date, because it was saved with local timezone setHours(0,0,0,0)
      const yr = r.date.getFullYear();
      const mo = String(r.date.getMonth() + 1).padStart(2, '0');
      const da = String(r.date.getDate()).padStart(2, '0');
      const dateString = `${yr}-${mo}-${da}`;
      attendanceMap[dateString] = r.status;
    });

    const monthlyData = [];
    let presentCount = 0;
    let totalClasses = 0;

    // Loop through days from 1 to endDateForLoop's date
    for (let d = 1; d <= endDateForLoop.getDate(); d++) {
       const dateString = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
       
       totalClasses++;
       
       if (attendanceMap[dateString]) {
          monthlyData.push({ date: dateString, day: d, status: attendanceMap[dateString] });
          if(attendanceMap[dateString] === "present") presentCount++;
       } else {
          monthlyData.push({ date: dateString, day: d, status: "absent" });
       }
    }

    const attendancePercent = totalClasses === 0 ? 0 : Math.round((presentCount / totalClasses) * 100);

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
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

module.exports = router;