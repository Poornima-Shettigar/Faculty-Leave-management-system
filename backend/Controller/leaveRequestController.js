const LeaveRequest = require("../Models/LeaveRequest");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const User = require("../Models/User");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");
const moment = require("moment");

// Helper: create notification
// const createNotification = async (userId, leaveRequestId, type, title, message) => {
//   try {
//     const notification = new Notification({
//       userId,
//       leaveRequestId,
//       type,
//       title,
//       message,
//     });
//     await notification.save();
//   } catch (error) {
//     console.error("Error creating notification:", error);
//   }
// };
// Helper: create notification - ✅ WITH DEBUG LOGGING
const createNotification = async (userId, leaveRequestId, type, title, message) => {
  try {
    console.log(`📧 Creating notification:`, {
      userId: userId.toString(),
      type,
      title,
      message: message.substring(0, 100) + "..."
    });

    const notification = new Notification({
      userId,
      leaveRequestId,
      type,
      title,
      message,
      isRead: false, // ✅ Default to unread
    });
    
    const savedNotification = await notification.save();
    console.log(`✅ Notification saved: ${savedNotification._id}`);
    return savedNotification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error; // ✅ Re-throw to catch in caller
  }
};


// Helper: get periods for date range - ✅ FIXED with semester
const getPeriodsForDateRange = async (employeeId, startDate, endDate) => {
  const periods = [];
  const currentDate = moment(startDate);
  const end = moment(endDate);

  const user = await User.findById(employeeId).populate("departmentType");
  if (!user || !user.departmentType) return periods;

  const timetables = await Timetable.find({ departmentType: user.departmentType._id })
    .populate("timetable.faculty", "name email")
    .populate("timetable.subject", "subjectName subjectCode");

  while (currentDate.isSameOrBefore(end)) {
    const dayName = currentDate.format("dddd");
    const dateStr = currentDate.format("YYYY-MM-DD");

    for (const timetable of timetables) {
      const dayPeriods = timetable.timetable.filter(
        entry =>
          entry.day === dayName &&
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
          semester: timetable.semester, // ✅ FIXED: Added semester
          subjectId: period.subject?._id || period.subject,
          subjectName: period.subject?.subjectName || "N/A",
          facultyId: period.faculty?._id,
        });
      }
    }

    currentDate.add(1, "day");
  }

  return periods;
};

