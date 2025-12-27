const express = require("express");
const router = express.Router();
const leaveRequestController = require("../Controller/leaveRequestController");
const { get } = require("mongoose");

// Apply leave request
router.post("/apply", leaveRequestController.applyLeaveRequest);
router.get("/admin/monthly-attendance", leaveRequestController.getMonthlyAttendanceReport);

// Get user's leave requests
router.get("/my-requests/:employeeId", leaveRequestController.getMyLeaveRequests);

// Get periods for date range (for period adjustment)
router.get("/periods/:employeeId/:startDate/:endDate", leaveRequestController.getPeriodsForDateRange);

// HOD operations
router.get("/hod/pending/:hodId", leaveRequestController.getHodPendingRequests);
router.get("/hod/all/:hodId", leaveRequestController.getHodDepartmentLeaveRequests);
router.put("/hod/action/:leaveRequestId", leaveRequestController.hodApproveReject);
router.put("/hod/update-periods/:leaveRequestId", leaveRequestController.hodUpdatePeriodAdjustments);

// Director operations
router.get("/director/pending/:directorId", leaveRequestController.getDirectorPendingRequests);
router.get("/director/approved/:directorId", leaveRequestController.getDirectorApprovedLeaves);
router.put("/director/action/:leaveRequestId", leaveRequestController.directorApproveReject);

// Notifications
router.get("/notifications/:userId", leaveRequestController.getNotifications);
router.put("/notifications/:notificationId/read", leaveRequestController.markNotificationRead);
router.get("/my-substitutions/:facultyId", leaveRequestController.getMySubstitutions);

// Get substitution details for a given leave request for a given faculty
router.get(
  "/substitution-details/:leaveRequestId/:facultyId",
  leaveRequestController.getSubstitutionDetailsForFaculty
);


// Dashboard Stats
router.get("/director/stats", leaveRequestController.getDirectorDashboardStats);
router.get("/hod/stats/:departmentId", leaveRequestController.getHodDashboardStats);
router.get("/analytics/department/:departmentId", leaveRequestController.getDepartmentLeaveAnalytics);

// Director operations
// router.get("/director/pending/:directorId", leaveRequestController.getDirectorPendingRequests);
// router.get("/director/approved/:directorId", leaveRequestController.getDirectorApprovedLeaves);
// ADD THIS LINE BELOW:
router.get("/director/all/:directorId", leaveRequestController.getDirectorAllRequests); 
// router.put("/director/action/:leaveRequestId", leaveRequestController.directorApproveReject);
router.get(
  "/faculty/:employeeId/usage",
  leaveRequestController.getFacultyLeaveUsageByMonth
);
module.exports = router;



