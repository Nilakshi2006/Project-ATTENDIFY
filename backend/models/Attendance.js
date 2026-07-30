const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
{
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    default: "present",
  },
  time: {
    type: String,
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
