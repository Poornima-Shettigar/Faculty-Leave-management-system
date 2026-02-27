// const User = require("../Models/User");
// const Department = require("../Models/Department");
// const bcrypt = require("bcryptjs");

// // =============================
// //  ADD FACULTY (WITHOUT EMAIL)
// // =============================
// const LeaveType = require("../Models/LeaveType");
// const EmployeeLeave = require("../Models/EmployeeLeave");

// exports.addFaculty = async (req, res) => {
//   try {
//     let { name, email, phone, password, dateOfJoining, departmentType, employeeType } = req.body;

//     console.log(req.body);

//     // ----------------------
//     // Validation
//     // ----------------------
//     if (!name || !employeeType || !email || !departmentType || !dateOfJoining) {
//       return res.status(400).json({ message: "Name, Employee Type, Email, Department, and Date of Joining are required." });
//     }

//     // Check if email exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "Email already exists." });

//     // Validate department
//     const deptExists = await Department.findById(departmentType);
//     if (!deptExists) return res.status(400).json({ message: "Invalid Department selected." });

//     // Generate random password if not provided
//     if (!password) {
//       password = Math.random().toString(36).slice(-8);
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Map employeeType to role
//     const roleMapping = {
//       teaching: "teaching",
//       "non-teaching": "non-teaching",
//       hod: "hod",
//       director: "director"
//     };
//     const role = roleMapping[employeeType] || "teaching";

//     // Save user
//     const newFaculty = new User({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       dateOfJoining,
//       departmentType,
//       employeeType,
//       role
//     });

//     await newFaculty.save();

//     // ----------------------
//     // Automatic Leave Allocation
//     // ----------------------
//     const leaveTypes = await LeaveType.find({ roles: role }); // filter by role
//     const allocations = leaveTypes.map(lt => ({
//       employeeId: newFaculty._id,
//       leaveTypeId: lt._id,
//       totalLeaves: lt.allowedLeaves
//     }));

//     if (allocations.length > 0) {
//       await EmployeeLeave.insertMany(allocations);
//     }

//     res.status(201).json({
//       message: `Faculty added successfully. ${allocations.length} leave types allocated automatically.`,
//       faculty: newFaculty
//     });

//   } catch (err) {
//     console.error("Error adding faculty:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // =============================
// //  GET FACULTY LIST
// // =============================
// exports.getFacultyList = async (req, res) => {
//   try {
//     const faculty = await User.find({ role: { $in: ["teaching", "non-teaching", "hod", "director"] } })
//       .populate("departmentType", "departmentName level")
//       .sort({ name: 1 });

//     res.status(200).json(faculty);

//   } catch (err) {
//     console.error("Error fetching faculty:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
// // =============================
// // EDIT FACULTY
// // =============================
// exports.updateFaculty = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, phone, password, dateOfJoining, departmentType, employeeType } = req.body;

//     const user = await User.findById(id);
//     if (!user) return res.status(404).json({ message: "User not found." });

//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.phone = phone || user.phone;
//     user.dateOfJoining = dateOfJoining || user.dateOfJoining;

//     if (departmentType) {
//       const deptExists = await Department.findById(departmentType);
//       if (!deptExists) return res.status(400).json({ message: "Invalid Department selected." });
//       user.departmentType = departmentType;
//     }

//     if (employeeType) {
//       const roleMapping = {
//         teaching: "teaching",
//         "non-teaching": "non-teaching",
//         hod: "hod",
//         director: "director"
//       };
//       user.employeeType = employeeType;
//       user.role = roleMapping[employeeType] || user.role;
//     }

//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       user.password = await bcrypt.hash(password, salt);
//     }

//     await user.save();
//     res.status(200).json({ message: "Faculty updated successfully.", faculty: user });

//   } catch (err) {
//     console.error("Error updating faculty:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// // =============================
// // DELETE FACULTY
// // =============================
// exports.deleteFaculty = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id);
//     if (!user) return res.status(404).json({ message: "User not found." });

//     await User.findByIdAndDelete(id);
//     res.status(200).json({ message: "Faculty deleted successfully." });
//   } catch (err) {
//     console.error("Error deleting faculty:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
// // =============================
// // GET FACULTY BY DEPARTMENT
// // =============================
// exports.getFacultyByDepartment = async (req, res) => {
//   try {
//     const { id } = req.params;
// console.log("--- Debugging Faculty Fetch ---");
//     console.log("Searching for Department ID:", id);
//     const faculty = await User.find({
//       departmentType: id,
//       role: { $in: ["teaching", "non-teaching", "hod", "director"] }
//     }).sort({ name: 1 });

