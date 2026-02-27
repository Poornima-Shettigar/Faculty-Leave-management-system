const express = require("express");
const router = express.Router();
const directorController = require("../Controller/DirectorController");

// Get department-wise faculty with leave details
router.get(
    "/faculty-leaves/:departmentId",
    directorController.getDepartmentWiseFacultyWithLeaves
);

// Get complete details of a single faculty
router.get(
    "/faculty-details/:facultyId",
    directorController.getFacultyCompleteDetails
);

module.exports = router;
