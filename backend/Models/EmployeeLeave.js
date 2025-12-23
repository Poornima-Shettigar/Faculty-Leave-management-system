const mongoose = require("mongoose");

const employeeLeaveSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveType",
    required: true
  },

  // Balance year (important for reports & future expansion)
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },

  // For DEDUCT type leaves
  totalLeaves: {
    type: Number,
    default: 0
  },

  usedLeaves: {
    type: Number,
    default: 0
  },

  carryForwardLeaves: {
    type: Number,
    default: 0
  },

  // ⭐ NEW: For ADD type leaves (Comp-Off, On-Duty)
  creditedLeaves: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate allocation per year
employeeLeaveSchema.index(
  { employeeId: 1, leaveTypeId: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("EmployeeLeave", employeeLeaveSchema);
