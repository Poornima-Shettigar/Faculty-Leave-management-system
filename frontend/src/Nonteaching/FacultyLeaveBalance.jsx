import React, { useEffect, useState } from "react";
import axios from "axios";

function FacultyLeaveBalance({ facultyId }) {
  const [leaveData, setLeaveData] = useState([]);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
const res = await axios.get(`/api/leaveType/faculty/${user._id}/leaves`);
      setLeaveData(res.data);
    } catch (error) {
      console.error("Error fetching leave data:", error);
    }
  };

  return (
    <div className="leave-container">
      <h2>Leave Balance for Current Academic Year</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Total Leaves</th>
            <th>Used Leaves</th>
            <th>Remaining Leaves</th>
          </tr>
        </thead>

        {<tbody>
          {leaveData.map((leave) => (
            <tr key={leave.id}>
              <td>{leave.leave_name}</td>
              <td>{leave.total_leaves}</td>
              <td>{leave.used_leaves}</td>
              <td>{leave.remaining_leaves}</td>
            </tr>
          ))}
        </tbody> }
      </table>
    </div>
  );
}

export default FacultyLeaveBalance;