//     res.status(200).json(faculty);

//   } catch (err) {
//     console.error("Error fetching faculty by department:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
// // =============================
// // GET SINGLE FACULTY BY ID
// // =============================
// exports.getFacultyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const facultyMember = await User.findById(id).populate("departmentType", "departmentName level");

//     if (!facultyMember) {
//       return res.status(404).json({ message: "Faculty member not found" });
//     }

//     res.status(200).json(facultyMember);

//   } catch (err) {
//     console.error("Error fetching faculty by ID:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
// // =============================
// //  TOTAL FACULTY COUNT
// // =============================
// exports.getFacultyCount = async (req, res) => {
//   try {
//     const count = await User.countDocuments({
//       role: { $in: ["teaching", "non-teaching", "hod", "director"] }
//     });

//     res.status(200).json({ totalFaculties: count });
//   } catch (err) {
//     console.error("Error counting faculties:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // =============================
// //  GET ADMIN DASHBOARD STATS (Teaching/Non-teaching by Department)
// // =============================
// exports.getAdminDashboardStats = async (req, res) => {
//   try {
//     const departments = await Department.find().sort({ departmentName: 1 });
//     const stats = [];

//     for (const dept of departments) {
//       const teachingCount = await User.countDocuments({
//         departmentType: dept._id,
//         role: "teaching"
//       });

//       const nonTeachingCount = await User.countDocuments({
//         departmentType: dept._id,
//         role: "non-teaching"
//       });

//       stats.push({
//         departmentId: dept._id,
//         departmentName: dept.departmentName,
//         teachingStaff: teachingCount,
//         nonTeachingStaff: nonTeachingCount,
//         total: teachingCount + nonTeachingCount
//       });
//     }

//     res.status(200).json(stats);
//   } catch (err) {
//     console.error("Error fetching admin dashboard stats:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // =============================
// // GET FACULTY BY DEPARTMENT FOR HOD (WITH SUBJECTS)
// // =============================
// exports.getHodDepartmentFaculty = async (req, res) => {
//   try {
//     const { departmentId } = req.params;

//     // Get all faculty in the department
//     const faculty = await User.find({
//       departmentType: departmentId,
//       role: { $in: ["teaching", "non-teaching", "hod"] }
//     }).sort({ name: 1 });

//     // For each faculty, get their subjects
//     const facultyWithSubjects = await Promise.all(
//       faculty.map(async (fac) => {
//         const subjects = await require("../Models/Subject").find({
//           faculty: fac._id
//         }).select("subjectName className semester");

//         return {
//           _id: fac._id,
//           name: fac.name,
//           email: fac.email,
//           subjects: subjects
//         };
//       })
//     );

//     res.status(200).json(facultyWithSubjects);
//   } catch (err) {
//     console.error("Error fetching HOD department faculty:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };
const User = require("../Models/User");
const Department = require("../Models/Department");
const Subject = require("../Models/Subject");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const bcrypt = require("bcryptjs");

