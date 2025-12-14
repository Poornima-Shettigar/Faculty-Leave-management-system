const express = require("express");
const router = express.Router();
const leaveRequestController = require("../Controller/leaveRequestController");

// Apply leave request
router.post("/apply", leaveRequestController.applyLeaveRequest);

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

module.exports = router;



