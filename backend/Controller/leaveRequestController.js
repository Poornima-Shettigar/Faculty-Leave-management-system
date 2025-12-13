const LeaveRequest = require("../Models/LeaveRequest");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const User = require("../Models/User");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");
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

    // Get periods if user is teaching staff
    let periods = [];
    if (user.role === "teaching" && (!periodAdjustments || periodAdjustments.length === 0)) {
      periods = await getPeriodsForDateRange(employeeId, startDate, endDate);
    } else if (periodAdjustments && periodAdjustments.length > 0) {
      periods = periodAdjustments;
    }

    // Convert date strings to Date objects for period adjustments
    const formattedPeriodAdjustments = periods.map(period => ({
      ...period,
      date: moment(period.date).toDate(), // Convert string to Date
      departmentId: period.departmentId,
      subjectId: period.subjectId,
      substituteFacultyId: period.substituteFacultyId || null,
      status: period.substituteFacultyId ? "adjusted" : "pending"
    }));

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
    const substitutes = await User.find({
      departmentType: user.departmentType._id,
      role: "teaching",
      _id: { $ne: employeeId }
    }).select("name email");

    res.json({
      periods,
      availableSubstitutes: substitutes
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
          if (adjustment.substituteFacultyId) {
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

