import React, { useState, useEffect } from "react";
import axios from "axios";

function MyLeaveStatus() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeId = user._id || user.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveRequests();
  }, [employeeId]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/my-requests/${employeeId}`
      );
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading leave requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_hod: { label: "Pending HOD Approval", color: "bg-yellow-100 text-yellow-800" },
      pending_director: { label: "Pending Director Approval", color: "bg-blue-100 text-blue-800" },
      approved: { label: "Approved", color: "bg-green-100 text-green-800" },
      rejected_by_hod: { label: "Rejected by HOD", color: "bg-red-100 text-red-800" },
      rejected_by_director: { label: "Rejected by Director", color: "bg-red-100 text-red-800" }
    };

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Leave Requests</h1>

      {leaveRequests.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No leave requests found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Leave Type</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">End Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Days</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Applied On</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{request.leaveTypeId?.name || "N/A"}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(request.startDate)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(request.endDate)}</td>
                    <td className="px-6 py-4 text-sm font-medium">{request.totalDays}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          const details = `
Leave Type: ${request.leaveTypeId?.name || "N/A"}
Start Date: ${formatDate(request.startDate)}
End Date: ${formatDate(request.endDate)}
Total Days: ${request.totalDays}
Description: ${request.description}
Status: ${request.status}
${request.hodApproval?.comments ? `HOD Comments: ${request.hodApproval.comments}` : ""}
${request.directorApproval?.comments ? `Director Comments: ${request.directorApproval.comments}` : ""}
                          `.trim();
                          alert(details);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyLeaveStatus;





