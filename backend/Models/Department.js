const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  departmentName: {
    type: String,
    required: true,
    unique: true
  },

  level: {
    type: String,
    enum: ["UG", "PG"],
    required: true
  },

  // HOD will fill these later
  totalClasses: {
    type: Number,
    default: 0
  },

  classNames: {
    type: [String],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Department", departmentSchema);
