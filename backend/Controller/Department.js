
const Department = require("../Models/Department");
const Subject = require("../Models/Subject");
const Timetable = require("../Models/Timetable");

// =============================
//  ADD DEPARTMENT
// =============================
exports.addDepartment = async (req, res) => {
    try {
        const { departmentName, level } = req.body;
console.log(req.body);
        if (!departmentName || !level) {
            return res.status(400).json({ message: "Department name and level (UG/PG) are required." });
        }

        const exists = await Department.findOne({ departmentName });
        if (exists) {
            return res.status(400).json({ message: "Department already exists." });
        }

        const newDepartment = new Department({
            departmentName,
            level,
            totalClasses: 0,
            classNames: []
        });

        await newDepartment.save();

        return res.status(201).json({
            message: "Department created successfully",
            department: newDepartment
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// =============================
//  GET ALL DEPARTMENTS
// =============================
exports.getDepartmentList = async (req, res) => {
    try {
        const departments = await Department.find().sort({ createdAt: -1 });
        res.status(200).json(departments);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
//  GET SINGLE DEPARTMENT
// =============================
exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.status(200).json(department);

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
//  UPDATE / EDIT DEPARTMENT
// =============================
exports.updateDepartment = async (req, res) => {
    try {
        const { departmentName, level } = req.body;

        if (!departmentName || !level) {
            return res.status(400).json({ message: "Department name and level are required." });
        }

        const updatedDepartment = await Department.findByIdAndUpdate(
            req.params.id,
            { departmentName, level },
            { new: true }
        );

        if (!updatedDepartment) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.status(200).json({
            message: "Department updated successfully",
            department: updatedDepartment
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
//  DELETE DEPARTMENT
// =============================
exports.deleteDepartment = async (req, res) => {
    try {
        const deleted = await Department.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Department not found" });
        }

        res.status(200).json({ message: "Department deleted successfully" });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// =============================
//  TOTAL DEPARTMENT COUNT
// =============================
exports.getDepartmentCount = async (req, res) => {
  try {
    const count = await Department.countDocuments();
    res.status(200).json({ totalDepartments: count });
  } catch (err) {
    console.error("Error counting departments:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
//  GET DEPARTMENT BY NAME
// =============================
exports.getDepartmentByName = async (req, res) => {
  try {
    const dept = await Department.findOne({ departmentName: req.params.departmentName });

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json(dept);

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
//  ADD CLASS TO DEPARTMENT
// =============================
exports.addClassToDepartment = async (req, res) => {
  try {
    const { departmentName, className } = req.body;

    if (!departmentName || !className) {
      return res.status(400).json({ message: "Department name and class name are required" });
    }

    const dept = await Department.findOne({ departmentName });

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Prevent duplicate class names
    if (dept.classNames.includes(className)) {
      return res.status(400).json({ message: "Class already exists" });
    }

    dept.classNames.push(className);
    dept.totalClasses = dept.classNames.length;

    await dept.save();

    return res.status(200).json({
      message: "Class added successfully",
      department: dept
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// UPDATE CLASS NAME
// exports.updateClassName = async (req, res) => {
//   try {
//     const { departmentName, oldClassName, newClassName } = req.body;

//     if (!departmentName || !oldClassName || !newClassName) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const dept = await Department.findOne({ departmentName });
//     if (!dept) return res.status(404).json({ message: "Department not found" });

//     const classIndex = dept.classNames.indexOf(oldClassName);
//     if (classIndex === -1) {
//       return res.status(404).json({ message: "Class not found" });
//     }

//     // Prevent duplicate names
//     if (dept.classNames.includes(newClassName)) {
//       return res.status(400).json({ message: "Class with this name already exists" });
//     }

//     dept.classNames[classIndex] = newClassName;
//     await dept.save();

//     return res.status(200).json({
//       message: "Class updated successfully",
//       department: dept
//     });

//   } catch (err) {
//     console.error("Error updating class:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// UPDATE CLASS NAME + REFLECT EVERYWHERE
// exports.updateClassName = async (req, res) => {
//   try {
//     const { departmentName, oldClassName, newClassName } = req.body;

//     if (!departmentName || !oldClassName || !newClassName) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const dept = await Department.findOne({ departmentName });
//     if (!dept) return res.status(404).json({ message: "Department not found" });

//     const classIndex = dept.classNames.indexOf(oldClassName);
//     if (classIndex === -1) {
//       return res.status(404).json({ message: "Class not found" });
//     }

//     // Prevent duplicate newName
//     if (dept.classNames.includes(newClassName)) {
//       return res.status(400).json({ message: "Class with this name already exists" });
//     }

//     // 1️⃣ UPDATE IN DEPARTMENT
//     dept.classNames[classIndex] = newClassName;
//     await dept.save();

//     // 2️⃣ UPDATE IN SUBJECTS
//     await Subject.updateMany(
//       { department: dept._id, className: oldClassName },
//       { $set: { className: newClassName } }
//     );

//     // 3️⃣ UPDATE IN TIMETABLES
//     await Timetable.updateMany(
//       { className: oldClassName },
//       { $set: { className: newClassName } }
//     );

//     return res.status(200).json({
//       message: "Class updated successfully everywhere",
//       department: dept
//     });

//   } catch (err) {
//     console.error("Error updating class:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
exports.updateClassName = async (req, res) => {
  try {
    const { oldClassName, newClassName, departmentId, departmentName } = req.body;

    if (!oldClassName || !newClassName || (!departmentId && !departmentName)) {
      return res
        .status(400)
        .json({ message: "oldClassName, newClassName and departmentId/departmentName are required." });
    }

    const dept = departmentId
      ? await Department.findById(departmentId)
      : await Department.findOne({ departmentName });

    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const classIndex = dept.classNames.indexOf(oldClassName);
    if (classIndex === -1) {
      return res.status(404).json({ message: "Class not found in this department" });
    }

    if (dept.classNames.includes(newClassName)) {
      return res.status(400).json({ message: "A class with the new name already exists" });
    }

    // 1) Update stored class names
    dept.classNames[classIndex] = newClassName;
    await dept.save();

    // 2) Update subjects referencing this class
    const subjectUpdate = await Subject.updateMany(
      { className: oldClassName, department: dept._id },
      { $set: { className: newClassName } }
    );

    // 3) Update timetables referencing this class
    const timetableUpdate = await Timetable.updateMany(
      { className: oldClassName, departmentType: dept._id },
      { $set: { className: newClassName } }
    );

    res.json({
      message: "Class name updated in department, subjects, and timetables.",
      updated: {
        subjects: subjectUpdate.modifiedCount,
        timetables: timetableUpdate.modifiedCount,
      },
    });
  } catch (err) {
    console.error("Error updating class:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};


// REMOVE CLASS FROM DEPARTMENT
exports.removeClassFromDepartment = async (req, res) => {
  try {
    const { departmentName, className } = req.body;

    if (!departmentName || !className) {
      return res.status(400).json({ message: "Department name and class name are required" });
    }

    const dept = await Department.findOne({ departmentName });
    if (!dept) return res.status(404).json({ message: "Department not found" });

    const classIndex = dept.classNames.indexOf(className);
    if (classIndex === -1) {
      return res.status(404).json({ message: "Class not found" });
    }

    dept.classNames.splice(classIndex, 1); // Remove class
    dept.totalClasses = dept.classNames.length;
    await dept.save();

    return res.status(200).json({
      message: "Class removed successfully",
      department: dept
    });

  } catch (err) {
    console.error("Error removing class:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
