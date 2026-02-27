# API Testing Guide

## Quick Test Commands

Use these curl commands or Postman to test the new endpoints:

### 1. Test Director - Get All Departments with Faculty Leaves

```bash
curl http://localhost:5000/api/director/faculty-leaves/all
```

### 2. Test Director - Get Specific Department Faculty

Replace `DEPARTMENT_ID` with an actual department ID from your database:

```bash
curl http://localhost:5000/api/director/faculty-leaves/DEPARTMENT_ID
```

### 3. Test Director - Get Faculty Complete Details

Replace `FACULTY_ID` with an actual faculty/user ID:

```bash
curl http://localhost:5000/api/director/faculty-details/FACULTY_ID
```

### 4. Test Profile Update

Replace `USER_ID` with your user ID:

```bash
curl -X PATCH http://localhost:5000/api/faculty/profile/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "9876543210"
  }'
```

### 5. Test Profile Update with Password

```bash
curl -X PATCH http://localhost:5000/api/faculty/profile/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "9876543210",
    "password": "newpassword123"
  }'
```

## Browser Testing

### Director Panel
1. Login as Director
2. Navigate to: http://localhost:5173/director/dashboard/department-faculty
3. You should see:
   - List of departments in card format
   - Click on a department to see faculty list
   - Click on a faculty to see complete details with leave balances

### Profile Edit
1. Login as any user (Faculty, HOD, Director, or Non-Teaching)
2. Navigate to the profile page:
   - Faculty: http://localhost:5173/faculty/dashboard/profile
   - HOD: http://localhost:5173/hod/dashboard/profile
   - Director: http://localhost:5173/director/dashboard/profile
   - Non-Teaching: http://localhost:5173/non-teaching/dashboard/profile
3. You should see:
   - Current user information (read-only section)
   - Editable form for name and phone
   - Optional password change section
   - Save and Reset buttons

## Expected Responses

### Get All Departments with Faculty Leaves

```json
[
  {
    "department": {
      "_id": "dept_id",
      "name": "Computer Science",
      "level": "UG"
    },
    "faculty": [
      {
        "_id": "faculty_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "role": "teaching",
        "leaveDetails": [
          {
            "leaveType": "Casual Leave",
            "totalAllowed": 12,
            "usedLeaves": 3,
            "availableLeaves": 9,
            "carryForward": 0
          }
        ],
        "totalLeavesApproved": 2
      }
    ]
  }
]
```

### Get Faculty Complete Details

```json
{
  "faculty": {
    "_id": "faculty_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "teaching",
    "dateOfJoining": "2023-01-15",
    "department": {
      "_id": "dept_id",
      "departmentName": "Computer Science",
      "level": "UG"
    }
  },
  "leaveDetails": [
    {
      "leaveType": "Casual Leave",
      "leaveAction": "DEDUCT",
      "totalAllowed": 12,
      "usedLeaves": 3,
      "availableLeaves": 9,
      "carryForward": 0,
      "creditedLeaves": 0
    }
  ],
  "leaveRequests": [
    {
      "_id": "request_id",
      "leaveType": "Casual Leave",
      "startDate": "2026-02-20T00:00:00.000Z",
      "endDate": "2026-02-22T00:00:00.000Z",
      "totalDays": 3,
      "status": "approved",
      "description": "Personal work",
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ],
  "summary": {
    "totalLeaveTypes": 5,
    "totalRequests": 8,
    "approvedRequests": 5,
    "pendingRequests": 2,
    "rejectedRequests": 1
  }
}
```

### Profile Update Success

```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_id",
    "name": "Updated Name",
    "email": "original@example.com",
    "phone": "9876543210",
    "role": "teaching",
    "departmentType": "dept_id",
    "dateOfJoining": "2023-01-15"
  }
}
```

## Common Issues and Solutions

### Issue: 404 - Route not found
**Solution**: Ensure backend server is restarted after adding new routes

### Issue: CORS error
**Solution**: Frontend should be running on port 5173, backend on port 5000

### Issue: Empty faculty list
**Solution**: 
1. Check if departments have faculty assigned
2. Verify departmentType field in User documents matches department _id

### Issue: Leave details not showing
**Solution**:
1. Verify EmployeeLeave records exist for the faculty
2. Check if leave types are allocated to the faculty

### Issue: Profile update fails with email change
**Solution**: Email cannot be changed - this is by design for security

## Debugging Tips

1. **Check Browser Console**: Look for network errors or API response details
2. **Check Backend Logs**: Server should show incoming requests
3. **Verify Authentication**: Ensure user is logged in with valid session
4. **Database Check**: Use MongoDB Compass or shell to verify data structure

## MongoDB Shell Commands

```javascript
// Check if departments exist
db.departments.find().pretty()

// Check if faculty have leave allocations
db.employeeleaves.find({ employeeId: ObjectId("FACULTY_ID") }).pretty()

// Check if faculty exist in departments
db.users.find({ role: { $in: ["teaching", "non-teaching", "hod"] } }).pretty()

// Check leave requests
db.leaverequests.find({ employeeId: ObjectId("FACULTY_ID") }).pretty()
```

---

*Updated: February 17, 2026*
