const moment = require("moment");
const LeaveType = require("../Models/LeaveType");
const User = require("../Models/User");
const EmployeeLeave = require("../Models/EmployeeLeave");
const LeaveRequest = require("../Models/LeaveRequest");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");

async function createNotification(userId, leaveRequestId, type, title, message) {
  return await Notification.create({ userId, leaveRequestId, type, title, message });
}

// Helper function to get periods for date range
const getPeriodsForDateRange = async (employeeId, startDate, endDate) => {
  const periods = [];
  const currentDate = moment(startDate);
  const end = moment(endDate);

  const user = await User.findById(employeeId).populate("departmentType");
  if (!user || !user.departmentType) return periods;

  const timetables = await Timetable.find({ departmentType: user.departmentType.id })
    .populate("timetable.faculty", "name email")
    .populate("timetable.subject", "subjectName subjectCode");

  while (currentDate.isSameOrBefore(end)) {
    const dayName = currentDate.format("dddd");
    const dateStr = currentDate.format("YYYY-MM-DD");

    for (const timetable of timetables) {
      const dayPeriods = timetable.timetable.filter(
        (entry) =>
          entry.day === dayName &&
          entry.faculty &&
          entry.faculty.id.toString() === employeeId.toString()
      );

      for (const period of dayPeriods) {
        periods.push({
          date: dateStr,
          day: dayName,
          period: period.period,
          className: timetable.className,
          departmentId: user.departmentType.id,
          subjectId: period.subject?.id || period.subject,
          subjectName: period.subject?.subjectName || "NA",
          facultyId: period.faculty?.id
        });
      }
    }

    currentDate.add(1, "day");
  }

  return periods;
};

