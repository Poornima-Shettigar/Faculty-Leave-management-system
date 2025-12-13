const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  allowedLeaves: { type: Number, required: true },
  roles: { type: [String], enum: ["admin","teaching","non-teaching","hod","director"], required: true },
  isForwarding: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
