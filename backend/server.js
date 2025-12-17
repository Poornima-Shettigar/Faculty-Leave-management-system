// require('dotenv').config();

// const express = require("express");
// const cors = require("cors");
// const connectDB = require("./config/db.js");
// const adminRoutes = require("./Router/AdminRoutes.js");
// const departmentRoutes = require("./Router/DepartmentRoutes.js");
// const facultyRoutes = require("./Router/FacultyRoutes.js");
// const authRoutes = require("./Router/AuthRoutes.js");
// const timetableRoutes = require("./Router/timetableRoutes");
// const allocateleave = require("./Router/leaveTypeRoutes.js");
// const leaveRequestRoutes = require("./Router/leaveRequestRoutes.js");
// const app = express();
// require("./cron/resetLeaves");

// // ✅ Proper CORS configuration
// app.use(cors({
//   origin: "http://localhost:5173",          // frontend URL
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // include PATCH
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true
// }));

// app.use(express.json());
// connectDB();

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/department", departmentRoutes);
// app.use("/api/faculty", facultyRoutes);
// app.use("/api/subject", require("./Router/subjectRoutes"));
// app.use("/api/leaveType",allocateleave);
// app.use("/api/timetable", timetableRoutes);
// app.use("/api/leave-request", leaveRequestRoutes);

// // Start server
// app.listen(5000, () => console.log("Server running on port 5000"));
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const adminRoutes = require("./Router/AdminRoutes");
const departmentRoutes = require("./Router/DepartmentRoutes");
const facultyRoutes = require("./Router/FacultyRoutes");
const authRoutes = require("./Router/AuthRoutes");
const timetableRoutes = require("./Router/timetableRoutes");
const leaveTypeRoutes = require("./Router/leaveTypeRoutes");
const leaveRequestRoutes = require("./Router/leaveRequestRoutes");

require("./cron/resetLeaves");

const app = express();

// ✅ CORS (Vite)
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subject", require("./Router/subjectRoutes"));
app.use("/api/leaveType", leaveTypeRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/leave-request", leaveRequestRoutes);

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
