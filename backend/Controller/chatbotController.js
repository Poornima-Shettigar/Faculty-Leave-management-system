const User = require("../Models/User");
const LeaveRequest = require("../Models/LeaveRequest");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const Timetable = require("../Models/Timetable");
const Department = require("../Models/Department");

exports.chatbotChat = async (req, res) => {
  const { message, employeeId } = req.body;
  const q = (message || "").toLowerCase().trim();

  try {
    if (!employeeId) {
      return res.json({ reply: "Please login again to continue." });
    }

    // Fetch logged-in user with department info
    const user = await User.findById(employeeId)
      .populate("departmentType", "departmentName level classNames totalClasses")
      .lean();

    if (!user) {
      return res.json({ reply: "User not found." });
    }

    /* =======================
       👋 GREETING
    ======================= */
    if (q.match(/\b(hi|hello|hey)\b/)) {
      return res.json({
        reply: `Hello ${user.name} 👋 How can I help you today?`,
      });
    }

    /* =======================
       ❓ HELP
    ======================= */
    if (q.includes("help")) {
      return res.json({
        reply:
          "You can ask:\n" +
          "- Which department do I belong to?\n" +
          "- How many faculty are there in my department?\n" +
          "- Show department details\n" +
          "- Who is the HOD of MCA/MBA/BCA?\n" +
          "- Leave balance / leave status\n" +
          "- Pending / approved / rejected leaves\n" +
          "- Classes today / next class\n" +
          "- Who are absent / present today\n" +
          "- Which subjects I handle / am I class teacher?",
      });
    }

    /* =======================
       🏫 DEPARTMENT
    ======================= */
    if (q.includes("which department") || q.includes("my department")) {
      return res.json({
        reply: `You belong to the ${user.departmentType.departmentName} department.`,
      });
    }

    if (q.includes("show department details")) {
      const d = user.departmentType;
      return res.json({
        reply:
          `Department: ${d.departmentName}\n` +
          `Level: ${d.level}\n` +
          `Total Classes: ${d.totalClasses}\n` +
          `Classes: ${d.classNames.join(", ")}`,
      });
    }

    /* =======================
       👨‍🏫 FACULTY COUNT
    ======================= */
    if (
      q.includes("how many faculty") &&
      (q.includes("mca") || q.includes("mba") || q.includes("bca"))
    ) {
      const deptName = q.includes("mca")
        ? "MCA"
        : q.includes("mba")
        ? "MBA"
        : "BCA";

      const dept = await Department.findOne({ departmentName: deptName });
      const count = await User.countDocuments({
        departmentType: dept._id,
        role: { $in: ["faculty", "hod"] },
      });

      return res.json({
        reply: `There are ${count} faculty members in the ${deptName} department.`,
      });
    }

    if (q.includes("how many faculty") && q.includes("my department")) {
      const count = await User.countDocuments({
        departmentType: user.departmentType._id,
        role: { $in: ["faculty", "hod"] },
      });
      return res.json({
        reply: `There are ${count} faculty members in your department (${user.departmentType.departmentName}).`,
      });
    }

    /* =======================
       👨‍🏫 HOD
    ======================= */
    if (q.includes("hod")) {
      let dept = user.departmentType;

      if (q.includes("mca") || q.includes("mba") || q.includes("bca")) {
        const deptName = q.includes("mca")
          ? "MCA"
          : q.includes("mba")
          ? "MBA"
          : "BCA";
        dept = await Department.findOne({ departmentName: deptName });
      }

      const hod = await User.findOne({
        departmentType: dept._id,
        role: "hod",
      });

      return res.json({
        reply: hod
          ? `HOD of ${dept.departmentName} is ${hod.name} (${hod.email}).`
          : "HOD details not available.",
      });
    }

    /* =======================
       🧾 LEAVE BALANCE
    ======================= */
    if (q.includes("leave balance") || q.includes("remaining leave")) {
      const year = new Date().getFullYear();
      const leaveTypes = await LeaveType.find().lean();
      const empLeaves = await EmployeeLeave.find({ employeeId, year }).lean();

      let lines = [];
      leaveTypes.forEach((lt) => {
        const rec = empLeaves.find(
          (e) => String(e.leaveTypeId) === String(lt._id)
        );
        const total = rec?.totalLeaves ?? lt.allowedLeaves ?? 0;
        const used = rec?.usedLeaves ?? 0;
        const remaining = total - used;
        lines.push(`${lt.name}: ${remaining}/${total} days`);
      });

      return res.json({ reply: lines.join("\n") });
    }

    /* =======================
       🧾 LEAVE STATUS / PENDING / APPROVED / REJECTED
    ======================= */
    if (q.includes("leave status") || q.includes("show my leave status")) {
      const latest = await LeaveRequest.findOne({ employeeId })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({
        reply: latest
          ? `Your last leave from ${latest.startDate.toDateString()} to ${latest.endDate.toDateString()} is ${latest.status}.`
          : "You have not applied for any leave yet.",
      });
    }

    if (q.includes("pending leave")) {
      const count = await LeaveRequest.countDocuments({
        employeeId,
        status: "Pending",
      });
      return res.json({
        reply: `You have ${count} pending leave request(s).`,
      });
    }

    if (q.includes("approved leave")) {
      const count = await LeaveRequest.countDocuments({
        employeeId,
        status: "Approved",
      });
      return res.json({
        reply: `You have ${count} approved leave request(s).`,
      });
    }

    if (q.includes("rejected leave")) {
      const count = await LeaveRequest.countDocuments({
        employeeId,
        status: "Rejected",
      });
      return res.json({
        reply: `You have ${count} rejected leave request(s).`,
      });
    }

    if (q.includes("who is on leave today")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const leaves = await LeaveRequest.find({
        departmentType: user.departmentType._id,
        status: "Approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).populate("employeeId", "name");

      if (!leaves.length) {
        return res.json({
          reply: `No faculty are on leave today in ${user.departmentType.departmentName}.`,
        });
      }

      return res.json({
        reply:
          `Faculty on leave today:\n` +
          leaves.map((l) => l.employeeId.name).join("\n"),
      });
    }

    /* =======================
       📅 TIMETABLE & CLASSES
    ======================= */
    if (q.includes("classes today") || q.includes("timetable")) {
      const day = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const tts = await Timetable.find({ "timetable.faculty": employeeId })
        .populate("timetable.subject")
        .lean();

      let result = [];
      tts.forEach((t) => {
        t.timetable.forEach((p) => {
          if (p.day === day && String(p.faculty) === employeeId) {
            result.push(
              `Period ${p.period}: ${p.subject.subjectName} (${t.className}, Sem ${t.semester})`
            );
          }
        });
      });

      return res.json({
        reply: result.length ? result.join("\n") : "No classes today.",
      });
    }

    if (q.includes("next class")) {
      const day = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const tts = await Timetable.find({ "timetable.faculty": employeeId })
        .populate("timetable.subject")
        .lean();

      let next = null;
      tts.forEach((t) => {
        t.timetable.forEach((p) => {
          if (p.day === day && String(p.faculty) === employeeId) {
            if (!next || p.period < next.period) next = p;
          }
        });
      });

      return res.json({
        reply: next
          ? `Your next class is Period ${next.period}: ${next.subject.subjectName}.`
          : "You have no more classes today.",
      });
    }

    /* =======================
       🚫 ABSENT / PRESENT TODAY
    ======================= */
    if (q.includes("absent today")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const leaves = await LeaveRequest.find({
        departmentType: user.departmentType._id,
        status: "Approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).populate("employeeId", "name");

      const names = leaves.map((l) => l.employeeId.name);
      return res.json({
        reply: names.length
          ? `Absent today:\n${names.join("\n")}`
          : `No faculty are absent today in ${user.departmentType.departmentName}.`,
      });
    }

    if (q.includes("present today")) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allFaculty = await User.find({
        departmentType: user.departmentType._id,
        role: { $in: ["faculty", "hod"] },
      }).lean();

      const absentLeaves = await LeaveRequest.find({
        departmentType: user.departmentType._id,
        status: "Approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).lean();

      const absentIds = absentLeaves.map((l) => String(l.employeeId));
      const present = allFaculty.filter((f) => !absentIds.includes(String(f._id)));

      return res.json({
        reply: present.length
          ? `Present today (${user.departmentType.departmentName}):\n${present.map(f => f.name).join("\n")}`
          : "No faculty are present today.",
      });
    }

    /* =======================
       ❌ FALLBACK
    ======================= */
    return res.json({
      reply: "I couldn't understand that. Type 'help' to see options.",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ reply: "System error. Please try again." });
  }
};
