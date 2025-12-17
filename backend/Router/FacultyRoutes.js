// const express = require("express");
// const router = express.Router();
// const facultyController = require("../Controller/FacultyController");

// // Add Faculty
// router.post("/add", facultyController.addFaculty);

// // Get Faculty List
// router.get("/list", facultyController.getFacultyList);

// // Update
// router.patch("/:id", facultyController.updateFaculty);

// // Delete
// router.delete("/:id", facultyController.deleteFaculty);
// router.get("/getByDept/:id", facultyController.getFacultyByDepartment);
// // Get Single Faculty
// router.get("/get/:id", facultyController.getFacultyById);
// router.get("/count", facultyController.getFacultyCount);
// router.get("/admin/stats", facultyController.getAdminDashboardStats);
// router.get("/hod/department/:departmentId", facultyController.getHodDepartmentFaculty);

// module.exports = router;
const express = require("express");
const router = express.Router();
const facultyController = require("../Controller/FacultyController");

// Faculty CRUD
router.post("/add", facultyController.addFaculty);
router.get("/list", facultyController.getFacultyList);
router.get("/get/:id", facultyController.getFacultyById);
router.patch("/:id", facultyController.updateFaculty);
router.delete("/:id", facultyController.deleteFaculty);

// Department-based
router.get("/getByDept/:id", facultyController.getFacultyByDepartment);

// Counts & Stats
router.get("/count", facultyController.getFacultyCount);
router.get("/admin/stats", facultyController.getAdminDashboardStats);

// ✅ HOD – Faculty & Subject allocation
router.get(
  "/hod/department/:departmentId",
  facultyController.getHodDepartmentFaculty
);

module.exports = router;
