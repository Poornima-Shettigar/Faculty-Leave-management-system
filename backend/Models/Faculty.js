const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },

  role: { 
    type: String,
    enum: ["Faculty", "HOD", "Director"],
    default: "Faculty",
    required: true
  },

  email: { type: String, required: true, unique: true },

  phone: { type: String, required: true },

  joinDate: { type: Date, required: true },

  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department",
    required: true 
  }
});

module.exports = mongoose.model("Faculty", facultySchema);
