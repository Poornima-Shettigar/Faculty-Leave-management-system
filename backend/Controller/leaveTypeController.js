const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");
const User = require("../Models/User");

// -------------------------------
// ADD Leave Type
// -------------------------------
/*exports.addLeaveType = async (req, res) => {
  try {
    const { name, allowedLeaves, roles, departmentId, isForwarding } = req.body;

    if (!name || !allowedLeaves || !roles || roles.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const leaveType = new LeaveType({ name, allowedLeaves, roles, isForwarding });
    await leaveType.save();

    const filter = { role: { $in: roles } };
    if (departmentId) filter.departmentType = departmentId;

    const users = await User.find(filter);

    const allocations = users.map(u => ({
      employeeId: u._id,
      leaveTypeId: leaveType._id,
      totalLeaves: allowedLeaves
    }));

    if (allocations.length > 0) {
      await EmployeeLeave.insertMany(allocations);
    }

    res.status(201).json({
      message: `Leave type created and allocated to ${allocations.length} users`,
      leaveType
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};*/
const moment = require("moment");

exports.addLeaveType = async (req, res) => {
  try {
    const { name, allowedLeaves, roles, departmentId, isForwarding } = req.body;

    const leaveType = new LeaveType({ name, allowedLeaves, roles, isForwarding });
    await leaveType.save();

    const filter = { role: { $in: roles } };
    if (departmentId) filter.departmentType = departmentId;

    const users = await User.find(filter);

    const currentYear = moment().year();

    const allocations = users.map(u => {
      const joinYear = moment(u.joiningDate).year();
      const joinMonth = moment(u.joiningDate).month() + 1;

      let totalLeaves = allowedLeaves;

      // If employee joined this year → prorated leaves
      if (joinYear === currentYear) {
        const monthsLeft = 12 - joinMonth + 1;
        totalLeaves = Math.round((allowedLeaves / 12) * monthsLeft);
      }

      return {
        employeeId: u._id,
        leaveTypeId: leaveType._id,
        totalLeaves,
        usedLeaves: 0,
        carryForwardLeaves: 0
      };
    });

    await EmployeeLeave.insertMany(allocations);

    res.status(201).json({
      message: "Leave type created and allocated with join-date calculation",
      leaveType
    });

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};



// -------------------------------
// EDIT Leave Type
// -------------------------------
exports.updateLeaveType = async (req, res) => {
  try {
    const { name, allowedLeaves, roles, isForwarding } = req.body;
    const id = req.params.id;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) return res.status(404).json({ message: "Leave type not found" });

    leaveType.name = name;
    leaveType.allowedLeaves = allowedLeaves;
    leaveType.roles = roles;
    leaveType.isForwarding = isForwarding;

    await leaveType.save();

    // also update allowed leaves for employees
    await EmployeeLeave.updateMany(
      { leaveTypeId: id },
      { $set: { totalLeaves: allowedLeaves } }
    );

    res.json({ message: "Leave type updated", leaveType });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


// -------------------------------
// DELETE Leave Type
// -------------------------------
exports.deleteLeaveType = async (req, res) => {
  try {
    const id = req.params.id;

    const leaveType = await LeaveType.findById(id);
    if (!leaveType) return res.status(404).json({ message: "Not found" });

    await LeaveType.findByIdAndDelete(id);
    await EmployeeLeave.deleteMany({ leaveTypeId: id });

    res.json({ message: "Leave type deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


// -------------------------------
// LIST All Leave Types
// -------------------------------
exports.getAllLeaveTypes = async (req, res) => {
  try {
    const list = await LeaveType.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};


// -------------------------------
// SEARCH Leave Types
// -------------------------------
exports.searchLeaveType = async (req, res) => {
  try {
    const keyword = req.query.q;

    const results = await LeaveType.find({
      name: { $regex: keyword, $options: "i" }
    });

    res.json(results);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
// -------------------------------
// GET Leave Summary for a Faculty
// -------------------------------
exports.getFacultyLeaveSummary = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const leaves = await EmployeeLeave.find({ employeeId })
      .populate("leaveTypeId", "name allowedLeaves isForwarding")
      .sort({ createdAt: -1 });

    if (!leaves || leaves.length === 0) {
      return res.status(200).json([]); // return empty array to prevent frontend errors
    }

    const formatted = leaves.map(entry => {
      const allowed = entry.totalLeaves || 0;
      const carry = entry.carryForwardLeaves || 0;
      const used = entry.usedLeaves || 0;

      const totalAvailable = allowed + carry;
      const remaining = Math.max(totalAvailable - used, 0);

      return {
        leaveTypeId: entry.leaveTypeId?._id,
        leaveTypeName: entry.leaveTypeId?.name || "Unknown",
        allowedLeaves: allowed,
        carryForwardLeaves: carry,
        usedLeaves: used,
        totalAvailable,
        remainingLeaves: remaining
      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
