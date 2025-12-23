const moment = require("moment");
const LeaveType = require("../Models/LeaveType");
const User = require("../Models/User");
const EmployeeLeave = require("../Models/EmployeeLeave");
const LeaveRequest = require("../Models/LeaveRequest");

// -------------------------------
// 1. ADD Leave Type (With Range + Effect)
// -------------------------------
exports.addLeaveType = async (req, res) => {
  try {
    const {
      name,
      allowedLeaves,
      roles,
      isForwarding,
      isHalfDayAllowed,
      leaveEffect,        // ✅ NEW
      startDate,
      endDate
    } = req.body;

    const policyStart = moment(startDate).startOf("day");
    const policyEnd = moment(endDate).endOf("day");

    const totalPeriodDays = policyEnd.diff(policyStart, "days") + 1;
    if (totalPeriodDays <= 0)
      return res.status(400).json({ message: "Invalid Date Range" });

    // 1️⃣ Save Leave Type
    const leaveType = await LeaveType.create({
      name,
      allowedLeaves,
      roles,
      isForwarding,
      isHalfDayAllowed,
      leaveEffect,     // ✅ STORED
      startDate,
      endDate
    });

    // 2️⃣ Find Target Users
    const users = await User.find({ role: { $in: roles } });

    const allocations = users.map(user => {
      const joiningDate = moment(user.joiningDate).startOf("day");
      const userActiveStart = moment.max(policyStart, joiningDate);

      if (userActiveStart.isAfter(policyEnd)) return null;

      const activeDays = policyEnd.diff(userActiveStart, "days") + 1;
      const prorated = (allowedLeaves / totalPeriodDays) * activeDays;

      const finalLeaves = Math.round(prorated * 2) / 2;

      return {
        employeeId: user._id,
        leaveTypeId: leaveType._id,
        totalLeaves: leaveEffect === "ADD" ? 0 : finalLeaves,
        usedLeaves: 0,
        carryForwardLeaves: 0,
        creditLeaves: leaveEffect === "ADD" ? finalLeaves : 0
      };
    }).filter(Boolean);

    if (allocations.length > 0) {
      await EmployeeLeave.insertMany(allocations);
    }

    res.status(201).json({
      message: "Leave policy created with effect applied"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------
// 2. UPDATE Leave Type
// -------------------------------
exports.updateLeaveType = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await LeaveType.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Leave type not found" });

    res.json({ message: "Leave type updated", updated });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------------------
// 3. DELETE Leave Type
// -------------------------------
exports.deleteLeaveType = async (req, res) => {
  try {
    const id = req.params.id;
    await LeaveType.findByIdAndDelete(id);
    await EmployeeLeave.deleteMany({ leaveTypeId: id });

    res.json({ message: "Leave type deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------------------
// 4. LIST Leave Types
// -------------------------------
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const list = await LeaveType.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------------------
// 5. SEARCH Leave Types
// -------------------------------
exports.searchLeaveType = async (req, res) => {
  try {
    const results = await LeaveType.find({
      name: { $regex: req.query.q, $options: "i" }
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------------------
// 6. FACULTY LEAVE SUMMARY
// -------------------------------
exports.getFacultyLeaveSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaves = await EmployeeLeave
      .find({ employeeId })
      .populate("leaveTypeId");

    const formatted = leaves.map(l => {
      if (!l.leaveTypeId) return null;

      const effect = l.leaveTypeId.leaveEffect;

      const totalAvailable =
        effect === "ADD"
          ? l.creditLeaves
          : (l.totalLeaves + l.carryForwardLeaves);

      const remaining =
        effect === "ADD"
          ? l.creditLeaves
          : Math.max(totalAvailable - l.usedLeaves, 0);

      return {
        leaveTypeId: l.leaveTypeId._id,
        leaveTypeName: l.leaveTypeId.name,
        leaveEffect: effect,
        totalAvailable,
        remainingLeaves: remaining,
        isHalfDayAllowed: l.leaveTypeId.isHalfDayAllowed
      };
    }).filter(Boolean);

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