// =============================
// APPLY LEAVE REQUEST
// =============================
exports.applyLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, description, periodAdjustments } =
      req.body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !description) {
      return res.status(400).json({ message: "All required fields are mandatory" });
    }

    const start = moment(startDate);
    const end = moment(endDate);
    if (end.isBefore(start)) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const totalDays = end.diff(start, "days") + 1;

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) return res.status(404).json({ message: "Leave type not found" });

    const empLeave = await EmployeeLeave.findOne({ employeeId, leaveTypeId });
    if (!empLeave) {
      return res.status(400).json({ message: "Leave type not allocated" });
    }

    if (leaveType.leaveAction === "DEDUCT") {
      const available =
        (empLeave.totalLeaves || 0) +
        (empLeave.carryForwardLeaves || 0) -
        (empLeave.usedLeaves || 0);

      if (totalDays > available) {
        return res.status(400).json({ message: "Insufficient leave balance" });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      description,
      periodAdjustments: periodAdjustments || [],
      status: "pending_hod",
    });

    const user = await User.findById(employeeId);

    const hod = await User.findOne({
      role: "hod",
      departmentType: user.departmentType,
    });

    if (hod) {
      await createNotification(
        hod._id,
        leaveRequest._id,
        "leave_requested",
        "New Leave Request",
        `${user.name} applied for leave`
      );
    }

    await createNotification(
      employeeId,
      leaveRequest._id,
      "leave_requested",
      "Leave Submitted",
      "Your leave request is sent to HOD"
    );

    res.status(201).json({ message: "Leave applied successfully", leaveRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =============================
// HOD APPROVE / REJECT (ONLY FORWARD TO DIRECTOR)
// =============================
exports.hodApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, hodId } = req.body;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate("employeeId");
    if (!leaveRequest || leaveRequest.status !== "pending_hod") {
      return res.status(400).json({ message: "Leave not pending HOD approval" });
    }

    if (action === "approve") {
      leaveRequest.status = "pending_director";
      leaveRequest.hodApproval = {
        approvedBy: hodId,
        approvedAt: new Date(),
        comments: comments || "",
      };

      const directors = await User.find({ role: "director" });
      for (const director of directors) {
        await createNotification(
          director._id,
          leaveRequest._id,
          "leave_requested",
          "Leave Pending Approval",
          `Leave request from ${leaveRequest.employeeId.name}`
        );
      }

      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_approved",
        "HOD Approved",
        "Your leave is approved by HOD and sent to Director"
      );

      await leaveRequest.save();
      return res.json({ message: "Leave forwarded to Director", leaveRequest });
    }

    // REJECT
    leaveRequest.status = "rejected_by_hod";
    leaveRequest.hodApproval = {
      approvedBy: hodId,
      approvedAt: new Date(),
      comments: comments || "",
    };

    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected",
      "HOD rejected your leave request"
    );

    await leaveRequest.save();
    res.json({ message: "Leave rejected by HOD", leaveRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =============================
// DIRECTOR APPROVE / REJECT (FINAL) - ✅ FULLY FIXED
// =============================
// =============================
// DIRECTOR APPROVE / REJECT (FINAL) - ✅ DEBUGGED & FIXED
// =============================
exports.directorApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, directorId } = req.body;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate("employeeId");
    if (!leaveRequest || leaveRequest.status !== "pending_director") {
      return res.status(400).json({ message: "Leave not pending director approval" });
    }

    const empLeave = await EmployeeLeave.findOne({
      employeeId: leaveRequest.employeeId._id,
      leaveTypeId: leaveRequest.leaveTypeId,
    });

    if (action === "approve") {
      leaveRequest.status = "approved";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments: comments || "",
      };

      if (empLeave) {
        empLeave.usedLeaves += leaveRequest.totalDays;
        await empLeave.save();
      }

      // ✅ FIXED: NOTIFICATIONS FIRST (timetable optional)
      console.log("🔍 Processing periodAdjustments:", leaveRequest.periodAdjustments);
      let substituteNotificationsSent = 0;

      for (let i = 0; i < (leaveRequest.periodAdjustments || []).length; i++) {
        const adj = leaveRequest.periodAdjustments[i];
        
        let substituteFacultyId = adj.substituteFacultyId;
        if (substituteFacultyId && typeof substituteFacultyId === 'object') {
          substituteFacultyId = substituteFacultyId._id;
        }

        console.log(`🔍 Adjustment ${i}:`, {
          substituteId: substituteFacultyId,
          className: adj.className,
          semester: adj.semester || 'MISSING!',  // ✅ DEBUG semester
          hasSubstitute: !!substituteFacultyId
        });

        if (!substituteFacultyId) continue;

        try {
          // ✅ SEND NOTIFICATION FIRST (priority)
          const substituteUser = await User.findById(substituteFacultyId);
          if (substituteUser) {
            await createNotification(
              substituteFacultyId,
              leaveRequest._id,
              "substitute_assignment",
              "Substitute Assignment Confirmed ✅",
              `You are assigned ${adj.className} on ${moment(adj.date).format("DD MMM YYYY")}, Period ${adj.period}. 
               ${leaveRequest.employeeId.name} on approved leave. Please check timetable.`
            );
            adj.notificationStatus = "sent";
            substituteNotificationsSent++;
            console.log(`✅ NOTIFICATION SENT to ${substituteUser.name}`);
          }

          // ✅ OPTIONAL: Try timetable update (non-blocking)
          try {
            if (adj.semester) {  // Only if semester exists
              const day = moment(adj.date).format("dddd");
              const timetable = await Timetable.findOne({
                departmentType: adj.departmentId,
                className: adj.className,
                semester: adj.semester,
              });
              
              if (timetable) {
                const idx = timetable.timetable.findIndex(
                  p => p.day === day && p.period === adj.period
                );
                if (idx !== -1) {
                  timetable.timetable[idx].faculty = substituteFacultyId;
                  await timetable.save();
                  console.log(`✅ Timetable UPDATED`);
                }
              }
            } else {
              console.log(`⚠️ Skipping timetable: missing semester`);
            }
          } catch (timetableErr) {
            console.error(`⚠️ Timetable failed (ignored):`, timetableErr.message);
          }

        } catch (notifError) {
          console.error(`❌ Notification failed:`, notifError);
        }
      }

      leaveRequest.markModified("periodAdjustments");

      // Employee notification
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_approved",
        "Leave Approved ✅",
        `Director approved your leave (${leaveRequest.totalDays} days). ${substituteNotificationsSent} substitutes notified.`
      );

      await leaveRequest.save();
      
      return res.json({ 
        success: true,
        message: `✅ Leave approved! ${substituteNotificationsSent} substitutes notified`,
        notificationsSent: substituteNotificationsSent,
        leaveRequest
      });
    }

    // REJECT logic...
    leaveRequest.status = "rejected_by_director";
    leaveRequest.directorApproval = {
      approvedBy: directorId,
      approvedAt: new Date(),
      comments: comments || "",
    };
    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected",
      "Director rejected your leave request"
    );
    await leaveRequest.save();
    res.json({ message: "Leave rejected by Director", leaveRequest });
  } catch (err) {
    console.error("❌ Director approval error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




// =============================
// GET USER'S LEAVE REQUESTS
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
// GET PERIODS FOR DATE RANGE
// =============================
exports.getPeriodsForDateRange = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.params;

    const periods = await getPeriodsForDateRange(employeeId, startDate, endDate);

    const user = await User.findById(employeeId).populate("departmentType");
    const allSubstitutes = await User.find({
      departmentType: user.departmentType._id,
      role: { $in: ["teaching", "hod"] },
      _id: { $ne: employeeId },
    }).select("name email");

    const availableSubstitutes = [];
    const start = moment(startDate);
    const end = moment(endDate);

    for (const substitute of allSubstitutes) {
      const conflictingLeaves = await LeaveRequest.find({
        employeeId: substitute._id,
        status: "approved",
        startDate: { $lte: end.toDate() },
        endDate: { $gte: start.toDate() },
      });

      if (conflictingLeaves.length === 0) {
        availableSubstitutes.push(substitute);
      }
    }

    res.json({ periods, availableSubstitutes });
  } catch (error) {
    console.error("Error fetching periods:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// GET HOD PENDING REQUESTS
// =============================
exports.getHodPendingRequests = async (req, res) => {
  try {
    const { hodId } = req.params;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const departmentUsers = await User.find({ departmentType: hod.departmentType });
    const departmentUserIds = departmentUsers.map(u => u._id);

    const leaveRequests = await LeaveRequest.find({
      status: "pending_hod",
      employeeId: { $in: departmentUserIds },
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
// GET HOD DEPARTMENT REQUESTS
// =============================
exports.getHodDepartmentLeaveRequests = async (req, res) => {
  try {
    const { hodId } = req.params;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const departmentUsers = await User.find({ departmentType: hod.departmentType });
    const departmentUserIds = departmentUsers.map(u => u._id);

    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: departmentUserIds },
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
// GET DIRECTOR PENDING REQUESTS
// =============================
exports.getDirectorPendingRequests = async (req, res) => {
  try {
    const { directorId } = req.params;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequests = await LeaveRequest.find({ status: "pending_director" })
      .populate({
        path: "employeeId",
        select: "name email role",
        populate: { path: "departmentType", select: "departmentName" },
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
// HOD UPDATE PERIOD ADJUSTMENTS
// =============================
exports.hodUpdatePeriodAdjustments = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { periodAdjustments, hodId } = req.body;

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod") {
      return res
        .status(403)
        .json({ message: "Unauthorized. Only HOD can update period adjustments" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate(
      "employeeId",
      "name email role departmentType"
    );
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.employeeId.departmentType.toString() !== hod.departmentType.toString()) {
      return res.status(403).json({
        message:
          "Unauthorized. You can only update period adjustments for your department faculty",
      });
    }

    // Validate substitutes availability
    for (const adjustment of periodAdjustments) {
      if (adjustment.substituteFacultyId) {
        const substituteLeave = await LeaveRequest.findOne({
          employeeId: adjustment.substituteFacultyId,
          status: "approved",
          startDate: { $lte: moment(adjustment.date).toDate() },
          endDate: { $gte: moment(adjustment.date).toDate() },
        });
        if (substituteLeave) {
          const substitute = await User.findById(adjustment.substituteFacultyId);
          return res.status(400).json({
            message: `Substitute faculty ${
              substitute?.name || "Selected"
            } is on leave on ${moment(adjustment.date).format(
              "MMM D, YYYY"
            )}. Please select another substitute.`,
          });
        }
      }
    }

    leaveRequest.periodAdjustments = periodAdjustments.map(adj => ({
      ...adj,
      date: moment(adj.date).toDate(),
      status: adj.substituteFacultyId ? "adjusted" : "pending",
      notificationStatus: adj.substituteFacultyId ? "pending" : "not_required", // ✅ Added
    }));

    await leaveRequest.save();

    res.json({ message: "Period adjustments updated successfully", leaveRequest });
  } catch (error) {
    console.error("Error updating period adjustments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// GET DIRECTOR APPROVED LEAVES
// =============================
exports.getDirectorApprovedLeaves = async (req, res) => {
  try {
    const { directorId } = req.params;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequests = await LeaveRequest.find({ status: "approved" })
      .populate({
        path: "employeeId",
        select: "name email role",
        populate: { path: "departmentType", select: "departmentName" },
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
// GET NOTIFICATIONS
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
// MARK NOTIFICATION AS READ
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
// DIRECTOR DASHBOARD STATS
// =============================
exports.getDirectorDashboardStats = async (req, res) => {
  try {
    const today = moment().startOf("day");
    const todayEnd = moment().endOf("day");

    const departments = await Department.find().sort({ departmentName: 1 });
    const departmentStats = [];

    for (const dept of departments) {
      const faculty = await User.find({
        departmentType: dept._id,
        role: { $in: ["teaching", "non-teaching", "hod"] },
      }).select("_id name email role");

      const facultyOnLeave = await LeaveRequest.find({
        employeeId: { $in: faculty.map(f => f._id) },
        status: "approved",
        startDate: { $lte: todayEnd.toDate() },
        endDate: { $gte: today.toDate() },
      })
        .populate("employeeId", "name email role")
        .populate("leaveTypeId", "name");

      const leaveIds = new Set(facultyOnLeave.map(l => l.employeeId._id.toString()));
      const availableFaculty = faculty.filter(f => !leaveIds.has(f._id.toString()));
      const onLeaveFaculty = faculty.filter(f => leaveIds.has(f._id.toString()));

      const leaveDetails = facultyOnLeave.map(leave => ({
        facultyId: leave.employeeId._id,
        facultyName: leave.employeeId.name,
        facultyEmail: leave.employeeId.email,
        facultyRole: leave.employeeId.role,
        leaveType: leave.leaveTypeId?.name || "N/A",
        startDate: leave.startDate,
        endDate: leave.endDate,
        description: leave.description,
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
          role: f.role,
        })),
        leaveDetails,
      });
    }

    const totalDepartments = departments.length;
    const totalFaculty = await User.countDocuments({
      role: { $in: ["teaching", "non-teaching", "hod"] },
    });

    const allApprovedLeavesToday = await LeaveRequest.countDocuments({
      status: "approved",
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    });

    const pendingLeaves = await LeaveRequest.countDocuments({
      status: "pending_director",
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      status: "approved",
    });

    res.json({
      totalDepartments,
      totalFaculty,
      pendingLeaves,
      approvedLeaves,
      facultyOnLeaveToday: allApprovedLeavesToday,
      departmentStats,
    });
  } catch (error) {
    console.error("Error fetching director dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// HOD DASHBOARD STATS
// =============================
exports.getHodDashboardStats = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const today = moment().startOf("day");
    const todayEnd = moment().endOf("day");

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const faculty = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching"] },
    }).select("_id name email role");

    const facultyOnLeave = await LeaveRequest.find({
      employeeId: { $in: faculty.map(f => f._id) },
      status: "approved",
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    })
      .populate("employeeId", "name email role")
      .populate("leaveTypeId", "name");

    const leaveIds = new Set(facultyOnLeave.map(l => l.employeeId._id.toString()));
    const availableFaculty = faculty.filter(f => !leaveIds.has(f._id.toString()));
    const onLeaveFaculty = faculty.filter(f => leaveIds.has(f._id.toString()));

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
      periodAdjustments: leave.periodAdjustments || [],
    }));

    const pendingLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: "pending_hod",
    });

    const approvedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: { $in: ["approved", "pending_director"] },
    });

    const rejectedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: faculty.map(f => f._id) },
      status: { $in: ["rejected_by_hod", "rejected_by_director"] },
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
        role: f.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching HOD dashboard stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// DEPARTMENT LEAVE ANALYTICS
// =============================
exports.getDepartmentLeaveAnalytics = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const facultyList = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching", "hod"] },
    }).select("name email");

    const leaveRequests = await LeaveRequest.find({
      status: "approved",
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }).populate({
      path: "employeeId",
      match: {
        departmentType: departmentId,
        role: { $in: ["teaching", "non-teaching", "hod"] },
      },
      select: "name email",
    });

    const validRequests = leaveRequests.filter(r => r.employeeId);

    const facultyLeaveMap = {};
    facultyList.forEach(fac => {
      const id = fac._id.toString();
      facultyLeaveMap[id] = {
        name: fac.name,
        email: fac.email,
        totalDays: 0,
        leaveCount: 0,
      };
    });

    validRequests.forEach(request => {
      const id = request.employeeId._id.toString();
      if (!facultyLeaveMap[id]) {
        facultyLeaveMap[id] = {
          name: request.employeeId.name,
          email: request.employeeId.email,
          totalDays: 0,
          leaveCount: 0,
        };
      }
      facultyLeaveMap[id].totalDays += request.totalDays;
      facultyLeaveMap[id].leaveCount += 1;
    });

    const analytics = Object.values(facultyLeaveMap);
    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching department leave analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// DIRECTOR ALL REQUESTS
// =============================
exports.getDirectorAllRequests = async (req, res) => {
  try {
    const { directorId } = req.params;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequests = await LeaveRequest.find({
      $or: [
        { status: "pending_director" },
        { status: "approved" },
        { status: "rejected_by_director" },
      ],
    })
      .populate({
        path: "employeeId",
        select: "name email role",
        populate: { path: "departmentType", select: "departmentName" },
      })
      .populate("leaveTypeId", "name")
      .populate("hodApproval.approvedBy", "name")
      .populate("directorApproval.approvedBy", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching Director all requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// =============================
// GET SUBSTITUTION DETAILS FOR A FACULTY
// =============================
exports.getSubstitutionDetailsForFaculty = async (req, res) => {
  try {
    const { leaveRequestId, facultyId } = req.params;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email")
      .populate("periodAdjustments.substituteFacultyId", "name email");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Filter only those adjustments where this faculty is substitute
    const myAdjustments = (leaveRequest.periodAdjustments || []).filter(adj => {
      const subId =
        typeof adj.substituteFacultyId === "object"
          ? adj.substituteFacultyId?._id?.toString()
          : adj.substituteFacultyId?.toString();
      return subId === facultyId.toString();
    });

    return res.json({
      leaveRequestId: leaveRequest._id,
      originalFaculty: {
        _id: leaveRequest.employeeId._id,
        name: leaveRequest.employeeId.name,
        email: leaveRequest.employeeId.email,
      },
      totalDays: leaveRequest.totalDays,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      description: leaveRequest.description,
      substitutions: myAdjustments.map(adj => ({
        date: adj.date,
        day: adj.day,
        period: adj.period,
        className: adj.className,
        semester: adj.semester || null,
        status: adj.status || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching substitution details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// GET ALL SUBSTITUTIONS FOR A FACULTY (ACROSS LEAVES)
// =============================
exports.getMySubstitutions = async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Find leave requests where this faculty appears as a substitute
    const leaveRequests = await LeaveRequest.find({
      "periodAdjustments.substituteFacultyId": facultyId,
      status: "approved", // only approved leaves
    })
      .populate("employeeId", "name email") // original faculty
      .sort({ startDate: 1 });

    const result = [];

    for (const lr of leaveRequests) {
      (lr.periodAdjustments || []).forEach(adj => {
        if (adj.substituteFacultyId?.toString() === facultyId.toString()) {
          result.push({
            leaveRequestId: lr._id,
            originalFaculty: {
              _id: lr.employeeId._id,
              name: lr.employeeId.name,
              email: lr.employeeId.email,
            },
            date: adj.date,
            day: adj.day,
            period: adj.period,
            className: adj.className,
            semester: adj.semester || null,
            description: lr.description,
          });
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching my substitutions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
