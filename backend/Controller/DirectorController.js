const User = require("../Models/User");
const Department = require("../Models/Department");
const EmployeeLeave = require("../Models/EmployeeLeave");
const LeaveType = require("../Models/LeaveType");
const LeaveRequest = require("../Models/LeaveRequest");

// =============================
// GET DEPARTMENT-WISE FACULTY WITH LEAVE DETAILS
// =============================
exports.getDepartmentWiseFacultyWithLeaves = async (req, res) => {
  try {
    const { departmentId } = req.params;

    // If departmentId is provided, get faculty for that department only
    // Otherwise, get all departments
    let departments;
    if (departmentId && departmentId !== 'all') {
      const dept = await Department.findById(departmentId);
      if (!dept) {
        return res.status(404).json({ message: "Department not found" });
      }
      departments = [dept];
    } else {
      departments = await Department.find().sort({ departmentName: 1 });
    }

    const result = [];

    for (const dept of departments) {
      // Get all faculty in this department
      const faculty = await User.find({
        departmentType: dept._id,
        role: { $in: ["teaching", "non-teaching", "hod"] }
      })
        .select("name email phone dateOfJoining role")
        .sort({ name: 1 });

      const facultyWithLeaves = await Promise.all(
        faculty.map(async (fac) => {
          // Get all leave allocations for this faculty
          const leaveAllocations = await EmployeeLeave.find({
            employeeId: fac._id
          }).populate("leaveTypeId", "name allowedLeaves leaveEffect");

          // Get all approved leave requests for this faculty
          const approvedLeaves = await LeaveRequest.find({
            employeeId: fac._id,
            status: { $in: ["Approved by Director", "approved"] }
          });

          // Format leave details
          const leaveDetails = leaveAllocations.map((allocation) => {
            const effect = allocation.leaveTypeId?.leaveEffect || "DEDUCT";
            const totalAllowed =
              effect === "ADD"
                ? allocation.creditedLeaves || 0
                : (allocation.totalLeaves || 0) + (allocation.carryForwardLeaves || 0);

            const usedLeaves = allocation.usedLeaves || 0;
            const availableLeaves = Math.max(totalAllowed - usedLeaves, 0);

            return {
              leaveType: allocation.leaveTypeId?.name || "Unknown",
              leaveEffect: effect,
              totalAllowed,
              usedLeaves,
              availableLeaves,
              carryForward: allocation.carryForwardLeaves || 0
            };
          });

          return {
            _id: fac._id,
            name: fac.name,
            email: fac.email,
            phone: fac.phone,
            dateOfJoining: fac.dateOfJoining,
            role: fac.role,
            leaveDetails,
            totalLeavesApproved: approvedLeaves.length
          };
        })
      );

      result.push({
        department: {
          _id: dept._id,
          name: dept.departmentName,
          level: dept.level
        },
        faculty: facultyWithLeaves
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Error fetching department-wise faculty:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// =============================
// GET SINGLE FACULTY COMPLETE DETAILS
// =============================
exports.getFacultyCompleteDetails = async (req, res) => {
  try {
    const { facultyId } = req.params;

    const faculty = await User.findById(facultyId)
      .populate("departmentType", "departmentName level")
      .select("name email phone dateOfJoining role address highestQualification specialization yearsOfExperience employeeType");

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Get leave allocations
    const leaveAllocations = await EmployeeLeave.find({
      employeeId: facultyId
    }).populate("leaveTypeId", "name allowedLeaves leaveEffect");

    // Get all leave requests (approved, pending, rejected)
    const leaveRequests = await LeaveRequest.find({
      employeeId: facultyId
    })
      .populate("leaveTypeId", "name")
      .sort({ createdAt: -1 });

    // Format leave details
    const leaveDetails = leaveAllocations.map((allocation) => {
      const effect = allocation.leaveTypeId?.leaveEffect || "DEDUCT";
      const totalAllowed =
        effect === "ADD"
          ? allocation.creditedLeaves || 0
          : (allocation.totalLeaves || 0) + (allocation.carryForwardLeaves || 0);

      const usedLeaves = allocation.usedLeaves || 0;
      const availableLeaves = Math.max(totalAllowed - usedLeaves, 0);

      return {
        leaveType: allocation.leaveTypeId?.name || "Unknown",
        leaveEffect: effect,
        totalAllowed,
        usedLeaves,
        availableLeaves,
        carryForward: allocation.carryForwardLeaves || 0,
        creditedLeaves: allocation.creditedLeaves || 0
      };
    });

    // Format leave requests
    const formattedRequests = leaveRequests.map((req) => ({
      _id: req._id,
      leaveType: req.leaveTypeId?.name || "Unknown",
      startDate: req.startDate,
      endDate: req.endDate,
      totalDays: req.totalDays,
      status: req.status,
      description: req.description,
      createdAt: req.createdAt
    }));

    res.json({
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        phone: faculty.phone,
        dateOfJoining: faculty.dateOfJoining,
        role: faculty.role,
        employeeType: faculty.employeeType,
        address: faculty.address,
        highestQualification: faculty.highestQualification,
        specialization: faculty.specialization,
        yearsOfExperience: faculty.yearsOfExperience,
        department: faculty.departmentType
      },
      leaveDetails,
      leaveRequests: formattedRequests,
      summary: {
        totalLeaveTypes: leaveDetails.length,
        totalRequests: formattedRequests.length,
        approvedRequests: formattedRequests.filter(r => ["Approved by Director", "approved"].includes(r.status)).length,
        pendingRequests: formattedRequests.filter(r => r.status.toLowerCase().includes("pending")).length,
        rejectedRequests: formattedRequests.filter(r => r.status.includes("rejected")).length
      }
    });
  } catch (err) {
    console.error("Error fetching faculty complete details:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

module.exports = exports;
