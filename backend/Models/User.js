const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },
password: { type: String, required: true },
  phone: { type: String, required: true },

  departmentType: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department", // <-- this is important for populate
    required: true
  },


  dateOfJoining: { type: String, required: true },

  // 🔥 ADD THIS (most important)
  role: {
    type: String,
    enum: ["admin", "teaching","non-teaching", "hod", "director"],
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
