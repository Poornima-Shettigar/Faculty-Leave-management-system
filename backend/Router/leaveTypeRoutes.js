const express = require("express");
const {
  addLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getAllLeaveTypes,
  searchLeaveType,
  getFacultyLeaveSummary
} = require("../Controller/leaveTypeController");

const router = express.Router();

router.post("/add", addLeaveType);
router.put("/update/:id", updateLeaveType);
router.delete("/delete/:id", deleteLeaveType);
router.get("/list", getAllLeaveTypes);
router.get("/search", searchLeaveType);
router.get("/faculty/:employeeId/leaves", getFacultyLeaveSummary);

module.exports = router;
