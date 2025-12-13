const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  leaveRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "LeaveRequest", 
    required: true 
  },
  
  type: { 
    type: String, 
    enum: [
      "leave_requested",
      "leave_approved_hod",
      "leave_rejected_hod",
      "leave_approved_director",
      "leave_rejected_director",
      "leave_approved",
      "leave_rejected"
    ],
    required: true 
  },
  
  title: { 
    type: String, 
    required: true 
  },
  
  message: { 
    type: String, 
    required: true 
  },
  
  isRead: { 
    type: Boolean, 
    default: false 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Notification", notificationSchema);



