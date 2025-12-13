const mongoose = require("mongoose");
const timetableSchema = new mongoose.Schema({
  departmentType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  className: {
    type: String,
    required: true,
  },

  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },

  timetable: [
    {
      day: String,
      period: Number,
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
      },
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }
  ]
});

module.exports = mongoose.model("Timetable", timetableSchema);
