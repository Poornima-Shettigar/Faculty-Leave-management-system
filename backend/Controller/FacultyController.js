const User = require("../Models/User");
const Department = require("../Models/Department");
const bcrypt = require("bcryptjs");

// =============================
//  ADD FACULTY (WITHOUT EMAIL)
// =============================
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");

exports.addFaculty = async (req, res) => {
  try {
    let { name, email, phone, password, dateOfJoining, departmentType, employeeType } = req.body;

    console.log(req.body);

    // ----------------------
    // Validation
    // ----------------------
    if (!name || !employeeType || !email || !departmentType || !dateOfJoining) {
      return res.status(400).json({ message: "Name, Employee Type, Email, Department, and Date of Joining are required." });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists." });

    // Validate department
    const deptExists = await Department.findById(departmentType);
    if (!deptExists) return res.status(400).json({ message: "Invalid Department selected." });

    // Generate random password if not provided
    if (!password) {
      password = Math.random().toString(36).slice(-8);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Map employeeType to role
    const roleMapping = {
      teaching: "teaching",
      "non-teaching": "non-teaching",
      hod: "hod",
      director: "director"
    };
    const role = roleMapping[employeeType] || "teaching";

    // Save user
    const newFaculty = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      dateOfJoining,
      departmentType,
      employeeType,
      role
    });

    await newFaculty.save();

    // ----------------------
    // Automatic Leave Allocation
    // ----------------------
    const leaveTypes = await LeaveType.find({ roles: role }); // filter by role
    const allocations = leaveTypes.map(lt => ({
      employeeId: newFaculty._id,
      leaveTypeId: lt._id,
      totalLeaves: lt.allowedLeaves
    }));

    if (allocations.length > 0) {
      await EmployeeLeave.insertMany(allocations);
    }

    res.status(201).json({
      message: `Faculty added successfully. ${allocations.length} leave types allocated automatically.`,
      faculty: newFaculty
    });

  } catch (err) {
    console.error("Error adding faculty:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
//  GET FACULTY LIST
// =============================
exports.getFacultyList = async (req, res) => {
  try {
    const faculty = await User.find({ role: { $in: ["teaching", "non-teaching", "hod", "director"] } })
      .populate("departmentType", "departmentName level")
      .sort({ name: 1 });

    res.status(200).json(faculty);

  } catch (err) {
    console.error("Error fetching faculty:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
// EDIT FACULTY
// =============================
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, dateOfJoining, departmentType, employeeType } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.dateOfJoining = dateOfJoining || user.dateOfJoining;

    if (departmentType) {
      const deptExists = await Department.findById(departmentType);
      if (!deptExists) return res.status(400).json({ message: "Invalid Department selected." });
      user.departmentType = departmentType;
    }

    if (employeeType) {
      const roleMapping = {
        teaching: "teaching",
        "non-teaching": "non-teaching",
        hod: "hod",
        director: "director"
      };
      user.employeeType = employeeType;
      user.role = roleMapping[employeeType] || user.role;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.status(200).json({ message: "Faculty updated successfully.", faculty: user });

  } catch (err) {
    console.error("Error updating faculty:", err);
    res.status(500).json({ message: "Server Error" });
  }
};


// =============================
// DELETE FACULTY
// =============================
exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "Faculty deleted successfully." });
  } catch (err) {
    console.error("Error deleting faculty:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
// GET FACULTY BY DEPARTMENT
// =============================
exports.getFacultyByDepartment = async (req, res) => {
  try {
    const { id } = req.params;
console.log("--- Debugging Faculty Fetch ---");
    console.log("Searching for Department ID:", id);
    const faculty = await User.find({
      departmentType: id,
      role: { $in: ["teaching", "non-teaching", "hod", "director"] }
    }).sort({ name: 1 });

    res.status(200).json(faculty);

  } catch (err) {
    console.error("Error fetching faculty by department:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
// GET SINGLE FACULTY BY ID
// =============================
exports.getFacultyById = async (req, res) => {
  try {
    const { id } = req.params;

    const facultyMember = await User.findById(id).populate("departmentType", "departmentName level");

    if (!facultyMember) {
      return res.status(404).json({ message: "Faculty member not found" });
    }

    res.status(200).json(facultyMember);

  } catch (err) {
    console.error("Error fetching faculty by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// =============================
//  TOTAL FACULTY COUNT
// =============================
exports.getFacultyCount = async (req, res) => {
  try {
    const count = await User.countDocuments({
      role: { $in: ["teaching", "non-teaching", "hod", "director"] }
    });

    res.status(200).json({ totalFaculties: count });
  } catch (err) {
    console.error("Error counting faculties:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