// =============================
// ADD FACULTY
// =============================
exports.addFaculty = async (req, res) => {
  try {
    let {
      name,
      email,
      phone,
      password,
      dateOfJoining,
      departmentType,
      employeeType,
      address,
      highestQualification,
      specialization,
      yearsOfExperience
    } = req.body;

    if (!name || !email || !employeeType || !departmentType || !dateOfJoining || !phone || !address || !highestQualification || !specialization || yearsOfExperience === undefined) {
      return res.status(400).json({ message: "All fields are required including address, qualification, specialization and experience." });
    }

    // Phone validation: ^9\d{9}$
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number (starting with 6-9)." });
    }

    // Address validation: Min 10 chars
    if (address.length < 10) {
      return res.status(400).json({ message: "Address must be at least 10 characters long." });
    }

    // Highest Qualification: Letters, spaces, dots
    if (!/^[a-zA-Z\s.]+$/.test(highestQualification)) {
      return res.status(400).json({ message: "Highest Qualification can only contain letters, spaces, and dots." });
    }

    // Specialization: Letters, spaces
    if (!/^[a-zA-Z\s]+$/.test(specialization)) {
      return res.status(400).json({ message: "Specialization can only contain letters and spaces." });
    }

    // Years of Experience: 0-50
    const exp = Number(yearsOfExperience);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      return res.status(400).json({ message: "Years of Experience must be a number between 0 and 50." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const dept = await Department.findById(departmentType);
    if (!dept)
      return res.status(400).json({ message: "Invalid department" });

    if (!password) {
      password = Math.random().toString(36).slice(-8);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const roleMapping = {
      teaching: "teaching",
      "non-teaching": "non-teaching",
      hod: "hod",
      director: "director"
    };

    const role = roleMapping[employeeType] || "teaching";

    const newFaculty = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      dateOfJoining,
      departmentType,
      employeeType,
      role,
      address,
      highestQualification,
      specialization,
      yearsOfExperience: exp
    });

    await newFaculty.save();

    // Auto leave allocation
    const leaveTypes = await LeaveType.find({ roles: role });
    const allocations = leaveTypes.map((lt) => ({
      employeeId: newFaculty._id,
      leaveTypeId: lt._id,
      totalLeaves: lt.allowedLeaves
    }));

    if (allocations.length) {
      await EmployeeLeave.insertMany(allocations);
    }

    res.status(201).json({
      message: "Faculty added successfully",
      faculty: newFaculty
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// GET ALL FACULTY
// =============================
exports.getFacultyList = async (req, res) => {
  try {
    const faculty = await User.find({
      role: { $in: ["teaching", "non-teaching", "hod", "director"] }
    })
      .populate("departmentType", "departmentName level")
      .sort({ name: 1 });

    res.status(200).json(faculty);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// UPDATE FACULTY
// =============================
exports.updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { phone, address, highestQualification, specialization, yearsOfExperience } = req.body;

    // Phone validation
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number (starting with 6-9)." });
    }

    // Address validation
    if (address && address.length < 10) {
      return res.status(400).json({ message: "Address must be at least 10 characters long." });
    }

    // Highest Qualification
    if (highestQualification && !/^[a-zA-Z\s.]+$/.test(highestQualification)) {
      return res.status(400).json({ message: "Highest Qualification can only contain letters, spaces, and dots." });
    }

    // Specialization
    if (specialization && !/^[a-zA-Z\s]+$/.test(specialization)) {
      return res.status(400).json({ message: "Specialization can only contain letters and spaces." });
    }

    // Years of Experience
    if (yearsOfExperience !== undefined) {
      const exp = Number(yearsOfExperience);
      if (isNaN(exp) || exp < 0 || exp > 50) {
        return res.status(400).json({ message: "Years of Experience must be a number between 0 and 50." });
      }
      req.body.yearsOfExperience = exp;
    }

    Object.assign(user, req.body);

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();
    res.json({ message: "Faculty updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// UPDATE OWN PROFILE (Excluding Email)
// =============================
exports.updateOwnProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, password, address, highestQualification, specialization, yearsOfExperience } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Phone validation
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number (starting with 6-9)." });
    }

    // Address validation
    if (address && address.length < 10) {
      return res.status(400).json({ message: "Address must be at least 10 characters long." });
    }

    // Highest Qualification
    if (highestQualification && !/^[a-zA-Z\s.]+$/.test(highestQualification)) {
      return res.status(400).json({ message: "Highest Qualification can only contain letters, spaces, and dots." });
    }

    // Specialization
    if (specialization && !/^[a-zA-Z\s]+$/.test(specialization)) {
      return res.status(400).json({ message: "Specialization can only contain letters and spaces." });
    }

    // Years of Experience
    if (yearsOfExperience !== undefined) {
      const exp = Number(yearsOfExperience);
      if (isNaN(exp) || exp < 0 || exp > 50) {
        return res.status(400).json({ message: "Years of Experience must be a number between 0 and 50." });
      }
      user.yearsOfExperience = exp;
    }

    // Update only allowed fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (highestQualification) user.highestQualification = highestQualification;
    if (specialization) user.specialization = specialization;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Profile updated successfully",
      user: userResponse
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// DELETE FACULTY
// =============================
const LeaveRequest = require("../Models/LeaveRequest");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");

exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Delete the user
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // 2) Delete all EmployeeLeave allocations for this faculty
    await EmployeeLeave.deleteMany({ employeeId: id });

    // 3) Find all leave requests raised by this faculty
    const requests = await LeaveRequest.find({ employeeId: id }).select("_id");
    const requestIds = requests.map((r) => r._id);

    if (requestIds.length > 0) {
      // 4) Delete those leave requests
      await LeaveRequest.deleteMany({ _id: { $in: requestIds } });

      // 5) Delete all notifications linked to those leave requests
      await Notification.deleteMany({ leaveRequestId: { $in: requestIds } });
    }

    // 6) Delete notifications where this user is the recipient (e.g., substitute, approver)
    await Notification.deleteMany({ userId: id });

    // 7) Optional: clear this faculty from timetable and subjects
    // Remove this faculty as owner/assigned in Subject
    await Subject.updateMany(
      { faculty: id },
      { $unset: { faculty: "" } }
    );

    // Remove as faculty or substitute in Timetable entries
    await Timetable.updateMany(
      { "timetable.faculty": id },
      { $set: { "timetable.$[p].faculty": null } },
      { arrayFilters: [{ "p.faculty": id }] }
    );

    res.json({ message: "Faculty and all related data deleted successfully" });
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
    const faculty = await User.find({
      departmentType: req.params.id
    }).sort({ name: 1 });

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// GET SINGLE FACULTY
// =============================
exports.getFacultyById = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id)
      .populate({
        path: 'departmentType',
        select: 'departmentName level'
      });

    if (!faculty)
      return res.status(404).json({ message: "Faculty not found" });

    console.log("Faculty data with department:", faculty);
    res.json(faculty);
  } catch (err) {
    console.error("Error getting faculty by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// FACULTY COUNT
// =============================
exports.getFacultyCount = async (req, res) => {
  try {
    const total = await User.countDocuments({
      role: { $in: ["teaching", "non-teaching", "hod", "director"] }
    });
    res.json({ totalFaculties: total });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// ADMIN DASHBOARD STATS
// =============================
// exports.getAdminDashboardStats = async (req, res) => {
//   try {
//     const departments = await Department.find();
//     const stats = [];

//     for (const dept of departments) {
//       const teaching = await User.countDocuments({
//         departmentType: dept._id,
//         role: "teaching"
//       });
//       const nonTeaching = await User.countDocuments({
//         departmentType: dept._id,
//         role: "non-teaching"
//       });

//       stats.push({
//         departmentName: dept.departmentName,
//         teachingStaff: teaching,
//         nonTeachingStaff: nonTeaching,
//         total: teaching + nonTeaching
//       });
//     }

//     res.json(stats);
//   } catch (err) {
//     res.status(500).json({ message: "Server Error" });
//   }
// };
// =============================
// ADMIN DASHBOARD STATS (FIXED)
// =============================
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const departments = await Department.find().sort({ departmentName: 1 });
    const stats = [];

    for (const dept of departments) {
      // Logic: HODs are usually considered teaching staff. 
      // If you want HODs included in the teaching count:
      const teaching = await User.countDocuments({
        departmentType: dept._id,
        role: { $in: ["teaching", "hod", "director"] } // Include HOD here
      });

      const nonTeaching = await User.countDocuments({
        departmentType: dept._id,
        role: "non-teaching"
      });

      stats.push({
        departmentId: dept._id, // Adding this helps React keys
        departmentName: dept.departmentName,
        teachingStaff: teaching,
        nonTeachingStaff: nonTeaching,
        total: teaching + nonTeaching
      });
    }

    res.json(stats);
  } catch (err) {
    console.error("Error fetching admin dashboard stats:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// ✅ HOD – FACULTY WITH SUBJECTS
// =============================
exports.getHodDepartmentFaculty = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const faculty = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching", "hod"] }
    })
      .select("name email")
      .sort({ name: 1 });

    const facultyWithSubjects = await Promise.all(
      faculty.map(async (fac) => {
        const subjects = await Subject.find({
          faculty: fac._id
        }).select("subjectName className semester");

        return {
          _id: fac._id,
          name: fac.name,
          email: fac.email,
          subjects
        };
      })
    );

    res.json(facultyWithSubjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// ✅ CHECK PHONE UNIQUENESS
// =============================
exports.checkPhoneUniqueness = async (req, res) => {
  try {
    const { phone } = req.params;
    
    // Validate phone format
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Check if phone number exists
    const existingUser = await User.findOne({ phone });
    
    if (existingUser) {
      return res.json({ 
        exists: true, 
        userId: existingUser._id 
      });
    }
    
    res.json({ exists: false });
  } catch (err) {
    console.error("Error checking phone uniqueness:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
