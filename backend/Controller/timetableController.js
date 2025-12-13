const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");
const User = require("../Models/User");

// Utility to format timetable for frontend as array
const formatToTable = (timetableArray) => {
  // Returns array of entries like: [{ day, period, subject, faculty }, ...]
  const formatted = [];
  timetableArray.forEach((entry) => {
    formatted.push({
      day: entry.day,
      period: entry.period,
      subject: entry.subject ? entry.subject.subjectName : null,
      faculty: entry.faculty ? entry.faculty.name : null,
    });
  });
  return formatted;
};

// ------------------- CREATE TIMETABLE -------------------
exports.createTimetable = async (req, res) => {
  try {
    console.log("Incoming Data:", req.body);
    const { departmentType, className, semester, timetable } = req.body;

    if (!departmentType || !className || !semester || !timetable || !timetable.length) {
      return res.status(400).json({ msg: "All fields are required including semester" });
    }

    const newTimetable = new Timetable({
      departmentType,
      className,
      semester: Number(semester),
      timetable,
    });

    await newTimetable.save();
    res.status(201).json({ msg: "Timetable saved successfully" });
  } catch (err) {
    console.error("Timetable Error:", err);
    res.status(500).json({ msg: "Internal Server Error", error: err.message });
  }
};

// ------------------- GET TIMETABLE -------------------
exports.getTimetable = async (req, res) => {
  try {
    const { deptId, className, semester } = req.params;

    const query = {
      departmentType: deptId,
      className
    };
    
    if (semester && semester !== "all") {
      query.semester = Number(semester);
    }

    const timetableDoc = await Timetable.findOne(query)
      .populate({
        path: "timetable.subject",
        select: "subjectName subjectCode",
      })
      .populate({
        path: "timetable.faculty",
        select: "name email",
      });
console.log(timetableDoc)
    if (!timetableDoc) {
      return res.json({ msg: "Timetable not found", timetable: [] });
    }

    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const PERIODS = [1, 2, 3, 4, 5, 6];

    const formatted = DAYS.flatMap((day) =>
      PERIODS.map((p) => {
        const entry = timetableDoc.timetable.find(
          (x) => x.day === day && x.period === p
        );
        return {
          day,
          period: p,
          subject: entry?.subject ? entry.subject.subjectName : null,
          faculty: entry?.faculty ? entry.faculty.name : null,
          subjectId: entry?.subject?._id || null,
          facultyId: entry?.faculty?._id || null,
        };
      })
    );

    res.json({
      _id: timetableDoc._id,
      departmentType: timetableDoc.departmentType,
      className: timetableDoc.className,
      semester: timetableDoc.semester,
      timetable: formatted,
    });
  } catch (err) {
    console.error("getTimetable Error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};


// ------------------- UPDATE ONE PERIOD -------------------
exports.updateOnePeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, period, subject, faculty } = req.body;

    const tt = await Timetable.findById(id);
    if (!tt) return res.status(404).json({ msg: "Timetable not found" });

    const index = tt.timetable.findIndex((x) => x.day === day && x.period === period);

    if (index !== -1) {
      tt.timetable[index] = { day, period, subject, faculty };
    } else {
      tt.timetable.push({ day, period, subject, faculty });
    }

    await tt.save();
    res.json({ msg: "Period updated successfully" });
  } catch (err) {
    console.error("updateOnePeriod Error:", err);
    res.status(500).json({ msg: "Server Error", err });
  }
};

// ------------------- DELETE DAY -------------------
exports.deleteDay = async (req, res) => {
  try {
    const { id, day } = req.params;
    const timetableDoc = await Timetable.findById(id);
    if (!timetableDoc) return res.status(404).json({ msg: "Timetable not found" });

    timetableDoc.timetable = timetableDoc.timetable.filter((item) => item.day !== day);
    await timetableDoc.save();

    res.json({ msg: `${day} timetable deleted successfully` });
  } catch (err) {
    console.error("deleteDay Error:", err);
    res.status(500).json({ msg: "Server Error", err });
  }
};

// ------------------- DELETE ENTIRE TIMETABLE -------------------
exports.deleteTimetable = async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ msg: "Timetable deleted successfully" });
  } catch (err) {
    console.error("deleteTimetable Error:", err);
    res.status(500).json({ msg: "Server Error", err });
  }
};

// ------------------- GET USER'S PERSONAL TIMETABLE -------------------
exports.getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user information
    const user = await User.findById(userId).populate("departmentType");
    if (!user || !user.departmentType) {
      return res.status(404).json({ msg: "User not found or no department assigned" });
    }

    // Get all timetables for the user's department
    const timetables = await Timetable.find({ departmentType: user.departmentType._id })
      .populate({
        path: "timetable.subject",
        select: "subjectName subjectCode"
      })
      .populate({
        path: "timetable.faculty",
        select: "name email"
      });

    // Filter periods where this user is assigned
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const PERIODS = [1, 2, 3, 4, 5, 6];

    // Organize by day
    const userSchedule = {};
    DAYS.forEach(day => {
      userSchedule[day] = [];
    });

    // Process each timetable
    timetables.forEach(timetable => {
      timetable.timetable.forEach(entry => {
        // Check if this entry is assigned to the user
        if (entry.faculty && entry.faculty._id.toString() === userId.toString()) {
          if (!userSchedule[entry.day]) {
            userSchedule[entry.day] = [];
          }
          userSchedule[entry.day].push({
            period: entry.period,
            subject: entry.subject ? entry.subject.subjectName : "N/A",
            subjectCode: entry.subject ? entry.subject.subjectCode : "",
            className: timetable.className,
            subjectId: entry.subject ? entry.subject._id : null
          });
        }
      });
    });

    // Sort periods within each day
    DAYS.forEach(day => {
      userSchedule[day].sort((a, b) => a.period - b.period);
    });

    // Get all unique subjects assigned to user
    const subjectsMap = {};
    DAYS.forEach(day => {
      userSchedule[day].forEach(entry => {
        if (entry.subjectId && !subjectsMap[entry.subjectId]) {
          subjectsMap[entry.subjectId] = {
            subjectName: entry.subject,
            subjectCode: entry.subjectCode,
            classes: []
          };
        }
        if (entry.subjectId && !subjectsMap[entry.subjectId].classes.includes(entry.className)) {
          subjectsMap[entry.subjectId].classes.push(entry.className);
        }
      });
    });

    res.json({
      user: {
        name: user.name,
        email: user.email,
        department: user.departmentType.departmentName
      },
      schedule: userSchedule,
      subjects: Object.values(subjectsMap),
      totalPeriods: Object.values(userSchedule).reduce((sum, day) => sum + day.length, 0)
    });

  } catch (err) {
    console.error("getUserTimetable Error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};
