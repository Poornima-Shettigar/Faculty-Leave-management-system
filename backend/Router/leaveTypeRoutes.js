const express = require("express");
const {
  addLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getAllLeaveTypes,
  searchLeaveType,
  getFacultyLeaveSummary,
  getDepartmentLeaveBalance 
} = require("../Controller/leaveTypeController");

const router = express.Router();

router.post("/add", addLeaveType);
router.put("/update/:id", updateLeaveType);
router.delete("/delete/:id", deleteLeaveType);
router.get("/list", getAllLeaveTypes);
router.get("/search", searchLeaveType);
router.get("/faculty/:employeeId/leaves", getFacultyLeaveSummary);
router.get(
  "/department/leave-balance",
  getDepartmentLeaveBalance
);module.exports = router;
