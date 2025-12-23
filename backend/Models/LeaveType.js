const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },

  // Used only for DEDUCT type leaves
  allowedLeaves: { type: Number, required: true },

  roles: {
    type: [String],
    enum: ["admin", "teaching", "non-teaching", "hod", "director"],
    required: true
  },

  // Manual policy period
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  isForwarding: { type: Boolean, default: false },
  isHalfDayAllowed: { type: Boolean, default: false },

  // ⭐ NEW: Determines leave behavior
  leaveEffect: {
    type: String,
    enum: ["DEDUCT", "ADD"], // DEDUCT = CL/SL, ADD = Comp-Off
    default: "DEDUCT"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
