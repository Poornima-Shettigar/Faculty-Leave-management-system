const cron = require("node-cron");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");

cron.schedule("0 0 1 1 *", async () => {
  console.log("Running yearly leave reset...");

  const leaveTypes = await LeaveType.find();

  for (const lt of leaveTypes) {
    const employees = await EmployeeLeave.find({ leaveTypeId: lt._id });

    for (const emp of employees) {
      let newTotal = lt.allowedLeaves;

      // If forwarding is enabled → Add remaining leaves
      if (lt.isForwarding) {
        const remaining = emp.totalLeaves - emp.usedLeaves;
        newTotal += remaining > 0 ? remaining : 0;

        emp.carryForwardLeaves = remaining;
      } else {
        emp.carryForwardLeaves = 0
      }

      emp.totalLeaves = newTotal;
      emp.usedLeaves = 0;
      await emp.save();
    }
  }

  console.log("Yearly leave reset completed");
});
