const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },

  className: {
    type: String,
    required: true  // Example: "CSE-A" or "1A" etc.
  },

  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8  // Typically semesters are 1-8 for UG, can be adjusted
  },

  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Subject", subjectSchema);
