import React, { useEffect, useState } from "react";
import axios from "axios";

function LeaveStatus() {
  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?._id || user?.id;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveStatus();
  }, []);

  const fetchLeaveStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/my/${employeeId}`
      );
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Failed to load leave status", err);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">My Leave Requests1</h2>

      {loading ? (
        <p className="text-gray-600">Loading leave status...</p>
      ) : leaves.length === 0 ? (
        <p className="text-gray-500">No leave requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Leave Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">From</th>
                <th className="px-4 py-3 text-left text-sm font-medium">To</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Days</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{leave.leaveType}</td>
                  <td className="px-4 py-3">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">{leave.days}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                        leave.status
                      )}`}
                    >
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.appliedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaveStatus;
