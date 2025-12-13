const express = require("express");
const router = express.Router();
const departmentController = require("../Controller/Department");

// Create
router.post("/add", departmentController.addDepartment);

// List + Count
router.get("/list", departmentController.getDepartmentList);
router.get("/count", departmentController.getDepartmentCount);
router.put("/update-class", departmentController.updateClassName);
router.put("/remove-class", departmentController.removeClassFromDepartment);
// ⭐ New Routes for Classes
router.get("/name/:departmentName", departmentController.getDepartmentByName);
router.put("/add-class", departmentController.addClassToDepartment);

// Get one by ID
router.get("/get-by-id/:id", departmentController.getDepartmentById);

// Update
router.put("/update/:id", departmentController.updateDepartment);

// Delete
router.delete("/delete/:id", departmentController.deleteDepartment);

module.exports = router;