// 1. ADD Leave Type
exports.addLeaveType = async (req, res) => {
  try {
    const {
      name,
      allowedLeaves,
      roles,
      isForwarding,
      isHalfDayAllowed,
      leaveEffect,
      startDate,
      endDate
    } = req.body;

    const policyStart = moment(startDate).startOf("day");
    const policyEnd = moment(endDate).endOf("day");

    const totalPeriodDays = policyEnd.diff(policyStart, "days") + 1;
    if (totalPeriodDays <= 0)
      return res.status(400).json({ message: "Invalid Date Range" });

    const leaveType = await LeaveType.create({
      name,
      allowedLeaves,
      roles,
      isForwarding,
      isHalfDayAllowed,
      leaveEffect,
      startDate,
      endDate
    });

    const users = await User.find({ role: { $in: roles } });

    const allocations = users
      .map((user) => {
        const joiningDate = moment(user.joiningDate).startOf("day");
        const userActiveStart = moment.max(policyStart, joiningDate);

        if (userActiveStart.isAfter(policyEnd)) return null;

        const activeDays = policyEnd.diff(userActiveStart, "days") + 1;
        const prorated = (allowedLeaves / totalPeriodDays) * activeDays;
        const finalLeaves = Math.round(prorated * 2) / 2;

        return {
          employeeId: user._id,
          leaveTypeId: leaveType._id,
          totalLeaves: leaveEffect === "ADD" ? 0 : finalLeaves,
          usedLeaves: 0,
          carryForwardLeaves: 0,
          creditedLeaves: leaveEffect === "ADD" ? finalLeaves : 0
        };
      })
      .filter(Boolean);

    if (allocations.length > 0) {
      await EmployeeLeave.insertMany(allocations);
    }

    res.status(201).json({
      message: "Leave policy created with effect applied"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. UPDATE Leave Type
exports.updateLeaveType = async (req, res) => {
  try {
    const id = req.params.id;

    const updated = await LeaveType.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated)
      return res.status(404).json({ message: "Leave type not found" });

    res.json({ message: "Leave type updated", updated });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. DELETE Leave Type
exports.deleteLeaveType = async (req, res) => {
  try {
    const id = req.params.id;
    await LeaveType.findByIdAndDelete(id);
    await EmployeeLeave.deleteMany({ leaveTypeId: id });

    res.json({ message: "Leave type deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. LIST Leave Types
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const list = await LeaveType.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 5. SEARCH Leave Types
exports.searchLeaveType = async (req, res) => {
  try {
    const results = await LeaveType.find({
      name: { $regex: req.query.q, $options: "i" }
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// APPLY LEAVE REQUEST
exports.applyLeaveRequest = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, description, periodAdjustments } =
      req.body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !description)
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });

    const start = moment(startDate);
    const end = moment(endDate);
    if (end.isBefore(start))
      return res
        .status(400)
        .json({ message: "End date must be after start date" });

    const totalDays = end.diff(start, "days") + 1;

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType)
      return res.status(404).json({ message: "Leave type not found" });

    const employeeLeave = await EmployeeLeave.findOne({ employeeId, leaveTypeId });
    if (!employeeLeave)
      return res
        .status(400)
        .json({ message: "Leave type not allocated to this employee" });

    // For DEDUCT type, check leave balance
    if (leaveType.leaveEffect === "DEDUCT") {
      const totalAvailable =
        (employeeLeave.totalLeaves || 0) + (employeeLeave.carryForwardLeaves || 0);
      const remaining = totalAvailable - (employeeLeave.usedLeaves || 0);

      if (totalDays > remaining) {
        return res.status(400).json({
          message: `Insufficient leave balance. Available: ${remaining}, Requested: ${totalDays}`
        });
      }
    }

    // For ADD type, optionally block overspending
    if (leaveType.leaveEffect === "ADD") {
      const remaining =
        (employeeLeave.creditedLeaves || 0) - (employeeLeave.usedLeaves || 0);
      if (remaining < totalDays) {
        return res.status(400).json({
          message: `Insufficient credited leaves. Available: ${remaining}, Requested: ${totalDays}`
        });
      }
    }

    const user = await User.findById(employeeId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const status = user.role === "hod" ? "pending_director" : "pending_hod";

    let periods = [];
    if (
      (user.role === "teaching" || user.role === "hod") &&
      (!periodAdjustments || periodAdjustments.length === 0)
    ) {
      periods = await getPeriodsForDateRange(employeeId, startDate, endDate);
    } else if (periodAdjustments && periodAdjustments.length > 0) {
      periods = periodAdjustments;
    }

    // substitute validation
    for (const period of periods) {
      if (period.substituteFacultyId) {
        const substituteLeave = await LeaveRequest.findOne({
          employeeId: period.substituteFacultyId,
          status: "approved",
          startDate: { $lte: moment(period.date).toDate() },
          endDate: { $gte: moment(period.date).toDate() }
        });

        if (substituteLeave) {
          const substitute = await User.findById(period.substituteFacultyId);
          return res.status(400).json({
            message: `Substitute faculty ${substitute?.name} is on leave on ${moment(
              period.date
            ).format("MMM D, YYYY")}.`
          });
        }
      }
    }

    const formattedPeriodAdjustments = periods.map((period) => {
      let status = "pending";
      if (period.substituteFacultyId) status = "adjusted";
      else if (description.toLowerCase().includes("emergency")) status = "not_required";

      return {
        ...period,
        date: moment(period.date).toDate(),
        departmentId: period.departmentId,
        subjectId: period.subjectId,
        substituteFacultyId: period.substituteFacultyId || null,
        status
      };
    });

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

    if (user.role === "hod") {
      const directors = await User.find({ role: "director" });
      for (const director of directors) {
        await createNotification(
          director.id,
          leaveRequest.id,
          "leave_requested",
          "New Leave Request",
          `${user.name} has applied for ${totalDays} days leave`
        );
      }
    } else {
      const hod = await User.findOne({
        role: "hod",
        departmentType: user.departmentType
      });

      if (hod) {
        await createNotification(
          hod.id,
          leaveRequest.id,
          "leave_requested",
          "New Leave Request",
          `${user.name} has applied for ${totalDays} days leave`
        );
      }
    }

    await createNotification(
      employeeId,
      leaveRequest.id,
      "leave_requested",
      "Leave Request Submitted",
      `Your leave request for ${totalDays} days has been submitted successfully`
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

// 6. FACULTY LEAVE SUMMARY
exports.getFacultyLeaveSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leaves = await EmployeeLeave.find({ employeeId }).populate("leaveTypeId");

    const formatted = leaves
      .map((l) => {
        if (!l.leaveTypeId) return null;

        const effect = l.leaveTypeId.leaveEffect;

        const totalAvailable =
          effect === "ADD"
            ? (l.creditedLeaves || 0)
            : (l.totalLeaves || 0) + (l.carryForwardLeaves || 0);

        const remaining =
          effect === "ADD"
            ? Math.max((l.creditedLeaves || 0) - (l.usedLeaves || 0), 0)
            : Math.max(totalAvailable - (l.usedLeaves || 0), 0);

        return {
          leaveTypeId: l.leaveTypeId._id,
          leaveTypeName: l.leaveTypeId.name,
          leaveEffect: effect,
          allowedLeaves: l.totalLeaves || 0,
          carryForwardLeaves: l.carryForwardLeaves || 0,
          usedLeaves: l.usedLeaves || 0,
          totalAvailable,
          remainingLeaves: remaining,
          isHalfDayAllowed: l.leaveTypeId.isHalfDayAllowed
        };
      })
      .filter(Boolean);

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// HOD APPROVE / REJECT
exports.hodApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, hodId } = req.body;

    if (!["approve", "reject"].includes(action))
      return res.status(400).json({ message: "Invalid action" });

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate(
      "employeeId",
      "name email role departmentType"
    );

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });

    if (leaveRequest.status !== "pending_hod")
      return res.status(400).json({ message: "Leave not pending HOD approval" });

    const hod = await User.findById(hodId);
    if (!hod || hod.role !== "hod")
      return res.status(403).json({ message: "Only HOD can approve/reject" });

    const leaveType = await LeaveType.findById(leaveRequest.leaveTypeId);

    if (action === "approve") {
      if (leaveRequest.employeeId.role === "hod") {
        leaveRequest.status = "pending_director";
      } else {
        leaveRequest.status = "approved";
      }

      leaveRequest.hodApproval = {
        approvedBy: hodId,
        approvedAt: new Date(),
        comments
      };

      // HOD final approver only for non-HOD staff
      if (leaveRequest.status === "approved") {
        const empLeave = await EmployeeLeave.findOne({
          employeeId: leaveRequest.employeeId.id,
          leaveTypeId: leaveRequest.leaveTypeId
        });

        if (empLeave && leaveType) {
          if (leaveType.leaveEffect === "DEDUCT") {
            empLeave.usedLeaves =
              (empLeave.usedLeaves || 0) + leaveRequest.totalDays;
          } else if (leaveType.leaveEffect === "ADD") {
            // consume credits, do not credit again
            empLeave.usedLeaves =
              (empLeave.usedLeaves || 0) + leaveRequest.totalDays;
          }
          await empLeave.save();
        }

        if (leaveRequest.periodAdjustments.length > 0) {
          for (const adj of leaveRequest.periodAdjustments) {
            if (!adj.substituteFacultyId) continue;
            const date = moment(adj.date).format("dddd");
            const timetable = await Timetable.findOne({
              departmentType: adj.departmentId,
              className: adj.className
            });

            if (timetable) {
              const idx = timetable.timetable.findIndex(
                (p) => p.day === date && p.period === adj.period
              );
              if (idx !== -1) {
                timetable.timetable[idx].faculty = adj.substituteFacultyId;
                await timetable.save();
              }
            }

            await createNotification(
              adj.substituteFacultyId,
              leaveRequest.id,
              "substitute_assignment",
              "Substitute Allocation",
              `You are assigned to class on ${moment(adj.date).format(
                "DD MMM YYYY"
              )} for period ${adj.period} since ${leaveRequest.employeeId.name} is on leave.`
            );
            adj.notificationStatus = "sent";
          }
          leaveRequest.markModified("periodAdjustments");
          await createNotification(
            leaveRequest.employeeId.id,
            leaveRequest.id,
            "leave_approved",
            "Leave Approved",
            "Your leave request has been approved by HOD."
          );
        } else {
          const directors = await User.find({ role: "director" });
          for (const director of directors) {
            await createNotification(
              director.id,
              leaveRequest.id,
              "leave_requested",
              "New Leave Request Pending Director",
              `Leave request by ${leaveRequest.employeeId.name} requires your approval.`
            );
          }
        }
      } else {
        const directors = await User.find({ role: "director" });
        for (const director of directors) {
          await createNotification(
            director.id,
            leaveRequest.id,
            "leave_requested",
            "New Leave Request Pending Director",
            `Leave request by ${leaveRequest.employeeId.name} requires your approval.`
          );
        }
      }

      await leaveRequest.save();
      return res.json({
        message: "Leave approved successfully",
        leaveRequest
      });
    } else {
      leaveRequest.status = "rejected_by_hod";
      leaveRequest.hodApproval = {
        approvedBy: hodId,
        approvedAt: new Date(),
        comments
      };

      await createNotification(
        leaveRequest.employeeId.id,
        leaveRequest.id,
        "leave_rejected",
        "Leave Rejected",
        `Your leave request has been rejected by HOD. ${
          comments ? "Reason: " + comments : ""
        }`
      );

      await leaveRequest.save();
      return res.json({ message: "Leave rejected", leaveRequest });
    }
  } catch (error) {
    console.error("HOD approval error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DIRECTOR APPROVE / REJECT
exports.directorApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, directorId } = req.body;

    if (!["approve", "reject"].includes(action))
      return res.status(400).json({ message: "Invalid action. Use approve or reject" });

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate(
      "employeeId",
      "name email role"
    );

    if (!leaveRequest)
      return res.status(404).json({ message: "Leave request not found" });

    if (leaveRequest.status !== "pending_director")
      return res
        .status(400)
        .json({ message: "Leave request is not pending director approval" });

    const today = moment().startOf("day");
    const leaveStartDate = moment(leaveRequest.startDate).startOf("day");

    if (action === "approve" && !leaveStartDate.isAfter(today)) {
      return res.status(400).json({
        message: "Director must approve at least 1 day before leave start"
      });
    }

    if (!directorId)
      return res.status(403).json({ message: "Director ID missing" });

    const director = await User.findById(directorId);
    if (!director || director.role !== "director")
      return res.status(403).json({ message: "Unauthorized Director access" });

    const leaveType = await LeaveType.findById(leaveRequest.leaveTypeId);

    if (action === "approve") {
      leaveRequest.status = "approved";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments
      };

      const employeeLeave = await EmployeeLeave.findOne({
        employeeId: leaveRequest.employeeId.id,
        leaveTypeId: leaveRequest.leaveTypeId
      });

      if (employeeLeave && leaveType) {
        if (leaveType.leaveEffect === "DEDUCT") {
          employeeLeave.usedLeaves =
            (employeeLeave.usedLeaves || 0) + leaveRequest.totalDays;
        } else if (leaveType.leaveEffect === "ADD") {
          // consume credits only
          employeeLeave.usedLeaves =
            (employeeLeave.usedLeaves || 0) + leaveRequest.totalDays;
        }
        await employeeLeave.save();
      }

      if (
        leaveRequest.periodAdjustments &&
        leaveRequest.periodAdjustments.length > 0
      ) {
        for (const adjustment of leaveRequest.periodAdjustments) {
          if (
            !adjustment.substituteFacultyId ||
            !adjustment.departmentId ||
            !adjustment.className
          )
            continue;
          try {
            const date = moment(adjustment.date);
            const dayName = date.format("dddd");

            const timetable = await Timetable.findOne({
              departmentType: adjustment.departmentId,
              className: adjustment.className
            });

            if (timetable) {
              const periodIndex = timetable.timetable.findIndex(
                (p) => p.day === dayName && p.period === adjustment.period
              );
              if (periodIndex !== -1) {
                timetable.timetable[periodIndex].faculty =
                  adjustment.substituteFacultyId;
                await timetable.save();
              }
            }
          } catch (err) {
            console.error("Error updating timetable:", err);
          }
        }

        for (const adjustment of leaveRequest.periodAdjustments) {
          if (!adjustment.substituteFacultyId) continue;
          try {
            await createNotification(
              adjustment.substituteFacultyId,
              leaveRequest.id,
              "substitute_assignment",
              "Substitute Class Assigned",
              `You are assigned to take class of ${leaveRequest.employeeId.name} on ${moment(
                adjustment.date
              ).format("DD MMM YYYY")} for Period ${adjustment.period}.`
            );
            adjustment.notificationStatus = "sent";
          } catch (notifyErr) {
            console.error("Error sending notification:", notifyErr);
          }
        }

        leaveRequest.markModified("periodAdjustments");
      }

      await createNotification(
        leaveRequest.employeeId.id,
        leaveRequest.id,
        "leave_approved",
        "Leave Request Approved",
        "Your leave request has been approved by the Director"
      );

      await leaveRequest.save();
      return res.json({
        message: "Leave request approved successfully",
        leaveRequest
      });
    } else {
      leaveRequest.status = "rejected_by_director";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments
      };

      await createNotification(
        leaveRequest.employeeId.id,
        leaveRequest.id,
        "leave_rejected",
        "Leave Request Rejected",
        `Your leave request has been rejected by Director. ${
          comments ? "Reason: " + comments : ""
        }`
      );

      await leaveRequest.save();
      return res.json({
        message: "Leave request rejected successfully",
        leaveRequest
      });
    }
  } catch (error) {
    console.error("Director approval error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDepartmentLeaveBalance = async (req, res) => {
  try {
    const { departmentId, month, year } = req.query;

    if (!departmentId || !month || !year) {
      return res
        .status(400)
        .json({ message: "departmentId, month and year are required" });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const startOfMonth = moment({ year: y, month: m - 1, day: 1 }).startOf("day");
    const endOfMonth = moment(startOfMonth).endOf("month");

    const daysInMonth = endOfMonth.date();

    // 1. Get all faculty in this department
    const facultyList = await User.find({
      departmentType: departmentId,
      role: { $in: ["teaching", "non-teaching", "hod"] }
    }).select("name email role");

    const facultyIds = facultyList.map((f) => f._id);

    // 2. Get their leave allocations
    const allocations = await EmployeeLeave.find({
      employeeId: { $in: facultyIds }
    }).populate("leaveTypeId");

    // 3. Get approved leave requests in selected month
    const leaveRequests = await LeaveRequest.find({
      employeeId: { $in: facultyIds },
      status: "approved",
      startDate: { $lte: endOfMonth.toDate() },
      endDate: { $gte: startOfMonth.toDate() }
    }).populate("employeeId", "name email role");

    const map = {};

    // init from allocations
    for (const alloc of allocations) {
      const id = alloc.employeeId.toString();
      if (!map[id]) {
        const u = facultyList.find((f) => f._id.toString() === id);
        if (!u) continue;
        map[id] = {
          facultyId: id,
          name: u.name,
          email: u.email,
          role: u.role,
          totalAllocated: 0,
          totalUsed: 0,
          totalRemaining: 0,
          usedInMonth: 0
        };
      }

      const effect = alloc.leaveTypeId?.leaveEffect;
      const totalAvailable =
        effect === "ADD"
          ? (alloc.creditedLeaves || 0)
          : (alloc.totalLeaves || 0) + (alloc.carryForwardLeaves || 0);

      const remaining =
        effect === "ADD"
          ? Math.max((alloc.creditedLeaves || 0) - (alloc.usedLeaves || 0), 0)
          : Math.max(totalAvailable - (alloc.usedLeaves || 0), 0);

      map[id].totalAllocated += totalAvailable;
      map[id].totalUsed += alloc.usedLeaves || 0;
      map[id].totalRemaining += remaining;
    }

    // add usedInMonth from requests
    for (const reqDoc of leaveRequests) {
      const id = reqDoc.employeeId._id.toString();
      if (!map[id]) {
        map[id] = {
          facultyId: id,
          name: reqDoc.employeeId.name,
          email: reqDoc.employeeId.email,
          role: reqDoc.employeeId.role,
          totalAllocated: 0,
          totalUsed: 0,
          totalRemaining: 0,
          usedInMonth: 0
        };
      }

      const start = moment(reqDoc.startDate).isBefore(startOfMonth)
        ? startOfMonth.clone()
        : moment(reqDoc.startDate);

      const end = moment(reqDoc.endDate).isAfter(endOfMonth)
        ? endOfMonth.clone()
        : moment(reqDoc.endDate);

      const days = end.diff(start, "days") + 1;
      map[id].usedInMonth += days;
    }

    const facultyLeaveData = Object.values(map);

    return res.json({
      daysInMonth,
      facultyLeaveData
    });
  } catch (err) {
    console.error("Error in getDepartmentLeaveBalance:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
