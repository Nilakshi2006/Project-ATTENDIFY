
const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// add student
router.post("/", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get all students
router.get("/", async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// update student
router.put("/:id", async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;




// const express = require("express");
// const Student = require("../models/Student");
// const router = express.Router();

// // 🔷 REGISTER OR UPDATE STUDENT FACE DATA
// router.post("/register-face", async (req, res) => {
//   try {
//     const { name, id, descriptors } = req.body;

//     // findOneAndUpdate will update the student if they exist, or create a new one (upsert)
//     const student = await Student.findOneAndUpdate(
//       { studentId: id }, 
//       { name, descriptors },
//       { upsert: true, new: true }
//     );

//     res.json({ message: "Success! Face data stored in MongoDB", student });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // 🔷 GET ALL STUDENTS (For the Attendance scanner to download known faces)
// router.get("/all-descriptors", async (req, res) => {
//   try {
//     const students = await Student.find({}, "name studentId descriptors");
//     res.json(students);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch student data" });
//   }
// });

// module.exports = router;