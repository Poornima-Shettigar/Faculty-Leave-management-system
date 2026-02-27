# Substitution Approval Flow - Implementation Guide

## Overview
This guide provides the implementation details for completing the substitution approval workflow where leave requests with substitute assignments must be approved by substitutes before going to HOD.

---

## Current State vs Desired State

### Current Flow
1. Faculty applies for leave
2. Assigns substitutes for periods
3. Leave request goes directly to HOD (`status: "pending_hod"`)

### Desired Flow
1. Faculty applies for leave
2. Assigns substitutes for periods
3. Leave request goes to substitutes first (`status: "pending_substitute"`)
4. Each substitute approves/rejects their assigned period(s)
5. **Only when ALL substitutes approve**, request goes to HOD
6. If ANY substitute rejects, request is rejected (`status: "rejected_by_substitute"`)

---

## Implementation Steps

### Step 1: Update Leave Application Logic

**File**: `backend/Controller/leaveRequestController.js`

Modify the `applyLeaveRequest` function around line 495-506:

```javascript
// Determine initial status
let initialStatus;
if (periodAdjustments && periodAdjustments.length > 0) {
  // Check if any period has a substitute assigned
  const hasSubstitutes = periodAdjustments.some(p => p.substituteFacultyId);
  
  if (hasSubstitutes) {
    initialStatus = "pending_substitute";  // NEW: Wait for substitutes first
  } else {
    initialStatus = isHod ? "pending_director" : "pending_hod";
  }
} else {
  initialStatus = isHod ? "pending_director" : "pending_hod";
}

const leaveRequest = await LeaveRequest.create({
  employeeId,
  leaveTypeId,
  startDate,
  endDate,
  totalDays,
  description,
  periodAdjustments: periodAdjustments || [],
  status: initialStatus,  // Use the determined status
  isHalfDay: !!isHalfDay,
  halfDaySession: isHalfDay ? halfDaySession || null : null,
});
```

### Step 2: Create Substitute Approval/Rejection Endpoints

**File**: `backend/Controller/leaveRequestController.js`

Add these new controller functions:

```javascript
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

    if (periodIndex === -1) {
      return res.status(404).json({ message: "Period not found" });
    }

    const period = leaveRequest.periodAdjustments[periodIndex];

    // Verify the substitute
    if (period.substituteFacultyId.toString() !== substituteId) {
      return res.status(403).json({ message: "Unauthorized: Not the assigned substitute" });
    }

    // Update the period approval
    leaveRequest.periodAdjustments[periodIndex].substituteApproval = {
      status: "approved",
      approvedAt: new Date(),
      comments: comments || ""
    };

    await leaveRequest.save();

    // Check if ALL substitutes have approved
    const allApproved = leaveRequest.periodAdjustments.every(
      p => !p.substituteFacultyId || p.substituteApproval.status === "approved"
    );

    if (allApproved) {
      // All substitutes approved - forward to HOD
      const user = await User.findById(leaveRequest.employeeId._id);
      const isHod = user.role === "hod";
      
      leaveRequest.status = isHod ? "pending_director" : "pending_hod";
      await leaveRequest.save();

      // Notify HOD or Director
      if (isHod) {
        const directors = await User.find({ role: "director" });
        for (const director of directors) {
          await createNotification(
            director._id,
            leaveRequest._id,
            "leave_requested",
            "Leave Pending Approval",
            `${user.name} (HOD) applied for leave with all substitutes approved`
          );
        }
      } else {
        const hod = await User.findOne({
          role: "hod",
          departmentType: user.departmentType
        });
        if (hod) {
          await createNotification(
            hod._id,
            leaveRequest._id,
            "leave_requested",
            "Leave Pending Approval",
            `${user.name} applied for leave with all substitutes approved`
          );
        }
      }

      // Notify employee
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "substitute_approved",
        "Substitutes Approved",
        "All substitutes have approved. Your leave request has been forwarded to HOD."
      );
    } else {
      // Notify employee about partial approval
      await createNotification(
        leaveRequest.employeeId._id,
        leaveRequest._id,
        "substitute_approved",
        "Substitute Approved Period",
        `${period.className} - Period ${period.period} substitute has been approved.`
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

    // Verify the substitute
    if (period.substituteFacultyId.toString() !== substituteId) {
      return res.status(403).json({ message: "Unauthorized: Not the assigned substitute" });
    }

    // Update the period approval
    leaveRequest.periodAdjustments[periodIndex].substituteApproval = {
      status: "rejected",
      approvedAt: new Date(),
      comments: comments || "No reason provided"
    };

    // Reject the entire leave request
    leaveRequest.status = "rejected_by_substitute";
    await leaveRequest.save();

    // Notify employee
    await createNotification(
      leaveRequest.employeeId._id,
      leaveRequest._id,
      "leave_rejected",
      "Leave Rejected by Substitute",
      `Your leave request was rejected by a substitute. ${period.className} - Period ${period.period}. Reason: ${comments || "No reason provided"}`
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
```

### Step 3: Add Routes for Substitute Actions

**File**: `backend/Router/leaveRequestRoutes.js`

Add these routes:

```javascript
// Substitute approval
router.put(
  "/substitute/approve/:leaveRequestId/:periodId",
  leaveRequestController.substituteApprovePeriod
);

router.put(
  "/substitute/reject/:leaveRequestId/:periodId",
  leaveRequestController.substituteRejectPeriod
);
```

### Step 4: Update Substitution Page Frontend

**File**: `frontend/src/Faculty/SubstitutionPage.jsx`

Update to include approve/reject functionality:

```javascript
const handleApprove = async (leaveRequestId, periodId) => {
  if (!window.confirm("Are you sure you want to approve this substitution?")) {
    return;
  }

  try {
    const userId = localStorage.getItem("userId");
    const res = await axios.put(
      `http://localhost:5000/api/leave-request/substitute/approve/${leaveRequestId}/${periodId}`,
      {
        substituteId: userId,
        comments: ""  // Optional: Add a comment input field
      }
    );

    alert(res.data.message);
    // Refresh the substitution list
    loadSubstitutions();
  } catch (err) {
    console.error("Error approving substitution:", err);
    alert(err.response?.data?.message || "Failed to approve");
  }
};

const handleReject = async (leaveRequestId, periodId) => {
  const reason = prompt("Please provide a reason for rejection:");
  if (!reason) return;

  try {
    const userId = localStorage.getItem("userId");
    const res = await axios.put(
      `http://localhost:5000/api/leave-request/substitute/reject/${leaveRequestId}/${periodId}`,
      {
        substituteId: userId,
        comments: reason
      }
    );

    alert(res.data.message);
    loadSubstitutions();
  } catch (err) {
    console.error("Error rejecting substitution:", err);
    alert(err.response?.data?.message || "Failed to reject");
  }
};

// In the JSX, add buttons for each pending substitution
<div className="flex gap-2">
  {sub.substituteApproval?.status === "pending" && (
    <>
      <button
        onClick={() => handleApprove(sub.leaveRequestId, sub.periodId)}
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Approve
      </button>
      <button
        onClick={() => handleReject(sub.leaveRequestId, sub.periodId)}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reject
      </button>
    </>
  )}
  {sub.substituteApproval?.status === "approved" && (
    <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
      Approved
    </span>
  )}
  {sub.substituteApproval?.status === "rejected" && (
    <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
      Rejected
    </span>
  )}
</div>
```

### Step 5: Update Notification System

**File**: `backend/Controller/leaveRequestController.js`

In the `applyLeaveRequest` async notification block (around line 515-591), add:

```javascript
// If status is pending_substitute, notify all substitutes
if (initialStatus === "pending_substitute") {
  const substituteIds = new Set();
  periodAdjustments.forEach(adj => {
    if (adj.substituteFacultyId) {
      substituteIds.add(adj.substituteFacultyId.toString());
    }
  });

  for (const subId of substituteIds) {
    const subDetails = periodAdjustments.filter(
      adj => adj.substituteFacultyId?.toString() === subId
    );

    await createNotification(
      subId,
      leaveRequest._id,
      "substitute_assignment",
      "Substitute Assignment - Approval Required",
      `You have been assigned as substitute for ${user.name}. Please review and approve/reject.`,
      {
        subInfo: {
          leaveTaker: user.name,
          periods: subDetails.map(d => ({
            date: moment(d.date).format("DD MMM YYYY"),
            period: d.period,
            className: d.className
          }))
        }
      }
    );
  }

  // Notify employee
  await createNotification(
    employeeId,
    leaveRequest._id,
    "leave_requested",
    "Application Submitted",
    "Your leave request has been submitted and is awaiting substitute approval.",
    emailMeta
  );
} else {
  // Existing notification logic for HOD/Director
  // ...
}
```

---

## Testing the Flow

### Test Case 1: Happy Path (All Substitutes Approve)
1. Faculty applies for leave with 2 substitutes
2. Verify status is `pending_substitute`
3. First substitute approves their period
4. Verify status is still `pending_substitute`
5. Second substitute approves their period
6. Verify status changes to `pending_hod`
7. HOD receives notification

### Test Case 2: Rejection Path
1. Faculty applies for leave with substitute
2. Verify status is `pending_substitute`
3. Substitute rejects
4. Verify status changes to `rejected_by_substitute`
5. Faculty receives rejection notification

### Test Case 3: Leave Without Substitute
1. Faculty applies for leave without any substitute
2. Verify status is `pending_hod` (skips substitute approval)
3. Proceed with normal flow

---

## Database Validation

After implementation, verify:

```javascript
// Check leave request structure
db.leaverequests.findOne({ status: "pending_substitute" })

// Verify period adjustment structure
{
  periodAdjustments: [
    {
      substituteFacultyId: ObjectId("..."),
      substituteApproval: {
        status: "pending",  // or "approved" / "rejected"
        approvedAt: ISODate("..."),
        comments: "..."
      }
    }
  ]
}
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/api/leave-request/substitute/approve/:leaveRequestId/:periodId` | Substitute approves their assigned period |
| PUT | `/api/leave-request/substitute/reject/:leaveRequestId/:periodId` | Substitute rejects their assigned period |

**Request Body:**
```json
{
  "substituteId": "userId",
  "comments": "Optional comment"
}
```

---

## UI Enhancement Suggestions

1. **Badge showing approval status** on each substitute period
2. **Filter in SubstitutionPage** to show only pending approvals
3. **Bulk approve** option if substitute has multiple periods for same leave request
4. **Email notifications** to substitutes with direct link to approve/reject

---

*This completes the substitution approval workflow implementation.*
