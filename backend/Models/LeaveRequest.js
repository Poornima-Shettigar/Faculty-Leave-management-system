const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema({

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

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  totalDays: {
    type: Number,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  periodAdjustments: [{
    date: { type: Date, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    className: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    semester: { type: String },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },

    substituteFacultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    notificationSent: {
      type: Boolean,
      default: false
    },

    substituteApproval: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      approvedAt: { type: Date },
      comments: { type: String }
    },

    status: {
      type: String,
      enum: ["pending", "adjusted", "not_required"],
      default: "pending"
    }
  }],

  isHalfDay: {
    type: Boolean,
    default: false
  },

  halfDaySession: {
    type: String,
    enum: ["morning", "afternoon"],
    default: null
  },

  status: {
    type: String,
    enum: [
      "Pending Substitute Approval",
      "Substitute Approved",
      "Substitute Rejected",
      "Pending HOD Approval",
      "Approved by HOD",
      "Rejected by HOD",
      "Pending Director Approval",
      "Approved by Director",
      "Rejected by Director",
      "Cancelled",
      // Legacy statuses (for compatibility with existing data)
      "approved",
      "pending_substitute",
      "pending_hod",
      "pending_director",
      "rejected_by_hod",
      "rejected_by_director",
      "rejected_by_substitute"
    ],
    default: "Pending HOD Approval"
  },

  hodApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    comments: { type: String }
  },

  directorApproval: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    comments: { type: String }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

leaveRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
