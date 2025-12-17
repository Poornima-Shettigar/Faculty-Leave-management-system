const LeaveRequest = require("../Models/LeaveRequest");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const User = require("../Models/User");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");
const moment = require("moment");

// Helper function to create notifications
const createNotification = async (userId, leaveRequestId, type, title, message) => {
  try {
    const notification = new Notification({
      userId,
      leaveRequestId,
      type,
      title,
      message
    });
    await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Helper function to get periods for date range
const getPeriodsForDateRange = async (employeeId, startDate, endDate) => {
  const periods = [];
  const currentDate = moment(startDate);
  const end = moment(endDate);

  // Get user's department
  const user = await User.findById(employeeId).populate("departmentType");
  if (!user || !user.departmentType) return periods;

  // Get all timetables for the department
  const timetables = await Timetable.find({ departmentType: user.departmentType._id })
    .populate("timetable.faculty", "name email")
    .populate("timetable.subject", "subjectName subjectCode");

  while (currentDate.isSameOrBefore(end)) {
    const dayName = currentDate.format("dddd"); // Monday, Tuesday, etc.
    const dateStr = currentDate.format("YYYY-MM-DD");

    // Find all periods for this day where the employee is assigned
    for (const timetable of timetables) {
      const dayPeriods = timetable.timetable.filter(
        entry => entry.day === dayName && 
                  entry.faculty && 
                  entry.faculty._id.toString() === employeeId.toString()
      );

      for (const period of dayPeriods) {
        periods.push({
          date: dateStr,
          day: dayName,
          period: period.period,
          className: timetable.className,
          departmentId: user.departmentType._id,
          subjectId: period.subject?._id || period.subject,
          subjectName: period.subject?.subjectName || "N/A",
          facultyId: period.faculty?._id
        });
      }
    }

    currentDate.add(1, "day");
  }

  return periods;
};

// =============================
//  APPLY LEAVE REQUEST
// =============================
exports.applyLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, description, periodAdjustments } = req.body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !description) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate dates
    const start = moment(startDate);
    const end = moment(endDate);
    if (end.isBefore(start)) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    const totalDays = end.diff(start, "days") + 1;

    // Check if it's emergency leave (description contains "emergency")
    const isEmergencyLeave = description.toLowerCase().includes("emergency");

    // Check leave balance
    const employeeLeave = await EmployeeLeave.findOne({
      employeeId,
      leaveTypeId
    });

    if (!employeeLeave) {
      return res.status(400).json({ message: "Leave type not allocated to this employee" });
    }

    const totalAvailable = (employeeLeave.totalLeaves || 0) + (employeeLeave.carryForwardLeaves || 0);
    const remaining = totalAvailable - (employeeLeave.usedLeaves || 0);

    if (totalDays > remaining) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. Available: ${remaining}, Requested: ${totalDays}` 
      });
    }

    // Get user role to determine approval flow
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If HOD, send directly to director
    const status = user.role === "hod" ? "pending_director" : "pending_hod";

    // Get periods if user is teaching staff or HOD (HODs can also be teaching)
    // For emergency leave, period adjustments are optional
    let periods = [];
    if ((user.role === "teaching" || user.role === "hod") && (!periodAdjustments || periodAdjustments.length === 0)) {
      periods = await getPeriodsForDateRange(employeeId, startDate, endDate);
    } else if (periodAdjustments && periodAdjustments.length > 0) {
      periods = periodAdjustments;
    }

    // Validate substitute faculty availability if period adjustments are provided
    if (periods && periods.length > 0) {
      for (const period of periods) {
        if (period.substituteFacultyId) {
          // Check if substitute has approved leave on this date
          const substituteLeave = await LeaveRequest.findOne({
            employeeId: period.substituteFacultyId,
            status: "approved",
            startDate: { $lte: moment(period.date).toDate() },
            endDate: { $gte: moment(period.date).toDate() }
          });

          if (substituteLeave) {
            const substitute = await User.findById(period.substituteFacultyId);
            return res.status(400).json({
              message: `Substitute faculty ${substitute?.name || "Selected"} is on leave on ${moment(period.date).format("MMM D, YYYY")}. Please select another substitute.`
            });
          }
        }
      }
    }

    // Convert date strings to Date objects for period adjustments
    // For emergency leave, allow periods without substitutes (status: "not_required")
    const formattedPeriodAdjustments = periods.map(period => {
      let status = "pending";
      if (period.substituteFacultyId) {
        status = "adjusted";
      } else if (isEmergencyLeave) {
        status = "not_required";
      }
      
      return {
        ...period,
        date: moment(period.date).toDate(), // Convert string to Date
        departmentId: period.departmentId,
        subjectId: period.subjectId,
        substituteFacultyId: period.substituteFacultyId || null,
        status
      };
    });

    // Create leave request
    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      description,
      periodAdjustments: formattedPeriodAdjustments,
      status
    });

    await leaveRequest.save();

    // Create notifications
    if (user.role === "hod") {
      // HOD requests go directly to director
      const directors = await User.find({ role: "director" });
      for (const director of directors) {
        await createNotification(
          director._id,
          leaveRequest._id,
          "leave_requested",
          "New Leave Request",
          `${user.name} has applied for ${totalDays} day(s) leave`
        );
      }
    } else {
      // Regular employees go to HOD first
      const hod = await User.findOne({ 
        role: "hod", 
        departmentType: user.departmentType 
      });
      if (hod) {
        await createNotification(
          hod._id,
          leaveRequest._id,
          "leave_requested",
          "New Leave Request",
          `${user.name} has applied for ${totalDays} day(s) leave`
        );
      }
    }

    // Notify employee
    await createNotification(
      employeeId,
      leaveRequest._id,
      "leave_requested",
      "Leave Request Submitted",
      `Your leave request for ${totalDays} day(s) has been submitted successfully`
    );

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest
    });

  } catch (error) {
    console.error("Error applying leave request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET USER'S LEAVE REQUESTS
// =============================
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaveRequests = await LeaveRequest.find({ employeeId })
      .populate("leaveTypeId", "name allowedLeaves")
      .populate("employeeId", "name email")
      .populate("hodApproval.approvedBy", "name")
      .populate("directorApproval.approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);

  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET PERIODS FOR DATE RANGE
// =============================
exports.getPeriodsForDateRange = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.params;

    const periods = await getPeriodsForDateRange(employeeId, startDate, endDate);

    // Get available substitute faculties
    const user = await User.findById(employeeId).populate("departmentType");
    const allSubstitutes = await User.find({
      departmentType: user.departmentType._id,
      role: { $in: ["teaching", "hod"] }, // Include HOD as they can also substitute
      _id: { $ne: employeeId }
    }).select("name email");

    // Filter out substitutes who are on leave during the requested period
    const availableSubstitutes = [];
    const start = moment(startDate);
    const end = moment(endDate);

    for (const substitute of allSubstitutes) {
      // Check if substitute has approved leave during this period
      const conflictingLeaves = await LeaveRequest.find({
        employeeId: substitute._id,
        status: "approved",
        $or: [
          {
            startDate: { $lte: end.toDate() },
            endDate: { $gte: start.toDate() }
          }
        ]
      });

      if (conflictingLeaves.length === 0) {
        availableSubstitutes.push(substitute);
      }
    }

    res.json({
      periods,
      availableSubstitutes
    });

  } catch (error) {
    console.error("Error fetching periods:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  HOD APPROVE/REJECT
// =============================
exports.hodApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, hodId } = req.body; // action: "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email role departmentType");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending_hod") {
      return res.status(400).json({ message: "Leave request is not pending HOD approval" });
    }

    // Check if leave request is for upcoming days only
    const today = moment().startOf("day");
    const leaveStartDate = moment(leaveRequest.startDate).startOf("day");
    
    if (leaveStartDate.isBefore(today)) {
      return res.status(400).json({ 
        message: "Cannot approve/reject leave requests that have already started. You can only approve/reject leaves for upcoming days." 
      });
    }

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized. Only HOD can approve/reject" });
    }

    if (action === "approve") {
      leaveRequest.status = "pending_director";
      leaveRequest.hodApproval = {
        approvedBy: hodId,
        approvedAt: new Date(),
        comments: comments || ""
      };

      // Notify director
      const directors = await User.find({ role: "director" });
      for (const director of directors) {
        await createNotification(
          director._id,
          leaveRequest._id,
          "leave_approved_hod",
          "Leave Request Approved by HOD",
          `${leaveRequest.employeeId.name}'s leave request has been approved by HOD and needs your approval`
        );
      }

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_approved_hod",
        "Leave Request Approved by HOD",
        `Your leave request has been approved by HOD and forwarded to Director`
      );

    } else {
      leaveRequest.status = "rejected_by_hod";
      leaveRequest.hodApproval = {
        approvedBy: hodId,
        approvedAt: new Date(),
        comments: comments || ""
      };

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_rejected_hod",
        "Leave Request Rejected",
        `Your leave request has been rejected by HOD. ${comments ? "Reason: " + comments : ""}`
      );
    }

    await leaveRequest.save();

    res.json({
      message: `Leave request ${action === "approve" ? "approved" : "rejected"} successfully`,
      leaveRequest
    });

  } catch (error) {
    console.error("Error in HOD approval:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  DIRECTOR APPROVE/REJECT
// =============================
exports.directorApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, directorId } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (!["pending_director"].includes(leaveRequest.status)) {
      return res.status(400).json({ message: "Leave request is not pending director approval" });
    }

    // For APPROVAL: Director can approve only before the day of the leave start
    const today = moment().startOf("day");
    const leaveStartDate = moment(leaveRequest.startDate).startOf("day");

    if (action === "approve" && !leaveStartDate.isAfter(today)) {
      return res.status(400).json({
        message: "Director can approve leave only before the day of the leave start (at least 1 day in advance)."
      });
    }

    if (!directorId) {
      return res.status(403).json({ message: "Director id is missing in request." });
    }

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized. Only Director can approve/reject" });
    }

    if (action === "approve") {
      leaveRequest.status = "approved";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments: comments || ""
      };

      // Update employee leave balance
      const employeeLeave = await EmployeeLeave.findOne({
        employeeId: leaveRequest.employeeId._id,
        leaveTypeId: leaveRequest.leaveTypeId
      });

      if (employeeLeave) {
        employeeLeave.usedLeaves = (employeeLeave.usedLeaves || 0) + leaveRequest.totalDays;
        await employeeLeave.save();
      }

      // Apply period adjustments if any
      if (leaveRequest.periodAdjustments && leaveRequest.periodAdjustments.length > 0) {
        for (const adjustment of leaveRequest.periodAdjustments) {
          // Skip invalid adjustment records safely
          if (!adjustment.substituteFacultyId || !adjustment.departmentId || !adjustment.className) {
            continue;
          }

          try {
            const date = moment(adjustment.date);
            const dayName = date.format("dddd");

            // Find timetable and update period
            const timetable = await Timetable.findOne({
              departmentType: adjustment.departmentId,
              className: adjustment.className
            });

            if (timetable) {
              const periodIndex = timetable.timetable.findIndex(
                p => p.day === dayName && p.period === adjustment.period
              );

              if (periodIndex !== -1) {
                timetable.timetable[periodIndex].faculty = adjustment.substituteFacultyId;
                await timetable.save();
              }
            }
          } catch (innerErr) {
            // Log and continue with other adjustments instead of failing whole approval
            console.error("Error applying period adjustment in director approval:", innerErr);
          }
        }
      }

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_approved",
        "Leave Request Approved",
        `Your leave request has been approved by Director`
      );

    } else {
      leaveRequest.status = "rejected_by_director";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments: comments || ""
      };

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_rejected",
        "Leave Request Rejected",
        `Your leave request has been rejected by Director. ${comments ? "Reason: " + comments : ""}`
      );
    }

    await leaveRequest.save();

    res.json({
      message: `Leave request ${action === "approve" ? "approved" : "rejected"} successfully`,
      leaveRequest
    });

  } catch (error) {
    console.error("Error in Director approval:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET PENDING REQUESTS FOR HOD
// =============================
exports.getHodPendingRequests = async (req, res) => {
  try {
    const { hodId } = req.params;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get all users in the same department
    const departmentUsers = await User.find({ departmentType: hod.departmentType });
    const departmentUserIds = departmentUsers.map(u => u._id);

    const leaveRequests = await LeaveRequest.find({
      status: "pending_hod",
      employeeId: { $in: departmentUserIds }
    })
      .populate("employeeId", "name email role departmentType")
      .populate("leaveTypeId", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);

  } catch (error) {
    console.error("Error fetching HOD pending requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET ALL LEAVE REQUESTS FOR HOD'S DEPARTMENT
// =============================
exports.getHodDepartmentLeaveRequests = async (req, res) => {
  try {
    const { hodId } = req.params;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get all users in the same department
    const departmentUsers = await User.find({ departmentType: hod.departmentType });
    const departmentUserIds = departmentUsers.map(u => u._id);

    // Get all leave requests from department (all statuses)
    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: departmentUserIds }
    })
      .populate("employeeId", "name email role departmentType")
      .populate("leaveTypeId", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .populate("hodApproval.approvedBy", "name")
      .populate("directorApproval.approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);

  } catch (error) {
    console.error("Error fetching HOD department leave requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET PENDING REQUESTS FOR DIRECTOR
// =============================
exports.getDirectorPendingRequests = async (req, res) => {
  try {
    const { directorId } = req.params;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequests = await LeaveRequest.find({
      status: "pending_director"
    })
      .populate({
        path: "employeeId",
        select: "name email role",
        populate: {
          path: "departmentType",
          select: "departmentName"
        }
      })
      .populate("leaveTypeId", "name")
      .populate("hodApproval.approvedBy", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);

  } catch (error) {
    console.error("Error fetching Director pending requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  HOD UPDATE PERIOD ADJUSTMENTS FOR FACULTY LEAVE REQUEST
// =============================
exports.hodUpdatePeriodAdjustments = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { periodAdjustments, hodId } = req.body;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized. Only HOD can update period adjustments" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email role departmentType");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Verify HOD is from the same department
    if (leaveRequest.employeeId.departmentType.toString() !== hod.departmentType.toString()) {
      return res.status(403).json({ message: "Unauthorized. You can only update period adjustments for your department faculty" });
    }

    // Validate substitute faculty availability
    for (const adjustment of periodAdjustments) {
      if (adjustment.substituteFacultyId) {
        const substituteLeave = await LeaveRequest.findOne({
          employeeId: adjustment.substituteFacultyId,
          status: "approved",
          startDate: { $lte: moment(adjustment.date).toDate() },
          endDate: { $gte: moment(adjustment.date).toDate() }
        });

        if (substituteLeave) {
          const substitute = await User.findById(adjustment.substituteFacultyId);
          return res.status(400).json({
            message: `Substitute faculty ${substitute?.name || "Selected"} is on leave on ${moment(adjustment.date).format("MMM D, YYYY")}. Please select another substitute.`
          });
        }
      }
    }

    // Update period adjustments
    leaveRequest.periodAdjustments = periodAdjustments.map(adj => ({
      ...adj,
      date: moment(adj.date).toDate(),
      status: adj.substituteFacultyId ? "adjusted" : "pending"
    }));

    await leaveRequest.save();

    res.json({
      message: "Period adjustments updated successfully",
      leaveRequest
    });

  } catch (error) {
    console.error("Error updating period adjustments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET APPROVED LEAVES FOR DIRECTOR
// =============================
exports.getDirectorApprovedLeaves = async (req, res) => {
  try {
    const { directorId } = req.params;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get all approved leave requests (approved by director)
    const leaveRequests = await LeaveRequest.find({
      status: "approved"
    })
      .populate({
        path: "employeeId",
        select: "name email role",
        populate: {
          path: "departmentType",
          select: "departmentName"
        }
      })
      .populate("leaveTypeId", "name")
      .populate("hodApproval.approvedBy", "name")
      .populate("directorApproval.approvedBy", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);

  } catch (error) {
    console.error("Error fetching Director approved leaves:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET NOTIFICATIONS
// =============================
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .populate("leaveRequestId")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  MARK NOTIFICATION AS READ
// =============================
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET DIRECTOR DASHBOARD STATS (Department-wise Faculty Availability)
// =============================
exports.getDirectorDashboardStats = async (req, res) => {
  try {
    const today = moment().startOf("day");
    const todayEnd = moment().endOf("day");

    // Get all departments
    const departments = await Department.find().sort({ departmentName: 1 });
    
    const departmentStats = [];
    
    for (const dept of departments) {
      // Get all faculty in this department
      const faculty = await User.find({
        departmentType: dept._id,
        role: { $in: ["teaching", "non-teaching", "hod"] }
      }).select("_id name email role");

      // Get faculty on leave today
      const facultyOnLeave = await LeaveRequest.find({
        employeeId: { $in: faculty.map(f => f._id) },
        status: "approved",
        startDate: { $lte: todayEnd.toDate() },
        endDate: { $gte: today.toDate() }
      }).populate("employeeId", "name email role")
        .populate("leaveTypeId", "name");

      const facultyOnLeaveIds = new Set(facultyOnLeave.map(leave => leave.employeeId._id.toString()));
      
      const availableFaculty = faculty.filter(f => !facultyOnLeaveIds.has(f._id.toString()));
      const onLeaveFaculty = faculty.filter(f => facultyOnLeaveIds.has(f._id.toString()));

      // Get detailed leave information
      const leaveDetails = facultyOnLeave.map(leave => ({
        facultyId: leave.employeeId._id,
        facultyName: leave.employeeId.name,
        facultyEmail: leave.employeeId.email,
        facultyRole: leave.employeeId.role,
        leaveType: leave.leaveTypeId?.name || "N/A",
        startDate: leave.startDate,
        endDate: leave.endDate,
        description: leave.description
      }));

      departmentStats.push({
        departmentId: dept._id,
        departmentName: dept.departmentName,
        totalFaculty: faculty.length,
        availableFaculty: availableFaculty.length,
        facultyOnLeave: onLeaveFaculty.length,
        availableFacultyList: availableFaculty.map(f => ({
          facultyId: f._id,
          name: f.name,
          email: f.email,
          role: f.role
        })),
        leaveDetails: leaveDetails
      });
    }

    // Get overall stats
    const totalDepartments = departments.length;
    const totalFaculty = await User.countDocuments({
      role: { $in: ["teaching", "non-teaching", "hod"] }
    });
    
    const allApprovedLeavesToday = await LeaveRequest.countDocuments({
      status: "approved",
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() }
    });

    const pendingLeaves = await LeaveRequest.countDocuments({
      status: "pending_director"
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      status: "approved"
    });

    res.json({
      totalDepartments,
      totalFaculty,
      pendingLeaves,
      approvedLeaves,
      facultyOnLeaveToday: allApprovedLeavesToday,
      departmentStats
    });

  } catch (error) {
    console.error("Error fetching director dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
//  GET HOD DASHBOARD STATS (Faculty Absence Details for Current Date)
// =============================
exports.getHodDashboardStats = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const today = moment().startOf("day");
    const todayEnd = moment().endOf("day");

    // Get HOD's department
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Get all faculty in this department
    const faculty = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching"] }
    }).select("_id name email role");

    // Get faculty on leave today
    const facultyOnLeave = await LeaveRequest.find({
      employeeId: { $in: faculty.map(f => f._id) },
      status: "approved",
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() }
    }).populate("employeeId", "name email role")
      .populate("leaveTypeId", "name");

    const facultyOnLeaveIds = new Set(facultyOnLeave.map(leave => leave.employeeId._id.toString()));
    
    const availableFaculty = faculty.filter(f => !facultyOnLeaveIds.has(f._id.toString()));
    const onLeaveFaculty = faculty.filter(f => facultyOnLeaveIds.has(f._id.toString()));

    // Get detailed absence information
    const absenceDetails = facultyOnLeave.map(leave => ({
      facultyId: leave.employeeId._id,
      facultyName: leave.employeeId.name,
      facultyEmail: leave.employeeId.email,
      facultyRole: leave.employeeId.role,
      leaveType: leave.leaveTypeId?.name || "N/A",
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      description: leave.description,
      periodAdjustments: leave.periodAdjustments || []
    }));

    // Get pending and approved leave counts
    const pendingLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: "pending_hod"
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: { $in: ["approved", "pending_director"] }
    });

    const rejectedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: { $in: ["rejected_by_hod", "rejected_by_director"] }
    });

    res.json({
      departmentId: department._id,
      departmentName: department.departmentName,
      totalFaculty: faculty.length,
      availableFaculty: availableFaculty.length,
      facultyOnLeave: onLeaveFaculty.length,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      absenceDetails,
      availableFacultyList: availableFaculty.map(f => ({
        facultyId: f._id,
        name: f.name,
        email: f.email,
        role: f.role
      }))
    });

  } catch (error) {
    console.error("Error fetching HOD dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// GET LEAVE ANALYTICS FOR DEPARTMENT (CURRENT YEAR)
// =============================
exports.getDepartmentLeaveAnalytics = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    // 1) Get ALL faculty in this department (teaching, non‑teaching, HOD)
    const facultyList = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching", "hod"] }
    }).select("name email");

    // 2) Get all approved leave requests for this department in current year
    const leaveRequests = await LeaveRequest.find({
      status: "approved",
      startDate: { $gte: startOfYear, $lte: endOfYear }
    }).populate({
      path: "employeeId",
      match: { departmentType: departmentId, role: { $in: ["teaching", "non-teaching", "hod"] } },
      select: "name email"
    });

    // Filter out null employeeId (those not in department)
    const validRequests = leaveRequests.filter(req => req.employeeId);

    // 3) Prepare map with ALL faculty, defaulting to 0 leave usage
    const facultyLeaveMap = {};

    facultyList.forEach(fac => {
      const id = fac._id.toString();
      facultyLeaveMap[id] = {
        name: fac.name,
        email: fac.email,
        totalDays: 0,
        leaveCount: 0
      };
    });

    // 4) Add leave stats for those who actually took leave
    validRequests.forEach(request => {
      const facultyId = request.employeeId._id.toString();
      if (!facultyLeaveMap[facultyId]) {
        facultyLeaveMap[facultyId] = {
          name: request.employeeId.name,
          email: request.employeeId.email,
          totalDays: 0,
          leaveCount: 0
        };
      }
      facultyLeaveMap[facultyId].totalDays += request.totalDays;
      facultyLeaveMap[facultyId].leaveCount += 1;
    });

    const analytics = Object.values(facultyLeaveMap);

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching department leave analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

