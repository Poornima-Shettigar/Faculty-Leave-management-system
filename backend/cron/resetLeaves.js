const cron = require("node-cron");
const LeaveType = require("../Models/LeaveType");
const EmployeeLeave = require("../Models/EmployeeLeave");

// Run at midnight on Jan 1 every year
cron.schedule("0 0 1 1 *", async () => {
  console.log("Running yearly leave reset...");

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  try {
    const leaveTypes = await LeaveType.find();

    for (const lt of leaveTypes) {
      const prevYearRecords = await EmployeeLeave.find({
        leaveTypeId: lt._id,
        year: previousYear
      });

      for (const emp of prevYearRecords) {
        let newTotal = lt.allowedLeaves;

        let carry = 0;
        if (lt.isForwarding) {
          const remaining = (emp.totalLeaves || 0) - (emp.usedLeaves || 0);
          carry = remaining > 0 ? remaining : 0;
          newTotal += carry;
        }

        // upsert record for currentYear
        await EmployeeLeave.findOneAndUpdate(
          {
            employeeId: emp.employeeId,
            leaveTypeId: lt._id,
            year: currentYear
          },
          {
            $set: {
              totalLeaves: newTotal,
              usedLeaves: 0,
              carryForwardLeaves: carry,
              // creditedLeaves carries on only for ADD types if you want; else reset
              creditedLeaves: lt.leaveEffect === "ADD" ? emp.creditedLeaves || 0 : 0
            }
          },
          { upsert: true, new: true }
        );
      }
    }

    console.log("Yearly leave reset completed for year", currentYear);
  } catch (err) {
    console.error("Yearly leave reset error:", err);
  }
});
