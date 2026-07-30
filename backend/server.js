const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

// existing routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

// NEW route for login & signup
const authRoutes = require("./routes/authRoutes");
const trainRoutes = require("./routes/trainRoutes");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Connect Database
connectDB();

// API Routes
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/train", trainRoutes);
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Attendify Backend Running 🚀");
});

// Prevent crash
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});






// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");

// const connectDB = require("./config/db");

// // Routes
// const studentRoutes = require("./routes/studentRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const authRoutes = require("./routes/authRoutes");

// dotenv.config();
// const app = express();

// // 1. Middleware
// app.use(cors());
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // 2. 🔷 THE "SAFE" STATIC FIX (Corrected __dirname)
// // This points to your models folder specifically.
// const modelsPath = path.join(__dirname, "..", "frontend", "models");

// // Middleware to serve the models
// app.use("/models", express.static(modelsPath));

// // 3. 🔍 LOGGING & DEBUGGING
// console.log("-------------------------------------------");
// console.log("🚀 Server Starting...");
// if (fs.existsSync(modelsPath)) {
//     console.log("✅ Models folder found at:", modelsPath);
// } else {
//     console.log("❌ Models folder NOT found at:", modelsPath);
//     console.log("👉 Tip: Ensure your 'models' folder is inside 'frontend'.");
// }
// console.log("-------------------------------------------");

// // 4. Connect Database
// connectDB();

// // 5. API Routes
// app.use("/api/students", studentRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/auth", authRoutes);

// // Test route
// app.get("/", (req, res) => {
//   res.send("Attendify Backend Running 🚀");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });