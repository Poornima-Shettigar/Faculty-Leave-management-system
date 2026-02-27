const LeaveRequest = require("../Models/LeaveRequest");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const User = require("../Models/User");
const Notification = require("../Models/Notification");
const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");
const moment = require("moment");
const { sendMail } = require("../utils/mailer");

// =============================
// HELPER: CREATE NOTIFICATION
// =============================
// HELPER: CREATE NOTIFICATION + EMAIL
const createNotification = async (userId, leaveRequestId, type, title, message, meta = {}) => {
  try {
    // 1. Save notification in DB
    const notification = new Notification({
      userId,
      leaveRequestId,
      type,
      title,
      message,
      isRead: false,
    });
    const savedNotification = await notification.save();

    // 2. Fetch user email
    const user = await User.findById(userId).select("name email");
    if (!user || !user.email) return savedNotification;

    // 3. Build detailed email
    let subject = title || "Leave Management System Update";
    let htmlBody = `
      <div style="font-family: sans-serif; color: #333;">
        <h3>Hello, ${user.name}</h3>
        <p>${message}</p>
    `;

    // Add Leave Details Section if meta data is provided
    if (meta.leaveDetails) {
      htmlBody += `
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin-top:0;">Leave Details:</h4>
          <p><b>Type:</b> ${meta.leaveDetails.type}</p>
          <p><b>Date:</b> ${meta.leaveDetails.dates}</p>
          <p><b>Reason:</b> ${meta.leaveDetails.reason}</p>
        </div>
      `;
    }

    // Add Substitution Table if available (for Leave Taker)
    if (meta.substitutions && meta.substitutions.length > 0) {
      htmlBody += `<h4>Your Period Adjustments:</h4>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <tr style="background: #eee;">
            <th>Date</th><th>Period</th><th>Class</th><th>Substitute</th>
          </tr>
          ${meta.substitutions.map(s => `
            <tr>
              <td>${moment(s.date).format("DD MMM YYYY")}</td>
              <td>${s.period}</td>
              <td>${s.className}</td>
              <td>${s.subName}</td>
            </tr>`).join('')}
        </table>`;
    }

    // Specific formatting for Substitute Assignment
    if (type === "substitute_assignment" && meta.subInfo) {
      subject = `Action Required: Substitute Assignment for ${meta.subInfo.leaveTaker}`;

      const periodsHtml = meta.subInfo.periods ? meta.subInfo.periods.map(p => `
        <div style="background: #eef9ff; padding: 10px; border-left: 5px solid #007bff; margin-bottom: 10px;">
          <p style="margin:2px 0;"><b>Date:</b> ${p.date}</p>
          <p style="margin:2px 0;"><b>Period:</b> ${p.period}</p>
          <p style="margin:2px 0;"><b>Class:</b> ${p.className}</p>
        </div>
      `).join('') : `
        <div style="background: #eef9ff; padding: 10px; border-left: 5px solid #007bff; margin-bottom: 10px;">
          <p style="margin:2px 0;"><b>Date:</b> ${meta.subInfo.date}</p>
          <p style="margin:2px 0;"><b>Period:</b> ${meta.subInfo.period}</p>
          <p style="margin:2px 0;"><b>Class:</b> ${meta.subInfo.className}</p>
        </div>
      `;

      htmlBody = `
        <div style="font-family: sans-serif; color: #333;">
          <h3 style="color: #007bff;">Substitute Duty Assigned</h3>
          <p>You have been assigned as a substitute for <b>${meta.subInfo.leaveTaker}</b>.</p>
          <p>The following periods require your attention:</p>
          ${periodsHtml}
          <div style="margin-top: 20px; padding: 15px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;">
            <p style="margin:0; color: #856404;"><b>Action Needed:</b> Please log in to the Leave Management System to <b>Approve</b> or <b>Reject</b> these assignments.</p>
          </div>
          <p style="margin-top: 15px;">Your acceptance is required before the leave request can proceed to HOD approval.</p>
        </div>
      `;
    }

    htmlBody += `<p style="margin-top:20px;">Regards,<br/><b>Leave Management System</b></p></div>`;

    await sendMail(user.email, subject, htmlBody);
    return savedNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};


// =============================
// HELPER: GET PERIODS FOR DATE RANGE
// =============================
const getPeriodsForDateRange = async (employeeId, startDate, endDate) => {
  const periods = [];
  const currentDate = moment(startDate);
  const end = moment(endDate);

  const user = await User.findById(employeeId).populate("departmentType");
  if (!user || !user.departmentType) return periods;

  const timetables = await Timetable.find({
    departmentType: user.departmentType._id,
  })
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
          entry.faculty._id.toString() === employeeId.toString()
      );

      for (const period of dayPeriods) {
        periods.push({
          date: dateStr,
          day: dayName,
          period: period.period,
          className: timetable.className,
          departmentId: user.departmentType._id,
          semester: timetable.semester,
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
// exports.applyLeaveRequest = async (req, res) => {
//   try {
//     const {
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       description,
//       periodAdjustments,
//     } = req.body;

//     if (!employeeId || !leaveTypeId || !startDate || !endDate || !description) {
//       return res.status(400).json({ message: "All required fields are mandatory" });
//     }

//     const start = moment(startDate);
//     const end = moment(endDate);
//     if (end.isBefore(start)) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     const totalDays = end.diff(start, "days") + 1;

//     const leaveType = await LeaveType.findById(leaveTypeId);
//     if (!leaveType) return res.status(404).json({ message: "Leave type not found" });

//     const empLeave = await EmployeeLeave.findOne({ employeeId, leaveTypeId });
//     if (!empLeave) {
//       return res.status(400).json({ message: "Leave type not allocated" });
//     }

//     if (leaveType.leaveAction === "DEDUCT") {
//       const available =
//         (empLeave.totalLeaves || 0) +
//         (empLeave.carryForwardLeaves || 0) -
//         (empLeave.usedLeaves || 0);

//       if (totalDays > available) {
//         return res.status(400).json({ message: "Insufficient leave balance" });
//       }
//     }

//     const leaveRequest = await LeaveRequest.create({
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       totalDays,
//       description,
//       periodAdjustments: periodAdjustments || [],
//       status: "pending_hod",
//     });

//     const user = await User.findById(employeeId);

//     const hod = await User.findOne({
//       role: "hod",
//       departmentType: user.departmentType,
//     });

//     if (hod) {
//       await createNotification(
//         hod._id,
//         leaveRequest._id,
//         "leave_requested",
//         "New Leave Request",
//         `${user.name} applied for leave`
//       );
//     }

//     await createNotification(
//       employeeId,
//       leaveRequest._id,
//       "leave_requested",
//       "Leave Submitted",
//       "Your leave request is sent to HOD"
//     );

//     res.status(201).json({ message: "Leave applied successfully", leaveRequest });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
// APPLY LEAVE REQUEST
// APPLY LEAVE REQUEST
// exports.applyLeaveRequest = async (req, res) => {
//   try {
//     const {
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       description,
//       periodAdjustments,
//       isHalfDay,       // boolean from frontend
//       halfDaySession,  // "morning" | "afternoon" (optional)
//     } = req.body;

//     if (!employeeId || !leaveTypeId || !startDate || !endDate || !description) {
//       return res
//         .status(400)
//         .json({ message: "All required fields are mandatory" });
//     }

//     const start = moment(startDate);
//     const end = moment(endDate);

//     if (end.isBefore(start)) {
//       return res.status(400).json({ message: "Invalid date range" });
//     }

//     // Total days with half‑day support
//     let totalDays;
//     if (isHalfDay) {
//       totalDays = 0.5;
//     } else {
//       totalDays = end.diff(start, "days") + 1;
//     }

//     const leaveType = await LeaveType.findById(leaveTypeId);
//     if (!leaveType) {
//       return res.status(404).json({ message: "Leave type not found" });
//     }

//     const empLeave = await EmployeeLeave.findOne({ employeeId, leaveTypeId });
//     if (!empLeave) {
//       return res
//         .status(400)
//         .json({ message: "Leave type not allocated" });
//     }

//     // Balance check (DEDUCT only) – works with 0.5 also
//     if (leaveType.leaveAction === "DEDUCT") {
//       const available =
//         (empLeave.totalLeaves || 0) +
//         (empLeave.carryForwardLeaves || 0) -
//         (empLeave.usedLeaves || 0);

//       if (totalDays > available) {
//         return res
//           .status(400)
//           .json({ message: "Insufficient leave balance" });
//       }
//     }

//     // Get user to know role & department
//     const user = await User.findById(employeeId).populate("departmentType");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const isHod = user.role === "hod";
//     // HOD self‑request -> directly to Director, others -> HOD
//     const initialStatus = isHod ? "pending_director" : "pending_hod";

//     const leaveRequest = await LeaveRequest.create({
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       totalDays,
//       description,
//       periodAdjustments: periodAdjustments || [],
//       status: initialStatus,
//       isHalfDay: !!isHalfDay,
//       halfDaySession: isHalfDay ? halfDaySession || null : null,
//     });

//     if (isHod) {
//       // HOD applying own leave: notify all Directors
//       const directors = await User.find({ role: "director" });

//       for (const director of directors) {
//         await createNotification(
//           director.id,
//           leaveRequest.id,
//           "leave_requested",
//           "Leave Pending Approval",
//           `${user.name} (HOD) applied for leave and it is pending your approval.`
//         );
//       }

//       await createNotification(
//         employeeId,
//         leaveRequest.id,
//         "leave_requested",
//         "Leave Submitted",
//         "Your leave request is sent to Director."
//       );
//     } else {
//       // Normal faculty: send to HOD
//       const hod = await User.findOne({
//         role: "hod",
//         departmentType: user.departmentType,
//       });

//       if (hod) {
//         await createNotification(
//           hod.id,
//           leaveRequest.id,
//           "leave_requested",
//           "New Leave Request",
//           `${user.name} applied for leave`
//         );
//       }

//       await createNotification(
//         employeeId,
//         leaveRequest.id,
//         "leave_requested",
//         "Leave Submitted",
//         "Your leave request is sent to HOD"
//       );
//     }

//     return res
//       .status(201)
//       .json({ message: "Leave applied successfully", leaveRequest });
//   } catch (err) {
//     console.error(err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };
// exports.applyLeaveRequest = async (req, res) => {
//   try {
//     const {
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       description,
//       periodAdjustments,
//       isHalfDay,
//       halfDaySession,
//     } = req.body;

//     // ... (Keep existing validation and balance check logic) ...

//     const user = await User.findById(employeeId).populate("departmentType");
//     const leaveType = await LeaveType.findById(leaveTypeId);
//     const dateRangeStr = `${moment(startDate).format("DD MMM YYYY")} to ${moment(endDate).format("DD MMM YYYY")}`;

//     const leaveRequest = await LeaveRequest.create({
//       employeeId,
//       leaveTypeId,
//       startDate,
//       endDate,
//       totalDays,
//       description,
//       periodAdjustments: periodAdjustments || [],
//       status: isHod ? "pending_director" : "pending_hod",
//       isHalfDay: !!isHalfDay,
//       halfDaySession: isHalfDay ? halfDaySession || null : null,
//     });

//     // --- PREPARE METADATA FOR EMAIL ---
//     const subMeta = await Promise.all((periodAdjustments || []).map(async (adj) => {
//       const sub = await User.findById(adj.substituteFacultyId).select("name");
//       return {
//         date: adj.date,
//         period: adj.period,
//         className: adj.className,
//         subName: sub?.name || "Not Assigned"
//       };
//     }));

//     const emailMeta = {
//       leaveDetails: {
//         employeeName: user.name,
//         type: leaveType.name,
//         dates: dateRangeStr + (isHalfDay ? ` (${halfDaySession})` : ""),
//         reason: description,
//         totalDays
//       },
//       substitutions: subMeta
//     };

//     if (isHod) {
//       const directors = await User.find({ role: "director" });
//       for (const director of directors) {
//         await createNotification(director.id, leaveRequest.id, "leave_requested", "HOD Leave Request", `${user.name} applied for leave`, emailMeta);
//       }
//     } else {
//       const hod = await User.findOne({ role: "hod", departmentType: user.departmentType });
//       if (hod) {
//         await createNotification(hod.id, leaveRequest.id, "leave_requested", "New Leave Application", `${user.name} has applied for leave`, emailMeta);
//       }
//     }

//     // Notify Applicant
//     await createNotification(employeeId, leaveRequest.id, "leave_requested", "Application Submitted", "Your leave request has been submitted successfully.", emailMeta);

//     return res.status(201).json({ message: "Leave applied successfully", leaveRequest });
//   } catch (err) {
//     /* ... error handling ... */
//   }
// };


exports.applyLeaveRequest = async (req, res) => {
  console.log(">>> applyLeaveRequest HIT", new Date().toISOString());

  try {
    const {
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      description,
      periodAdjustments,
      isHalfDay,
      halfDaySession,
      totalDays,          // coming from frontend
    } = req.body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !description) {
      return res.status(400).json({ message: "All required fields are mandatory" });
    }

    const start = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');
    const now = moment();

    if (end.isBefore(start)) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    // --- RULE: Leave application allowed only before start date OR on start date before 10:00 AM ---
    if (now.isAfter(start, 'day') || (now.isSame(start, 'day') && now.hour() >= 10)) {
      return res.status(400).json({ message: "Leave application is only allowed before 10:00 AM on the leave start date." });
    }

    // Basic leave type + balance validation
    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    const user = await User.findById(employeeId).populate("departmentType");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- RULE: Prevent multiple pending/overlapping requests ---
    const pendingStatuses = [
      "Pending Substitute Approval",
      "Substitute Approved",
      "Pending HOD Approval",
      "Approved by HOD",
      "Pending Director Approval",
      "pending_substitute",
      "pending_hod",
      "pending_director"
    ];
    const approvedStatuses = ["Approved by Director", "approved"];

    const existingRequests = await LeaveRequest.find({
      employeeId,
      status: { $in: [...pendingStatuses, ...approvedStatuses] },
      startDate: { $lte: end.toDate() },
      endDate: { $gte: start.toDate() }
    }).populate('leaveTypeId');

    const isEmergency = leaveType.name.toLowerCase().includes("emergency") || description.toLowerCase().includes("emergency");

    for (const reqObj of existingRequests) {
      const isOOD = reqObj.leaveTypeId?.name.toLowerCase().includes("ood");

      if (pendingStatuses.includes(reqObj.status)) {
        return res.status(400).json({
          message: "You already have a pending leave request for overlapping dates. Please wait for it to be approved or rejected before re-applying."
        });
      }

      if (approvedStatuses.includes(reqObj.status)) {
        // Exception: Emergency leave can overlap with approved OOD
        if (isEmergency && isOOD) {
          continue;
        } else {
          return res.status(400).json({
            message: "You already have an approved leave request for overlapping dates."
          });
        }
      }
    }

    const isHod = user.role?.toLowerCase() === "hod";
    const dateRangeStr = `${moment(startDate).format("DD MMM YYYY")} to ${moment(endDate).format("DD MMM YYYY")}`;
    const isTeachingRole = ["teaching", "hod"].includes(user.role?.toLowerCase());

    const hasMissingSubstitutes = (periodAdjustments || []).some(adj => !adj.substituteFacultyId);

    // Determine initial status:
    // Teaching staff MUST go through substitution if periods exist,
    // EXCEPT for Emergency Leave which always goes to HOD/Director immediately.
    let initialStatus;
    if (isTeachingRole && periodAdjustments && periodAdjustments.length > 0 && !isEmergency) {
      if (hasMissingSubstitutes) {
        return res.status(400).json({ message: "Substitution is mandatory for non-emergency leave. Please select substitutes for all periods." });
      }
      initialStatus = "Pending Substitute Approval";
    } else {
      initialStatus = isHod ? "Pending Director Approval" : "Pending HOD Approval";
    }

    // --- RULE: Validate substitute availability ---
    if (periodAdjustments && periodAdjustments.length > 0 && !isEmergency) {
      for (const adj of periodAdjustments) {
        if (!adj.substituteFacultyId) continue;

        const subId = adj.substituteFacultyId;
        const subDate = new Date(adj.date);
        const subPeriod = adj.period;
        const subDay = adj.day;

        // 1. Check if they have an APPROVED leave
        const onLeave = await LeaveRequest.findOne({
          employeeId: subId,
          status: { $in: ["Approved by Director", "Approved by HOD", "approved"] },
          startDate: { $lte: subDate },
          endDate: { $gte: subDate },
        });
        if (onLeave) {
          const subUser = await User.findById(subId);
          return res.status(400).json({
            message: `Selected substitute ${subUser.name} has an approved leave on ${moment(subDate).format("DD-MM-YYYY")}. Please choose another substitute.`
          });
        }

        // 2. Check if they are originally allocated for another class (Global check for conflicts)
        const hasOwnClass = await Timetable.findOne({
          timetable: {
            $elemMatch: {
              faculty: subId,
              day: subDay,
              period: subPeriod
            }
          }
        });
        if (hasOwnClass) {
          const subUser = await User.findById(subId);
          return res.status(400).json({
            message: `Selected substitute ${subUser.name} is originally allocated for another class on ${moment(subDate).format("DD-MM-YYYY")} during Period ${subPeriod}. Please choose another substitute.`
          });
        }

        // 3. Check if already APPROVED as a substitute for another class
        const isAlreadySubstituting = await LeaveRequest.findOne({
          status: {
            $in: [
              "Substitute Approved",
              "Pending HOD Approval",
              "Approved by HOD",
              "Pending Director Approval",
              "Approved by Director",
              "approved"
            ]
          },
          periodAdjustments: {
            $elemMatch: {
              substituteFacultyId: subId,
              date: subDate,
              period: subPeriod,
              "substituteApproval.status": "approved"
            }
          }
        });
        if (isAlreadySubstituting) {
          const subUser = await User.findById(subId);
          return res.status(400).json({
            message: `Selected substitute ${subUser.name} is already approved as a substitute for another class on ${moment(subDate).format("DD-MM-YYYY")} during Period ${subPeriod}. Please choose another substitute.`
          });
        }
      }
    }

    // Create leave first
    console.log("applyLeaveRequest: saving to DB...");

    const sanitizedAdjustments = (periodAdjustments || []).map(adj => ({
      ...adj,
      substituteFacultyId: (adj.substituteFacultyId && adj.substituteFacultyId !== "") ? adj.substituteFacultyId : null,
      substituteApproval: {
        status: "pending",
        approvedAt: null,
        comments: ""
      }
    }));

    const leaveRequest = await LeaveRequest.create({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      totalDays, // already excludes Sundays from frontend
      description,
      periodAdjustments: sanitizedAdjustments,
      status: initialStatus,  // Use determined status
      isHalfDay: !!isHalfDay,
      halfDaySession: isHalfDay ? halfDaySession || null : null,
    });

    console.log(`applyLeaveRequest: SAVED SUCCESS ID: ${leaveRequest._id}, STATUS: ${initialStatus}, isEmergency: ${isEmergency}`);

    // Send fast response to frontend
    res
      .status(201)
      .json({ message: "Leave applied successfully", leaveRequest });

    // --------- ASYNC NOTIFICATIONS (fire-and-forget) ---------
    // Do NOT await this block for the response
    (async () => {
      try {
        const subMeta = await Promise.all(
          (periodAdjustments || []).map(async (adj) => {
            if (!adj.substituteFacultyId) {
              return {
                date: adj.date,
                period: adj.period,
                className: adj.className,
                subName: "Not Assigned",
              };
            }
            const sub = await User.findById(adj.substituteFacultyId).select(
              "name"
            );
            return {
              date: adj.date,
              period: adj.period,
              className: adj.className,
              subName: sub?.name || "Not Assigned",
            };
          })
        );

        const emailMeta = {
          leaveDetails: {
            employeeName: user.name,
            type: leaveType.name,
            dates:
              dateRangeStr + (isHalfDay ? ` (${halfDaySession})` : ""),
            reason: description,
            totalDays,
          },
          substitutions: subMeta,
        };

        // 1. Notify Substitutes (if any)
        const hasSubstitutes = (periodAdjustments || []).some(adj => adj.substituteFacultyId);
        if (hasSubstitutes) {
          const substituteIds = new Set();
          (periodAdjustments || []).forEach(adj => {
            if (adj.substituteFacultyId) substituteIds.add(adj.substituteFacultyId.toString());
          });

          for (const subId of substituteIds) {
            const subDetails = (periodAdjustments || []).filter(
              adj => adj.substituteFacultyId?.toString() === subId
            );
            const periodsText = subDetails.map(d =>
              `${moment(d.date).format("DD MMM YYYY")} - Period ${d.period} (${d.className})`
            ).join(", ");

            await createNotification(
              subId,
              leaveRequest._id,
              "substitute_assignment",
              "Substitute Assignment - Approval Required" + (isEmergency ? " (Emergency)" : ""),
              `You have been assigned as substitute for ${user.name}. Please approve soon.\n\nPeriods: ${periodsText}`,
              {
                subInfo: {
                  leaveTaker: user.name,
                  periods: subDetails.map(d => ({ date: moment(d.date).format("DD MMM YYYY"), period: d.period, className: d.className }))
                }
              }
            );
          }
        }

        // 2. Notify Approval Chain (HOD/Director)
        if (initialStatus !== "Pending Substitute Approval") {
          if (isHod) {
            const directors = await User.find({ role: "director" });
            for (const director of directors) {
              await createNotification(
                director.id,
                leaveRequest.id,
                "leave_requested",
                "HOD Leave Request" + (isEmergency ? " (Emergency)" : ""),
                `${user.name} applied for leave`,
                emailMeta
              );
            }
          } else {
            const deptId = user.departmentType._id || user.departmentType;
            console.log(`applyLeaveRequest: Looking for HOD of DeptID: ${deptId}`);

            const hod = await User.findOne({
              role: "hod",
              departmentType: deptId
            });

            if (hod) {
              console.log(`applyLeaveRequest: Notifying HOD ${hod.name} for request from ${user.name}`);
              await createNotification(
                hod.id,
                leaveRequest.id,
                "leave_requested",
                "New Leave Application" + (isEmergency ? " (Emergency)" : ""),
                `${user.name} has applied for leave`,
                emailMeta
              );
            } else {
              console.warn(`applyLeaveRequest: No HOD found for department ${deptId}`);
            }
          }
        }

        // 3. Notify Employee (Confirmation)
        let empMsg = "Your leave request has been submitted.";
        if (initialStatus === "Pending Substitute Approval") {
          empMsg += ` It is awaiting acceptance from substitutes.`;
        } else {
          empMsg += ` It has been sent to ${isHod ? 'Director' : 'HOD'} for approval.`;
        }
        await createNotification(employeeId, leaveRequest.id, "leave_requested", "Application Submitted", empMsg, emailMeta);
      } catch (notifyErr) {
        console.error("applyLeaveRequest async notification error:", notifyErr);
      }
    })();
    // ---------------------------------------------------------
  } catch (err) {
    console.error("applyLeaveRequest ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// =============================
// SUBSTITUTE APPROVE PERIOD
// =============================
exports.substituteApprovePeriod = async (req, res) => {
  try {
    const { leaveRequestId, periodId } = req.params;
    const { substituteId, comments } = req.body;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email")
      .populate("leaveTypeId", "name");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Find the specific period adjustment
    const periodIndex = leaveRequest.periodAdjustments.findIndex(
      p => p._id.toString() === periodId
    );

    console.log("substituteApprovePeriod: checking period", {
      leaveRequestId,
      periodId,
      foundIndex: periodIndex,
      substituteIdFromBody: substituteId
    });

    if (periodIndex === -1) {
      console.log("substituteApprovePeriod: period not found in array");
      return res.status(404).json({ message: "Period not found" });
    }

    const period = leaveRequest.periodAdjustments[periodIndex];
    console.log("substituteApprovePeriod: assigned sub in DB", period.substituteFacultyId?.toString());

    // --- RULE: Substitute response time window ---
    const leaveDate = moment(period.date).startOf('day');
    const now = moment();
    const isBeforeLeaveDay = now.isBefore(leaveDate, 'day');
    const isOnLeaveDayBefore10AM = now.isSame(leaveDate, 'day') && now.hour() < 10;

    if (!isBeforeLeaveDay && !isOnLeaveDayBefore10AM) {
      return res.status(400).json({
        message: "Substitution response time has expired. You can respond only before the leave day or before 10:00 AM on the leave day."
      });
    }

    // Verify the substitute
    if (period.substituteFacultyId.toString() !== substituteId) {
      console.log("substituteApprovePeriod: ID MISMATCH", { db: period.substituteFacultyId.toString(), body: substituteId });
      return res.status(403).json({ message: "Unauthorized: Not the assigned substitute" });
    }

    // Check if already approved/rejected
    if (period.substituteApproval && period.substituteApproval.status !== "pending") {
      return res.status(400).json({
        message: `This period has already been ${period.substituteApproval.status}`
      });
    }

    // Update the period approval
    leaveRequest.periodAdjustments[periodIndex].substituteApproval = {
      status: "approved",
      approvedAt: new Date(),
      comments: comments || ""
    };

    // Check if ALL substitutes have approved
    // Stricter check: Every period MUST have a substitute AND be approved
    const allApproved = leaveRequest.periodAdjustments.length === 0 ||
      leaveRequest.periodAdjustments.every(
        p => p.substituteFacultyId && p.substituteApproval?.status === "approved"
      );

    let userApplicant = null;
    let isHod = false;

    if (allApproved) {
      // All substitutes approved - forward to HOD or Director
      userApplicant = await User.findById(leaveRequest.employeeId._id);
      isHod = userApplicant.role?.toLowerCase() === "hod";

      leaveRequest.status = isHod ? "Pending Director Approval" : "Pending HOD Approval";
    }

    await leaveRequest.save();

    if (allApproved) {
      // Notify HOD or Director
      if (isHod) {
        const directors = await User.find({ role: "director" });
        for (const director of directors) {
          await createNotification(
            director._id,
            leaveRequest._id,
            "leave_requested",
            "HOD Leave Request - All Substitutes Confirmed",
            `${userApplicant.name} (HOD) applied for leave. All substitutes have accepted. Your approval is required.`
          );
        }
      } else {
        const hod = await User.findOne({
          role: "hod",
          departmentType: userApplicant.departmentType
        });
        if (hod) {
          await createNotification(
            hod._id,
            leaveRequest._id,
            "leave_requested",
            "Leave Pending HOD Approval - All Substitutes Confirmed",
            `${userApplicant.name} applied for leave. All substitute faculty members have accepted. The request is now awaiting your approval.`
          );
        }
      }

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "substitute_approved",
        "All Substitutes Approved",
        `All ${leaveRequest.periodAdjustments.length} substitute assignment(s) have been accepted. Your leave request has been forwarded to the ${isHod ? 'Director' : 'HOD'} for approval.`
      );
    } else {
      // Notify employee about partial approval
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "substitute_approved",
        "Substitute Approved Period",
        `${period.className} - Period ${period.period} on ${moment(period.date).format("DD MMM YYYY")} has been accepted. Waiting for remaining substitute(s) to respond.`
      );
    }

    res.json({
      message: "Period approved successfully",
      allApproved,
      newStatus: leaveRequest.status
    });

  } catch (err) {
    console.error("Error approving substitute:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =============================
// SUBSTITUTE REJECT PERIOD
// =============================
exports.substituteRejectPeriod = async (req, res) => {
  try {
    const { leaveRequestId, periodId } = req.params;
    const { substituteId, comments } = req.body;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Find the specific period adjustment
    const periodIndex = leaveRequest.periodAdjustments.findIndex(
      p => p._id.toString() === periodId
    );

    if (periodIndex === -1) {
      return res.status(404).json({ message: "Period not found" });
    }

    const period = leaveRequest.periodAdjustments[periodIndex];

    // --- RULE: Substitute response time window ---
    const leaveDate = moment(period.date).startOf('day');
    const now = moment();
    const isBeforeLeaveDay = now.isBefore(leaveDate, 'day');
    const isOnLeaveDayBefore10AM = now.isSame(leaveDate, 'day') && now.hour() < 10;

    if (!isBeforeLeaveDay && !isOnLeaveDayBefore10AM) {
      return res.status(400).json({
        message: "Substitution response time has expired. You can respond only before the leave day or before 10:00 AM on the leave day."
      });
    }

    // Verify the substitute
    if (period.substituteFacultyId.toString() !== substituteId) {
      return res.status(403).json({ message: "Unauthorized: Not the assigned substitute" });
    }

    // Check if already approved/rejected
    if (period.substituteApproval && period.substituteApproval.status !== "pending") {
      return res.status(400).json({
        message: `This period has already been ${period.substituteApproval.status}`
      });
    }

    // Update the period approval
    leaveRequest.periodAdjustments[periodIndex].substituteApproval = {
      status: "rejected",
      approvedAt: new Date(),
      comments: comments || "No reason provided"
    };

    // For Emergency Leave, do not reject the whole request if a substitute declines.
    // Instead, transfer responsibility to HOD to arrange a substitute.
    const leaveType = await LeaveType.findById(leaveRequest.leaveTypeId);
    const isEmergency = leaveType?.name?.toLowerCase().includes("emergency");

    if (isEmergency) {
      const userApplicant = await User.findById(leaveRequest.employeeId._id);
      const isHod = userApplicant?.role?.toLowerCase() === "hod";
      leaveRequest.status = isHod ? "Pending Director Approval" : "Pending HOD Approval";

      // Notify HOD about the rejection and transfer of responsibility
      if (!isHod) {
        const hod = await User.findOne({
          role: "hod",
          departmentType: userApplicant.departmentType
        });
        if (hod) {
          await createNotification(
            hod._id,
            leaveRequest._id,
            "leave_requested",
            "Emergency Leave - Substitute Declined - Your Action Required",
            `A substitute declined an emergency leave request from ${userApplicant.name}. Responsibility for arranging the substitute is now yours.`
          );
        }
      }
    } else {
      leaveRequest.status = "Substitute Rejected";
    }

    await leaveRequest.save();

    // Notify employee
    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected by Substitute ❌",
      `Your leave request was rejected by a substitute.\n\n${period.className} - Period ${period.period} on ${moment(period.date).format("DD MMM YYYY")}\n\nReason: ${comments || "No reason provided"}`
    );

    res.json({
      message: "Period rejected - Leave request rejected",
      leaveRequest
    });

  } catch (err) {
    console.error("Error rejecting substitute:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// =============================
// HOD APPROVE / REJECT
// =============================
// exports.hodApproveReject = async (req, res) => {
//   try {
//     const { leaveRequestId } = req.params;
//     const { action, comments, hodId } = req.body;

//     const hod = await User.findById(hodId);
//     if (!hod || hod.role !== "hod") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate(
//       "employeeId"
//     );
//     if (!leaveRequest || leaveRequest.status !== "pending_hod") {
//       return res.status(400).json({ message: "Leave not pending HOD approval" });
//     }

//     if (action === "approve") {
//       leaveRequest.status = "pending_director";
//       leaveRequest.hodApproval = {
//         approvedBy: hodId,
//         approvedAt: new Date(),
//         comments: comments || "",
//       };

//       const directors = await User.find({ role: "director" });
//       for (const director of directors) {
//         await createNotification(
//           director._id,
//           leaveRequest._id,
//           "leave_requested",
//           "Leave Pending Approval",
//           `Leave request from ${leaveRequest.employeeId.name}`
//         );
//       }

//       await createNotification(
//         leaveRequest.employeeId._id,
//         leaveRequest._id,
//         "leave_approved",
//         "HOD Approved",
//         "Your leave is approved by HOD and sent to Director"
//       );

//       await leaveRequest.save();
//       return res.json({ message: "Leave forwarded to Director", leaveRequest });
//     }

//     // REJECT
//     leaveRequest.status = "rejected_by_hod";
//     leaveRequest.hodApproval = {
//       approvedBy: hodId,
//       approvedAt: new Date(),
//       comments: comments || "",
//     };

//     await createNotification(
//       leaveRequest.employeeId._id,
//       leaveRequest._id,
//       "leave_rejected",
//       "Leave Rejected",
//       "HOD rejected your leave request"
//     );

//     await leaveRequest.save();
//     res.json({ message: "Leave rejected by HOD", leaveRequest });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// // };
exports.hodApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, hodId } = req.body;

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate("employeeId");
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Security Guard: Only allow HOD approval-eligible statuses
    const hodApprovableStatuses = ["Pending HOD Approval", "Pending Substitute Approval", "Substitute Approved"];
    if (!hodApprovableStatuses.includes(leaveRequest.status)) {
      return res.status(400).json({
        message: "This leave request is not in a state ready for HOD approval."
      });
    }

    // Date check: HOD can approve on the leave date or before
    const leaveStartDate = moment(leaveRequest.startDate).startOf('day');
    const now = moment();
    if (now.isAfter(leaveStartDate, 'day')) {
      return res.status(400).json({
        message: "HOD can only approve leave on or before the leave start date."
      });
    }


    const leaveType = await LeaveType.findById(leaveRequest.leaveTypeId);
    const dateRangeStr = `${moment(leaveRequest.startDate).format("DD MMM YYYY")} to ${moment(leaveRequest.endDate).format("DD MMM YYYY")}`;

    // Prepare Substitution list (fetching names from IDs)
    const subMeta = await Promise.all((leaveRequest.periodAdjustments || []).map(async (adj) => {
      const sub = await User.findById(adj.substituteFacultyId).select("name");
      return {
        date: adj.date,
        period: adj.period,
        className: adj.className,
        subName: sub?.name || "N/A"
      };
    }));

    const emailMeta = {
      leaveDetails: {
        employeeName: leaveRequest.employeeId.name,
        type: leaveType.name,
        dates: dateRangeStr,
        reason: leaveRequest.description,
        totalDays: leaveRequest.totalDays
      },
      substitutions: subMeta
    };

    if (action === "approve") {
      leaveRequest.status = "Pending Director Approval";
      leaveRequest.hodApproval = { approvedBy: hodId, approvedAt: new Date(), comments: comments || "" };

      // Notify Directors with full details
      const directors = await User.find({ role: "director" });
      for (const director of directors) {
        await createNotification(director._id, leaveRequest._id, "leave_requested", "Director Approval Required", `HOD has approved the leave request for ${leaveRequest.employeeId.name}. Your final approval is required.`, emailMeta);
      }

      // Notify Employee
      await createNotification(leaveRequest.employeeId._id, leaveRequest._id, "leave_approved", "HOD Approved ✅", `Your leave has been approved by the HOD and forwarded to the Director for final approval. Comments: ${comments || "None"}`, emailMeta);

      await leaveRequest.save();
      return res.json({ message: "Leave forwarded to Director", leaveRequest });
    }

    // --- REJECTION LOGIC ---
    leaveRequest.status = "Rejected by HOD";
    leaveRequest.hodApproval = { approvedBy: hodId, approvedAt: new Date(), comments: comments || "" };

    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected by HOD ❌",
      `Your leave request was rejected. Reason: ${comments || "No comments provided."}`,
      { leaveDetails: emailMeta.leaveDetails } // Send only leave details, no subs needed for rejection
    );

    await leaveRequest.save();
    res.json({ message: "Leave rejected by HOD", leaveRequest });
  } catch (err) {
    console.error("HOD approve/reject error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// =============================
// DIRECTOR APPROVE / REJECT (FINAL)
// =============================
// exports.directorApproveReject = async (req, res) => {
//   try {
//     const { leaveRequestId } = req.params;
//     const { action, comments, directorId } = req.body;

//     const director = await User.findById(directorId);
//     if (!director || director.role !== "director") {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate(
//       "employeeId"
//     );
//     if (!leaveRequest || leaveRequest.status !== "pending_director") {
//       return res.status(400).json({ message: "Leave not pending director approval" });
//     }

//     if (action === "approve") {
//       leaveRequest.status = "approved";
//       leaveRequest.directorApproval = {
//         approvedBy: directorId,
//         approvedAt: new Date(),
//         comments: comments || "",
//       };

//       // ✅ SAFE FINAL LEAVE DEDUCTION
//       let empLeave = await EmployeeLeave.findOne({
//         employeeId: leaveRequest.employeeId._id,
//         leaveTypeId: leaveRequest.leaveTypeId,
//       });

//       if (!empLeave) {
//         console.warn("⚠️ EmployeeLeave not found. Creating record for deduction.", {
//           employeeId: leaveRequest.employeeId._id.toString(),
//           leaveTypeId: leaveRequest.leaveTypeId.toString(),
//         });

//         empLeave = new EmployeeLeave({
//           employeeId: leaveRequest.employeeId._id,
//           leaveTypeId: leaveRequest.leaveTypeId,
//           totalLeaves: 0,
//           carryForwardLeaves: 0,
//           usedLeaves: 0,
//         });
//       }

//       empLeave.totalLeaves = empLeave.totalLeaves || 0;
//       empLeave.carryForwardLeaves = empLeave.carryForwardLeaves || 0;
//       empLeave.usedLeaves = empLeave.usedLeaves || 0;

//       const beforeUsed = empLeave.usedLeaves;
//       empLeave.usedLeaves += leaveRequest.totalDays;

//       console.log("✅ Leave deduction:", {
//         employeeId: empLeave.employeeId.toString(),
//         leaveTypeId: empLeave.leaveTypeId.toString(),
//         beforeUsed,
//         added: leaveRequest.totalDays,
//         afterUsed: empLeave.usedLeaves,
//       });

//       await empLeave.save();

//       // ✅ SUBSTITUTION NOTIFICATIONS (timetable optional)
//       console.log(
//         "🔍 Processing periodAdjustments:",
//         leaveRequest.periodAdjustments
//       );
//       let substituteNotificationsSent = 0;

//       for (let i = 0; i < (leaveRequest.periodAdjustments || []).length; i++) {
//         const adj = leaveRequest.periodAdjustments[i];

//         let substituteFacultyId = adj.substituteFacultyId;
//         if (substituteFacultyId && typeof substituteFacultyId === "object") {
//           substituteFacultyId = substituteFacultyId._id;
//         }

//         console.log(`🔍 Adjustment ${i}:`, {
//           substituteId: substituteFacultyId,
//           className: adj.className,
//           semester: adj.semester || "MISSING!",
//           hasSubstitute: !!substituteFacultyId,
//         });

//         if (!substituteFacultyId) continue;

//         try {
//           const substituteUser = await User.findById(substituteFacultyId);
//           if (substituteUser) {
//             await createNotification(
//               substituteFacultyId,
//               leaveRequest._id,
//               "substitute_assignment",
//               "Substitute Assignment Confirmed ✅",
//               `You are assigned ${adj.className} on ${moment(adj.date).format(
//                 "DD MMM YYYY"
//               )}, Period ${adj.period}. ${leaveRequest.employeeId.name} on approved leave. Please check timetable.`
//             );
//             adj.notificationStatus = "sent";
//             substituteNotificationsSent++;
//             console.log(`✅ NOTIFICATION SENT to ${substituteUser.name}`);
//           }

//           // Optional timetable update
//           try {
//             if (adj.semester) {
//               const day = moment(adj.date).format("dddd");
//               const timetable = await Timetable.findOne({
//                 departmentType: adj.departmentId,
//                 className: adj.className,
//                 semester: adj.semester,
//               });

//               if (timetable) {
//                 const idx = timetable.timetable.findIndex(
//                   (p) => p.day === day && p.period === adj.period
//                 );
//                 if (idx !== -1) {
//                   timetable.timetable[idx].faculty = substituteFacultyId;
//                   await timetable.save();
//                   console.log("✅ Timetable UPDATED");
//                 }
//               }
//             } else {
//               console.log("⚠️ Skipping timetable: missing semester");
//             }
//           } catch (timetableErr) {
//             console.error("⚠️ Timetable failed (ignored):", timetableErr.message);
//           }
//         } catch (notifError) {
//           console.error("❌ Notification failed:", notifError);
//         }
//       }

//       leaveRequest.markModified("periodAdjustments");

//       await createNotification(
//         leaveRequest.employeeId._id,
//         leaveRequest._id,
//         "leave_approved",
//         "Leave Approved ✅",
//         `Director approved your leave (${leaveRequest.totalDays} days). ${substituteNotificationsSent} substitutes notified.`
//       );

//       await leaveRequest.save();

//       return res.json({
//         success: true,
//         message: `✅ Leave approved! ${substituteNotificationsSent} substitutes notified`,
//         notificationsSent: substituteNotificationsSent,
//         leaveRequest,
//       });
//     }

//     // REJECT
//     leaveRequest.status = "rejected_by_director";
//     leaveRequest.directorApproval = {
//       approvedBy: directorId,
//       approvedAt: new Date(),
//       comments: comments || "",
//     };

//     await createNotification(
//       leaveRequest.employeeId._id,
//       leaveRequest._id,
//       "leave_rejected",
//       "Leave Rejected",
//       "Director rejected your leave request"
//     );

//     await leaveRequest.save();
//     res.json({ message: "Leave rejected by Director", leaveRequest });
//   } catch (err) {
//     console.error("❌ Director approval error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
exports.directorApproveReject = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const { action, comments, directorId } = req.body;

    const director = await User.findById(directorId);
    if (!director || director.role !== "director") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const leaveRequest = await LeaveRequest.findById(leaveRequestId).populate("employeeId");
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "Approved by HOD" && leaveRequest.status !== "Pending Director Approval") {
      return res.status(400).json({ message: "Leave not pending director approval" });
    }

    const leaveTypeData = await LeaveType.findById(leaveRequest.leaveTypeId);
    const dateRangeStr = `${moment(leaveRequest.startDate).format("DD MMM YYYY")} to ${moment(leaveRequest.endDate).format("DD MMM YYYY")}`;
    const currentYear = new Date().getFullYear();

    if (action === "approve") {
      leaveRequest.status = "Approved by Director";
      leaveRequest.directorApproval = {
        approvedBy: directorId,
        approvedAt: new Date(),
        comments: comments || "",
      };

      // --- LEAVE DEDUCTION LOGIC (year-scoped, duplicate-safe) ---
      // Use year filter to match the correct EmployeeLeave record
      let empLeave = await EmployeeLeave.findOne({
        employeeId: leaveRequest.employeeId._id,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear,
      });

      if (!empLeave) {
        // Fallback: try without year (legacy records)
        empLeave = await EmployeeLeave.findOne({
          employeeId: leaveRequest.employeeId._id,
          leaveTypeId: leaveRequest.leaveTypeId,
        });
      }

      if (!empLeave) {
        empLeave = new EmployeeLeave({
          employeeId: leaveRequest.employeeId._id,
          leaveTypeId: leaveRequest.leaveTypeId,
          year: currentYear,
          usedLeaves: 0,
        });
      }

      // Duplicate-deduction guard: only deduct if leave was truly pending
      // (not already deducted — status was just changed above so we're safe)
      if (leaveTypeData?.leaveEffect !== "ADD") {
        // DEDUCT type: increment usedLeaves
        empLeave.usedLeaves = (empLeave.usedLeaves || 0) + leaveRequest.totalDays;
      } else {
        // ADD type (Comp-Off, On-Duty): also track usage
        empLeave.usedLeaves = (empLeave.usedLeaves || 0) + leaveRequest.totalDays;
      }
      await empLeave.save();
      console.log(`✅ Leave deducted: ${leaveRequest.totalDays} days for employeeId=${leaveRequest.employeeId._id}, leaveType=${leaveTypeData?.name}, year=${currentYear}, newUsed=${empLeave.usedLeaves}`);

      // --- RULE: Automatically cancel overlapping OOD leaves if this is an Emergency Leave ---
      if (leaveTypeData?.name.toLowerCase().includes("emergency")) {
        const overlappingOODLeaves = await LeaveRequest.find({
          employeeId: leaveRequest.employeeId._id,
          status: "Approved by Director",
          startDate: { $lte: leaveRequest.endDate },
          endDate: { $gte: leaveRequest.startDate },
          _id: { $ne: leaveRequest._id }
        }).populate('leaveTypeId');

        for (const oodReq of overlappingOODLeaves) {
          if (oodReq.leaveTypeId?.name.toLowerCase().includes("ood")) {
            oodReq.status = "Cancelled";
            await oodReq.save();

            // Restore balance for OOD if it was deducted
            let oodEmpLeave = await EmployeeLeave.findOne({
              employeeId: oodReq.employeeId,
              leaveTypeId: oodReq.leaveTypeId._id,
              year: currentYear
            });
            if (oodEmpLeave) {
              oodEmpLeave.usedLeaves = Math.max(0, (oodEmpLeave.usedLeaves || 0) - oodReq.totalDays);
              await oodEmpLeave.save();
            }

            await createNotification(
              oodReq.employeeId,
              oodReq._id,
              "leave_cancelled",
              "OOD Leave Automatically Cancelled",
              `Your OOD leave has been automatically cancelled because your Emergency leave for the same date range was approved.`
            );
          }
        }
      }

      // --- SUBSTITUTION & NOTIFICATIONS ---
      const subListForOwner = [];
      let substituteNotificationsSent = 0;

      for (const adj of (leaveRequest.periodAdjustments || [])) {
        let subId = adj.substituteFacultyId?._id || adj.substituteFacultyId;
        if (!subId) continue;

        const subUser = await User.findById(subId);
        if (subUser) {
          // 1. Add to the list for the Leave Taker's email
          subListForOwner.push({
            date: moment(adj.date).format("DD MMM YYYY"),
            period: adj.period,
            className: adj.className,
            subName: subUser.name
          });

          // 2. Notify the Substitute (Include Leave Taker Name, Date, Period)
          await createNotification(
            subId,
            leaveRequest._id,
            "substitute_assignment",
            "Substitute Duty Assigned",
            `You are covering for ${leaveRequest.employeeId.name}`,
            {
              subInfo: {
                leaveTaker: leaveRequest.employeeId.name,
                date: moment(adj.date).format("DD MMM YYYY"),
                period: adj.period,
                className: adj.className
              }
            }
          );
          substituteNotificationsSent++;
        }
      }

      // 3. Notify the Leave Taker with FULL details
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "leave_approved",
        "Leave Approved ✅",
        `Your leave from ${dateRangeStr} has been approved by the Director.`,
        {
          leaveDetails: {
            type: leaveTypeData?.name || "Leave",
            dates: dateRangeStr,
            reason: leaveRequest.description
          },
          substitutions: subListForOwner
        }
      );

      await leaveRequest.save();
      return res.json({ success: true, message: "Leave approved and emails sent." });
    }

    // --- REJECTION LOGIC ---
    leaveRequest.status = "Rejected by Director";
    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected",
      `Director rejected your leave request. Reason: ${comments || "No comments"}`
    );

    await leaveRequest.save();
    res.json({ message: "Leave rejected by Director" });
  } catch (err) {
    console.error("Director approval error:", err);
    res.status(500).json({ message: "Server error" });
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
      .populate("periodAdjustments.substituteFacultyId", "name email")
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
    // Restrict to same department as requested
    const deptFaculty = await User.find({
      departmentType: user.departmentType._id,
      role: { $in: ["teaching", "hod"] },
      _id: { $ne: employeeId },
    }).select("name email departmentType").populate("departmentType", "departmentName");

    // We will calculate availability for each period
    const periodsWithAvailability = [];

    for (const p of periods) {
      const availableSubstitutesForThisPeriod = [];
      const periodDate = moment(p.date).startOf('day').toDate();
      const periodDay = p.day;
      const periodNum = p.period;

      for (const faculty of deptFaculty) {
        // 1. Check if they have an APPROVED leave
        const onLeave = await LeaveRequest.findOne({
          employeeId: faculty._id,
          status: { $in: ["Approved by Director", "Approved by HOD", "approved"] },
          startDate: { $lte: periodDate },
          endDate: { $gte: periodDate },
        });
        if (onLeave) continue;

        // 2. Check if they are originally allocated for another class (using $elemMatch for precision)
        const hasOwnClass = await Timetable.findOne({
          timetable: {
            $elemMatch: {
              faculty: faculty._id,
              day: periodDay,
              period: periodNum
            }
          }
        });
        if (hasOwnClass) continue;

        // 3. Check if already APPROVED as a substitute for another class
        const isAlreadySubstituting = await LeaveRequest.findOne({
          status: {
            $in: [
              "Substitute Approved",
              "Pending HOD Approval",
              "Approved by HOD",
              "Pending Director Approval",
              "Approved by Director",
              "approved"
            ]
          },
          periodAdjustments: {
            $elemMatch: {
              substituteFacultyId: faculty._id,
              date: periodDate,
              period: periodNum,
              "substituteApproval.status": "approved"
            }
          }
        });
        if (isAlreadySubstituting) continue;

        // Passed all checks
        availableSubstitutesForThisPeriod.push({
          _id: faculty._id,
          name: faculty.name,
          email: faculty.email,
          departmentName: faculty.departmentType?.departmentName || "N/A"
        });
      }

      availableSubstitutesForThisPeriod.sort((a, b) => a.name.localeCompare(b.name));

      periodsWithAvailability.push({
        ...p,
        availableSubstitutes: availableSubstitutesForThisPeriod
      });
    }

    res.json({ periods: periodsWithAvailability, availableSubstitutes: deptFaculty });
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

    if (!hod.departmentType) {
      console.error(`HOD ${hod.name} (${hodId}) has no departmentType assigned!`);
      return res.status(400).json({ message: "HOD has no department assigned." });
    }

    const deptId = hod.departmentType._id || hod.departmentType;
    const departmentUsers = await User.find({ departmentType: deptId });
    const departmentUserIds = departmentUsers.map((u) => u._id);
    console.log(`getHodPendingRequests: HOD ${hod.name}, DeptID: ${deptId}, Found ${departmentUserIds.length} users in this dept`);

    const TERMINAL_STATUSES = [
      "Approved by Director",
      "Rejected by Director",
      "Rejected by HOD",
      "approved",
      "rejected",
      "cancelled",
      "Cancelled"
    ];

    const allRequests = await LeaveRequest.find({
      status: { $nin: TERMINAL_STATUSES },
      employeeId: { $in: departmentUserIds },
    })
      .populate("employeeId", "name email role departmentType")
      .populate("leaveTypeId", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    // Also include emergency leaves already HOD-approved (Pending Director Approval)
    // so HOD can still arrange substitutes on behalf of faculty after approval
    const emergencyPostApproval = await LeaveRequest.find({
      status: "Pending Director Approval",
      employeeId: { $in: departmentUserIds },
    })
      .populate("employeeId", "name email role departmentType")
      .populate("leaveTypeId", "name")
      .populate("periodAdjustments.substituteFacultyId", "name email")
      .sort({ createdAt: -1 });

    // Filter core list:
    // - Emergency: show at all approval stages (HOD approves first, optionally assigns subs)
    // - Non-emergency: only show AFTER substitutes accepted (status = "Pending HOD Approval")
    const filteredRequests = allRequests.filter(r => {
      const isEmergency = r.leaveTypeId?.name?.toLowerCase().includes("emergency");
      if (isEmergency) {
        return ["Pending HOD Approval", "Pending Substitute Approval", "Substitute Approved"].includes(r.status);
      } else {
        return r.status === "Pending HOD Approval";
      }
    });

    // Merge emergency post-approval (for substitute arrangement) - avoid duplicates
    const filteredIds = new Set(filteredRequests.map(r => r._id.toString()));
    for (const r of emergencyPostApproval) {
      const isEmergency = r.leaveTypeId?.name?.toLowerCase().includes("emergency");
      if (isEmergency && !filteredIds.has(r._id.toString())) {
        filteredRequests.push(r);
      }
    }

    // Sort merged result by createdAt descending
    filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`getHodPendingRequests: HOD ${hod.name}, Returning ${filteredRequests.length} requests.`);

    res.json(filteredRequests);
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
    const departmentUserIds = departmentUsers.map((u) => u._id);

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

    const TERMINAL_STATUSES = [
      "Approved by Director",
      "Rejected by Director",
      "Rejected by HOD",
      "approved",
      "rejected",
      "cancelled",
      "Cancelled"
    ];

    const leaveRequests = await LeaveRequest.find({
      status: {
        $in: ["Pending Director Approval", "Approved by HOD", "pending_director"],
        $nin: TERMINAL_STATUSES
      }
    })
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

    const leaveRequest = await LeaveRequest.findById(leaveRequestId)
      .populate("employeeId", "name email role departmentType")
      .populate("leaveTypeId", "name");

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const isEmergency = leaveRequest.leaveTypeId?.name?.toLowerCase().includes("emergency") ||
      leaveRequest.description?.toLowerCase().includes("emergency");

    // Update adjustments and reset statuses
    // substituteFacultyId may arrive as a populated object {_id, name} from the frontend —
    // always normalise it to a plain ObjectId-compatible value before saving.
    const getRawId = (val) => {
      if (!val) return null;
      if (typeof val === "object" && val._id) return val._id;
      return val;
    };

    leaveRequest.periodAdjustments = periodAdjustments.map((adj) => ({
      ...adj,
      substituteFacultyId: getRawId(adj.substituteFacultyId),
      date: moment(adj.date).toDate(),
      substituteApproval: {
        status: "pending",
        approvedAt: null,
        comments: ""
      }
    }));

    // If emergency AND already forwarded to Director (post-approval substitute arrangement),
    // keep the status as "Pending Director Approval" (don't revert to HOD approval stage).
    // If emergency and still pending HOD, keep at HOD stage.
    // If non-emergency, go to substitute approval phase.
    if (isEmergency && leaveRequest.status === "Pending Director Approval") {
      // Post-approval substitute arrangement — keep Director approval status
      // substitutes are notified but their acceptance is informational
      leaveRequest.status = "Pending Director Approval";
    } else if (isEmergency) {
      leaveRequest.status = "Pending HOD Approval";
    } else {
      leaveRequest.status = "Pending Substitute Approval";
    }

    await leaveRequest.save();

    // Notify newly assigned substitutes
    // NOTE: substituteFacultyId from the frontend can arrive as a populated object
    // ({_id, name}) OR as a plain ID string — always extract the raw string ID.
    const extractSubId = (val) => {
      if (!val) return null;
      if (typeof val === "object" && val._id) return val._id.toString();
      return val.toString();
    };

    const uniqueSubIds = new Set();
    (periodAdjustments || []).forEach(adj => {
      const sid = extractSubId(adj.substituteFacultyId);
      if (sid) uniqueSubIds.add(sid);
    });

    for (const subId of uniqueSubIds) {
      const subDetails = (periodAdjustments || []).filter(
        a => extractSubId(a.substituteFacultyId) === subId
      );
      const pText = subDetails.map(d => `Period ${d.period} (${d.className} on ${moment(d.date).format("DD MMM")})`).join(", ");

      const isPostApproval = isEmergency && leaveRequest.status === "Pending Director Approval";
      const notifMsg = isPostApproval
        ? `HOD has assigned you as a substitute for ${leaveRequest.employeeId.name}'s emergency leave (already approved). Please log in to confirm your availability.\n\nPeriods: ${pText}`
        : `HOD has assigned you as a substitute for ${leaveRequest.employeeId.name}'s leave. Please log in to accept.\n\nPeriods: ${pText}`;

      await createNotification(
        subId,
        leaveRequest._id,
        "substitute_assignment",
        "HOD Assigned Substitution" + (isEmergency ? " (Emergency)" : ""),
        notifMsg
      );
    }

    res.json({ message: "Period adjustments updated and substitutes notified.", leaveRequest });
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

    const leaveRequests = await LeaveRequest.find({ status: "Approved by Director" })
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
// // =============================
// exports.getDirectorDashboardStats = async (req, res) => {
//   try {
//     const today = moment().startOf("day");
//     const todayEnd = moment().endOf("day");

//     const departments = await Department.find().sort({ departmentName: 1 });
//     const departmentStats = [];

//     for (const dept of departments) {
//       const faculty = await User.find({
//         departmentType: dept._id,
//         role: { $in: ["teaching", "non-teaching", "hod"] },
//       }).select("_id name email role");

//       const facultyOnLeave = await LeaveRequest.find({
//         employeeId: { $in: faculty.map((f) => f._id) },
//         status: "approved",
//         startDate: { $lte: todayEnd.toDate() },
//         endDate: { $gte: today.toDate() },
//       })
//         .populate("employeeId", "name email role")
//         .populate("leaveTypeId", "name");

//       const leaveIds = new Set(
//         facultyOnLeave.map((l) => l.employeeId._id.toString())
//       );
//       const availableFaculty = faculty.filter((f) => !leaveIds.has(f._id.toString()));
//       const onLeaveFaculty = faculty.filter((f) => leaveIds.has(f._id.toString()));

//       const leaveDetails = facultyOnLeave.map((leave) => ({
//         facultyId: leave.employeeId._id,
//         facultyName: leave.employeeId.name,
//         facultyEmail: leave.employeeId.email,
//         facultyRole: leave.employeeId.role,
//         leaveType: leave.leaveTypeId?.name || "N/A",
//         startDate: leave.startDate,
//         endDate: leave.endDate,
//         description: leave.description,
//       }));

//       departmentStats.push({
//         departmentId: dept._id,
//         departmentName: dept.departmentName,
//         totalFaculty: faculty.length,
//         availableFaculty: availableFaculty.length,
//         facultyOnLeave: onLeaveFaculty.length,
//         availableFacultyList: availableFaculty.map((f) => ({
//           facultyId: f._id,
//           name: f.name,
//           email: f.email,
//           role: f.role,
//         })),
//         leaveDetails,
//       });
//     }

//     const totalDepartments = departments.length;
//     const totalFaculty = await User.countDocuments({
//       role: { $in: ["teaching", "non-teaching", "hod"] },
//     });

//     const allApprovedLeavesToday = await LeaveRequest.countDocuments({
//       status: "approved",
//       startDate: { $lte: todayEnd.toDate() },
//       endDate: { $gte: today.toDate() },
//     });

//     const pendingLeaves = await LeaveRequest.countDocuments({
//       status: "pending_director",
//     });

//     const approvedLeaves = await LeaveRequest.countDocuments({
//       status: "approved",
//     });

//     res.json({
//       totalDepartments,
//       totalFaculty,
//       pendingLeaves,
//       approvedLeaves,
//       facultyOnLeaveToday: allApprovedLeavesToday,
//       departmentStats,
//     });
//   } catch (error) {
//     console.error("Error fetching director dashboard stats:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // =============================
// // HOD DASHBOARD STATS
// // =============================
// exports.getHodDashboardStats = async (req, res) => {
//   try {
//     const { departmentId } = req.params;
//     const today = moment().startOf("day");
//     const todayEnd = moment().endOf("day");

//     const department = await Department.findById(departmentId);
//     if (!department) {
//       return res.status(404).json({ message: "Department not found" });
//     }

//     const faculty = await User.find({
//       departmentType: departmentId,
//       role: { $in: ["teaching", "non-teaching"] },
//     }).select("_id name email role");

//     const facultyOnLeave = await LeaveRequest.find({
//       employeeId: { $in: faculty.map((f) => f._id) },
//       status: "approved",
//       startDate: { $lte: todayEnd.toDate() },
//       endDate: { $gte: today.toDate() },
//     })
//       .populate("employeeId", "name email role")
//       .populate("leaveTypeId", "name");

//     const leaveIds = new Set(
//       facultyOnLeave.map((l) => l.employeeId._id.toString())
//     );
//     const availableFaculty = faculty.filter((f) => !leaveIds.has(f._id.toString()));
//     const onLeaveFaculty = faculty.filter((f) => leaveIds.has(f._id.toString()));

//     const absenceDetails = facultyOnLeave.map((leave) => ({
//       facultyId: leave.employeeId._id,
//       facultyName: leave.employeeId.name,
//       facultyEmail: leave.employeeId.email,
//       facultyRole: leave.employeeId.role,
//       leaveType: leave.leaveTypeId?.name || "N/A",
//       startDate: leave.startDate,
//       endDate: leave.endDate,
//       totalDays: leave.totalDays,
//       description: leave.description,
//       periodAdjustments: leave.periodAdjustments || [],
//     }));

//     const pendingLeaves = await LeaveRequest.countDocuments({
//       employeeId: { $in: faculty.map((f) => f._id) },
//       status: "pending_hod",
//     });

//     const approvedLeaves = await LeaveRequest.countDocuments({
//       employeeId: { $in: faculty.map((f) => f._id) },
//       status: { $in: ["approved", "pending_director"] },
//     });

//     const rejectedLeaves = await LeaveRequest.countDocuments({
//       employeeId: { $in: faculty.map((f) => f._id) },
//       status: { $in: ["rejected_by_hod", "rejected_by_director"] },
//     });

//     res.json({
//       departmentId: department._id,
//       departmentName: department.departmentName,
//       totalFaculty: faculty.length,
//       availableFaculty: availableFaculty.length,
//       facultyOnLeave: onLeaveFaculty.length,
//       pendingLeaves,
//       approvedLeaves,
//       rejectedLeaves,
//       absenceDetails,
//       availableFacultyList: availableFaculty.map((f) => ({
//         facultyId: f._id,
//         name: f.name,
//         email: f.email,
//         role: f.role,
//       })),
//     });
//   } catch (error) {
//     console.error("Error fetching HOD dashboard stats:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };
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

      const facultyIds = faculty.map((f) => f._id);

      // APPROVED STATUS: includes both new and legacy strings
      const APPROVED_STATUSES = ["Approved by Director", "approved"];

      const facultyOnLeave = await LeaveRequest.find({
        employeeId: { $in: facultyIds },
        status: { $in: APPROVED_STATUSES },
        startDate: { $lte: todayEnd.toDate() },
        endDate: { $gte: today.toDate() },
      })
        .populate("employeeId", "name email role")
        .populate("leaveTypeId", "name");

      const leaveIds = new Set(
        facultyOnLeave.map((l) => l.employeeId._id.toString())
      );

      const availableFaculty = faculty.filter(
        (f) => !leaveIds.has(f._id.toString())
      );
      const onLeaveFaculty = faculty.filter((f) =>
        leaveIds.has(f._id.toString())
      );

      const leaveDetails = facultyOnLeave.map((leave) => ({
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
        availableFacultyList: availableFaculty.map((f) => ({
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

    // Fully approved status strings (new + legacy)
    const APPROVED_STATUSES = ["Approved by Director", "approved"];
    const PENDING_DIRECTOR_STATUSES = ["Pending Director Approval", "Approved by HOD", "pending_director"];

    // All approved leaves intersecting today (for entire institute)
    const allApprovedLeavesToday = await LeaveRequest.countDocuments({
      status: { $in: APPROVED_STATUSES },
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    });

    // All pending at director (new + legacy)
    const pendingLeaves = await LeaveRequest.countDocuments({
      status: { $in: PENDING_DIRECTOR_STATUSES },
    });

    // Pending at director intersecting today
    const pendingWithinWindow = await LeaveRequest.countDocuments({
      status: { $in: PENDING_DIRECTOR_STATUSES },
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    });

    const pendingOutsideWindow = pendingLeaves - pendingWithinWindow;

    const approvedLeaves = await LeaveRequest.countDocuments({
      status: { $in: APPROVED_STATUSES },
    });

    res.json({
      totalDepartments,
      totalFaculty,
      pendingLeaves,
      pendingWithinWindow,
      pendingOutsideWindow,
      approvedLeaves,
      facultyOnLeaveToday: allApprovedLeavesToday,
      departmentStats,
    });
  } catch (error) {
    console.error("Error fetching director dashboard stats:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
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

    const facultyIds = faculty.map((f) => f._id);

    // Status groups covering both new-style and legacy strings
    const APPROVED_STATUSES = ["Approved by Director", "approved"];
    const PENDING_HOD_STATUSES = ["Pending HOD Approval", "pending_hod"];
    const PENDING_DIRECTOR_STATUSES = ["Pending Director Approval", "Approved by HOD", "pending_director"];
    const REJECTED_STATUSES = ["Rejected by HOD", "Rejected by Director", "Substitute Rejected", "rejected_by_hod", "rejected_by_director"];

    const facultyOnLeave = await LeaveRequest.find({
      employeeId: { $in: facultyIds },
      status: { $in: APPROVED_STATUSES },
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    })
      .populate("employeeId", "name email role")
      .populate("leaveTypeId", "name");

    const leaveIds = new Set(
      facultyOnLeave.map((l) => l.employeeId._id.toString())
    );

    const availableFaculty = faculty.filter(
      (f) => !leaveIds.has(f._id.toString())
    );
    const onLeaveFaculty = faculty.filter((f) =>
      leaveIds.has(f._id.toString())
    );

    const absenceDetails = facultyOnLeave.map((leave) => ({
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

    // Pending HOD approvals for this department's faculty
    const pendingLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: facultyIds },
      status: { $in: PENDING_HOD_STATUSES },
    });

    // Pending HOD approvals intersecting today's date
    const pendingWithinWindow = await LeaveRequest.countDocuments({
      employeeId: { $in: facultyIds },
      status: { $in: PENDING_HOD_STATUSES },
      startDate: { $lte: todayEnd.toDate() },
      endDate: { $gte: today.toDate() },
    });

    const pendingOutsideWindow = pendingLeaves - pendingWithinWindow;

    // Approved (fully) or at Director stage (approved by HOD, awaiting director)
    const approvedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: facultyIds },
      status: { $in: [...APPROVED_STATUSES, ...PENDING_DIRECTOR_STATUSES] },
    });

    const rejectedLeaves = await LeaveRequest.countDocuments({
      employeeId: { $in: facultyIds },
      status: { $in: REJECTED_STATUSES },
    });

    res.json({
      departmentId: department._id,
      departmentName: department.departmentName,
      totalFaculty: faculty.length,
      availableFaculty: availableFaculty.length,
      facultyOnLeave: onLeaveFaculty.length,
      pendingLeaves,
      pendingWithinWindow,
      pendingOutsideWindow,
      approvedLeaves,
      rejectedLeaves,
      absenceDetails,
      availableFacultyList: availableFaculty.map((f) => ({
        facultyId: f._id,
        name: f.name,
        email: f.email,
        role: f.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching HOD dashboard stats:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
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
      status: { $in: ["Approved by Director", "approved"] },
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }).populate({
      path: "employeeId",
      match: {
        departmentType: departmentId,
        role: { $in: ["teaching", "non-teaching", "hod"] },
      },
      select: "name email",
    });

    const validRequests = leaveRequests.filter((r) => r.employeeId);

    const facultyLeaveMap = {};
    facultyList.forEach((fac) => {
      const id = fac._id.toString();
      facultyLeaveMap[id] = {
        name: fac.name,
        email: fac.email,
        totalDays: 0,
        leaveCount: 0,
      };
    });

    validRequests.forEach((request) => {
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

    // Fetch all leaves that are at or past the Director's stage
    const leaveRequests = await LeaveRequest.find({
      $or: [
        { status: "Pending Director Approval" },
        { status: "Approved by HOD" },   // legacy support
        { status: "Approved by Director" },
        { status: "Rejected by Director" },
        { status: "pending_director" },
        { status: "approved" },
        { status: "rejected_by_director" }
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

    // Filter the pending ones: only show if ALL substitutes have accepted
    // (For emergency leaves that have no substitutes yet, still show them since HOD approved first)
    // Historical (approved/rejected by director) are always shown.
    const DIRECTOR_HISTORICAL = [
      "Approved by Director", "Rejected by Director",
      "approved", "rejected_by_director"
    ];

    const filtered = leaveRequests.filter((r) => {
      // Always include historical decisions
      if (DIRECTOR_HISTORICAL.includes(r.status)) return true;

      // For pending ones: check all substitutes have accepted
      const adjustments = r.periodAdjustments || [];
      if (adjustments.length === 0) {
        // No substitutes required (or emergency without subs) — allow Director to view
        return true;
      }

      const allAccepted = adjustments.every(
        (adj) => adj.substituteApproval?.status === "approved"
      );
      return allAccepted;
    });

    console.log(
      `getDirectorAllRequests: Total fetched=${leaveRequests.length}, After substitute filter=${filtered.length}`
    );

    res.json(filtered);
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

    const myAdjustments = (leaveRequest.periodAdjustments || []).filter((adj) => {
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
      substitutions: myAdjustments.map((adj) => ({
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
// GET ALL SUBSTITUTIONS FOR A FACULTY
// =============================
exports.getMySubstitutions = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const mongoose = require("mongoose");

    // Ensure we have a valid ObjectId for the query
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ message: "Invalid Faculty ID format" });
    }

    const objFacultyId = new mongoose.Types.ObjectId(facultyId);

    console.log("getMySubstitutions: Searching for sub assignments for ID:", facultyId);

    // Find ONLY requests where this faculty is actually listed in periodAdjustments
    const leaveRequests = await LeaveRequest.find({
      "periodAdjustments.substituteFacultyId": objFacultyId,
      status: {
        $in: [
          // New statuses (used by current system)
          "Pending Substitute Approval",
          "Substitute Approved",
          "Substitute Rejected",
          "Pending HOD Approval",
          "Approved by HOD",
          "Pending Director Approval",
          "Approved by Director",
          "Rejected by HOD",
          "Rejected by Director",
          // Legacy statuses (backward compatibility)
          "pending_substitute",
          "pending_hod",
          "pending_director",
          "approved",
          "rejected_by_substitute"
        ]
      }
    })
      .populate("employeeId", "name email")
      .sort({ createdAt: -1 });

    console.log(`getMySubstitutions: Found ${leaveRequests.length} candidate leave requests`);

    const result = [];

    for (const lr of leaveRequests) {
      if (!lr.employeeId) {
        console.log("getMySubstitutions: Skipping LR because employeeId is null", lr._id);
        continue;
      }

      (lr.periodAdjustments || []).forEach((adj) => {
        const subId = adj.substituteFacultyId?.toString();

        // Debug ID comparison
        if (subId) {
          console.log("getMySubstitutions: Checking adjustment", {
            adjId: adj._id,
            subIdInDB: subId,
            facultyIdFromReq: facultyId,
            match: subId === facultyId.toString()
          });
        }

        if (subId && subId === facultyId.toString()) {
          result.push({
            leaveRequestId: lr._id,
            periodId: adj._id,
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
            substituteApproval: adj.substituteApproval,
            leaveRequestStatus: lr.status
          });
        }
      });
    }

    console.log(`getMySubstitutions: Returning ${result.length} filtered adjustments for facultyId: ${facultyId}`);
    res.json(result);
  } catch (error) {
    console.error("Error fetching my substitutions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =============================
// FACULTY MONTH-WISE LEAVE USAGE
// =============================
// GET /api/leave-request/faculty/:employeeId/usage?month=YYYY-MM
// If month missing, default = current month
exports.getFacultyLeaveUsageByMonth = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // format: YYYY-MM

    // 1) Resolve month range
    let startOfMonth, endOfMonth;
    if (month) {
      // month like "2025-03"
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const mIndex = parseInt(monthStr, 10) - 1; // 0-based
      startOfMonth = moment({ year, month: mIndex, day: 1 }).startOf("day");
      endOfMonth = moment(startOfMonth).endOf("month");
    } else {
      // current month
      startOfMonth = moment().startOf("month");
      endOfMonth = moment().endOf("month");
    }

    // 2) Load allocation per leave type for this employee
    const allocations = await EmployeeLeave.find({ employeeId }).populate(
      "leaveTypeId",
      "name leaveAction"
    );

    // Build map: leaveTypeId -> { totalAvailableYear, usedYear, remainingYear }
    const allocationMap = {};
    allocations.forEach((al) => {
      if (!al.leaveTypeId) return; // safety

      const total = (al.totalLeaves || 0) + (al.carryForwardLeaves || 0);
      const used = al.usedLeaves || 0;
      const key = al.leaveTypeId._id.toString();

      allocationMap[key] = {
        leaveTypeId: al.leaveTypeId._id,
        leaveTypeName: al.leaveTypeId.name,
        leaveAction: al.leaveTypeId.leaveAction, // DEDUCT / ADD
        totalAvailableYear: total,
        usedYear: used,
        remainingYear: Math.max(total - used, 0),
      };
    });

    // 3) Load APPROVED leave requests in this month for this employee
    // Include both new-style "Approved by Director" and legacy "approved"
    const approvedLeaves = await LeaveRequest.find({
      employeeId,
      status: { $in: ["Approved by Director", "approved"] },
      endDate: { $gte: startOfMonth.toDate() },
      startDate: { $lte: endOfMonth.toDate() },
    }).populate("leaveTypeId", "name leaveAction");

    // 4) Aggregate "days taken in month" per leave type
    const monthTakenMap = {}; // leaveTypeId -> daysInMonth
    approvedLeaves.forEach((lr) => {
      if (!lr.leaveTypeId) {
        // corrupted / legacy record without type → skip
        return;
      }

      const ltId = lr.leaveTypeId._id
        ? lr.leaveTypeId._id.toString()
        : lr.leaveTypeId.toString();

      const start = moment(lr.startDate).isBefore(startOfMonth)
        ? startOfMonth.clone()
        : moment(lr.startDate);
      const end = moment(lr.endDate).isAfter(endOfMonth)
        ? endOfMonth.clone()
        : moment(lr.endDate);

      const daysInMonth = end.diff(start, "days") + 1;
      if (!monthTakenMap[ltId]) monthTakenMap[ltId] = 0;
      monthTakenMap[ltId] += daysInMonth;
    });

    // 5) Build response per leave type
    const result = [];

    // Include all allocated leave types
    Object.keys(allocationMap).forEach((ltId) => {
      const alloc = allocationMap[ltId];
      const monthTaken = monthTakenMap[ltId] || 0;

      const remainingMonth = Math.max(alloc.remainingYear - monthTaken, 0);

      result.push({
        leaveTypeId: alloc.leaveTypeId,
        leaveTypeName: alloc.leaveTypeName,
        leaveAction: alloc.leaveAction,
        totalAvailableYear: alloc.totalAvailableYear,
        usedYear: alloc.usedYear,
        remainingYear: alloc.remainingYear,
        monthKey: month || startOfMonth.format("YYYY-MM"),
        takenInMonth: monthTaken,
        remainingInMonth: remainingMonth,
      });
    });

    // Also include leave types that had usage but no allocation record
    Object.keys(monthTakenMap).forEach((ltId) => {
      if (!allocationMap[ltId]) {
        const lrSample = approvedLeaves.find((lr) => {
          if (!lr.leaveTypeId) return false;
          const idStr = lr.leaveTypeId._id
            ? lr.leaveTypeId._id.toString()
            : lr.leaveTypeId.toString();
          return idStr === ltId;
        });

        const ltName = lrSample?.leaveTypeId?.name || "Unknown";
        const ltAction = lrSample?.leaveTypeId?.leaveAction || "DEDUCT";
        const monthTaken = monthTakenMap[ltId];

        result.push({
          leaveTypeId: ltId,
          leaveTypeName: ltName,
          leaveAction: ltAction,
          totalAvailableYear: 0,
          usedYear: monthTaken,
          remainingYear: 0,
          monthKey: month || startOfMonth.format("YYYY-MM"),
          takenInMonth: monthTaken,
          remainingInMonth: 0,
        });
      }
    });

    return res.json({
      employeeId,
      month: month || startOfMonth.format("YYYY-MM"),
      data: result,
    });
  } catch (error) {
    console.error("Error fetching faculty leave usage by month:", error);
    res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
// ADMIN MONTHLY ATTENDANCE REPORT PER FACULTY
// GET /api/admin/monthly-attendance?year=2025&month=3
exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10); // 1-12

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year or month" });
    }

    const startOfMonth = moment([year, month - 1, 1]).startOf("day");
    const endOfMonth = startOfMonth.clone().endOf("month");

    // 1) Load all active faculty (teaching, non-teaching, hod)
    const facultyList = await User.find({
      role: { $in: ["teaching", "non-teaching", "hod"] },
    }).select("name email role departmentType");

    // 2) Load all APPROVED leaves intersecting month (new + legacy statuses)
    const leaves = await LeaveRequest.find({
      status: { $in: ["Approved by Director", "approved"] },
      endDate: { $gte: startOfMonth.toDate() },
      startDate: { $lte: endOfMonth.toDate() },
    }).populate("leaveTypeId", "name leaveAction");

    // 3) Helper: classify leave type that should be excluded (OOD, CL, EL)
    const isExcludedLeaveType = (ltName = "") => {
      const n = ltName.toUpperCase();
      return n.includes("OOD") || n.includes("CL") || n.includes("EL");
    };

    const govtHolidays = [
      "2026-01-01", "2026-01-26", "2026-03-08", "2026-03-25", "2026-04-10",
      "2026-05-01", "2026-08-15", "2026-10-02", "2026-10-21", "2026-11-01",
      "2026-12-25"
    ];

    let govtHolidaysInMonth = 0;
    govtHolidays.forEach((h) => {
      if (moment(h).isBetween(startOfMonth, endOfMonth, null, "[]")) {
        govtHolidaysInMonth++;
      }
    });

    let sundays = 0;
    let curr = startOfMonth.clone();
    while (curr.isSameOrBefore(endOfMonth)) {
      if (curr.day() === 0) sundays++;
      curr.add(1, "day");
    }

    const totalDaysInMonth = endOfMonth.date();
    const holidaysInMonth = sundays + govtHolidaysInMonth;
    const workingDays = totalDaysInMonth - holidaysInMonth;

    // 4) Aggregate leave days per faculty (excluding OOD/CL/EL, only DEDUCT types)
    const leaveDaysByFaculty = {}; // facultyId -> { total, toDate }

    leaves.forEach((lr) => {
      const leaveType = lr.leaveTypeId;
      if (!leaveType) return;

      if (leaveType.leaveAction !== "DEDUCT") return;
      if (isExcludedLeaveType(leaveType.name)) return;

      const lrStart = moment.max(moment(lr.startDate).startOf("day"), startOfMonth);
      const lrEnd = moment.min(moment(lr.endDate).endOf("day"), endOfMonth);
      const today = moment().startOf("day");

      let deductedForThisReq = 0;
      let toDateForThisReq = 0;
      let temp = lrStart.clone();
      while (temp.isSameOrBefore(lrEnd)) {
        const isSun = temp.day() === 0;
        const isGov = govtHolidays.includes(temp.format("YYYY-MM-DD"));
        if (!isSun && !isGov) {
          const inc = lr.isHalfDay ? 0.5 : 1;
          deductedForThisReq += inc;
          if (temp.isSameOrBefore(today)) {
            toDateForThisReq += inc;
          }
        }
        temp.add(1, "day");
      }

      const key = lr.employeeId.toString();
      if (!leaveDaysByFaculty[key]) leaveDaysByFaculty[key] = { total: 0, toDate: 0 };
      leaveDaysByFaculty[key].total += deductedForThisReq;
      leaveDaysByFaculty[key].toDate += toDateForThisReq;
    });

    const result = facultyList.map((fac) => {
      const facId = fac._id.toString();
      const ld = leaveDaysByFaculty[facId] || { total: 0, toDate: 0 };

      const totalPresent = workingDays - ld.total;

      return {
        facultyId: facId,
        name: fac.name,
        email: fac.email,
        role: fac.role,
        departmentId: fac.departmentType,
        year,
        month,
        totalDaysInMonth,
        holidaysInMonth,
        leaveDays: ld.total,
        leaveDaysToDate: ld.toDate,
        totalPresent: totalPresent < 0 ? 0 : totalPresent,
      };
    });

    return res.json({ year, month, data: result });
  } catch (error) {
    console.error("Error fetching monthly attendance report", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// =============================
// CANCEL LEAVE REQUEST
// =============================
exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { leaveRequestId } = req.params;
    const leaveRequest = await LeaveRequest.findById(leaveRequestId);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status === "Cancelled") {
      return res.status(400).json({ message: "Leave request is already cancelled" });
    }

    // --- RULE: Leave cancellation allowed only before start date OR on start date before 10:00 AM ---
    const now = moment();
    const startOfLeave = moment(leaveRequest.startDate).startOf('day');

    if (now.isAfter(startOfLeave, 'day') || (now.isSame(startOfLeave, 'day') && now.hour() >= 10)) {
      return res.status(400).json({ message: "Cancellation is only allowed before 10:00 AM on the leave start date." });
    }

    // --- RULE: If cancelled after approval, restore leave balance ---
    const approvedStatuses = ["Approved by Director", "approved"];
    if (approvedStatuses.includes(leaveRequest.status)) {
      const currentYear = new Date().getFullYear();
      let empLeave = await EmployeeLeave.findOne({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: currentYear
      });

      if (!empLeave) {
        empLeave = await EmployeeLeave.findOne({
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
        });
      }

      if (empLeave) {
        empLeave.usedLeaves = Math.max(0, (empLeave.usedLeaves || 0) - (leaveRequest.totalDays || 0));
        await empLeave.save();
      }
    }

    leaveRequest.status = "Cancelled";
    await leaveRequest.save();

    res.json({ message: "Leave request cancelled successfully", leaveRequest });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// DEPARTMENT FACULTY PRESENT DAYS REPORT
// GET /api/leaveType/department/present-days?departmentId=xxx&month=3&year=2025

