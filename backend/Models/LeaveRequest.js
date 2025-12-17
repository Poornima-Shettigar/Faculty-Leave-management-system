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
  
  // Period adjustments for teaching staff
  periodAdjustments: [{
    date: { type: Date, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    className: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    substituteFacultyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null
    },
    status: { 
      type: String, 
      enum: ["pending", "adjusted", "not_required"],
      default: "pending"
    }
  }],
  
  // Approval workflow
  status: { 
    type: String, 
    enum: [
      "pending_hod", 
      "pending_director", 
      "approved", 
      "rejected_by_hod", 
      "rejected_by_director"
    ],
    default: "pending_hod"
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

// Update the updatedAt field before saving
leaveRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);











