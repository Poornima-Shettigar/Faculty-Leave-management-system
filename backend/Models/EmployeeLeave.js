const mongoose = require("mongoose");

const employeeLeaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leaveTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveType", required: true },
  totalLeaves: { type: Number, required: true },
  usedLeaves: { type: Number, default: 0 },

  carryForwardLeaves: { type: Number, default: 0 }, // NEW FIELD

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmployeeLeave", employeeLeaveSchema);
