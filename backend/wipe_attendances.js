const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Attendance = require("./models/Attendance");

async function wipeDatabase() {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Wiping corrupted attendances...");
    const res = await Attendance.deleteMany({});
    console.log("Deleted count:", res.deletedCount);
    console.log("Adding a test attendance record for demonstration...");
    
    // We will leave the DB clean so the next webcam capture works correctly
    mongoose.connection.close();
}

wipeDatabase();
