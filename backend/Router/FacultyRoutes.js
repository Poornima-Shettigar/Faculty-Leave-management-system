const express = require("express");
const router = express.Router();
const facultyController = require("../Controller/FacultyController");

// Add Faculty
router.post("/add", facultyController.addFaculty);

// Get Faculty List
router.get("/list", facultyController.getFacultyList);

// Update
router.patch("/:id", facultyController.updateFaculty);

// Delete
router.delete("/:id", facultyController.deleteFaculty);
router.get("/getByDept/:id", facultyController.getFacultyByDepartment);
// Get Single Faculty
router.get("/get/:id", facultyController.getFacultyById);
router.get("/count", facultyController.getFacultyCount);

module.exports = router;
