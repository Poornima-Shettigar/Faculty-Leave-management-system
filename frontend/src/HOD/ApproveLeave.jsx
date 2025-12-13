import React, { useState, useEffect } from "react";
import axios from "axios";

function ApproveLeave() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hodId = user._id || user.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, [hodId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/hod/pending/${hodId}`
      );
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    if (!confirm(`Are you sure you want to ${action} this leave request?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(`http://localhost:5000/api/leave-request/hod/action/${requestId}`, {
        action,
        comments: comments.trim(),
        hodId
      });

      setSelectedRequest(null);
      setComments("");
      loadPendingRequests();
      alert(`Leave request ${action === "approve" ? "approved" : "rejected"} successfully`);
    } catch (err) {
      console.error("Error processing request:", err);
      alert(err.response?.data?.message || "Failed to process request");
    } finally {
      setActionLoading(false);
    }
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
        <div className="text-gray-500">Loading pending requests...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Approve Leave Requests</h1>

      {leaveRequests.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No pending leave requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white shadow-lg rounded-xl border border-gray-200 p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Employee</div>
                  <div className="font-semibold text-gray-900">
                    {request.employeeId?.name || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.employeeId?.email || ""}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Leave Type</div>
                  <div className="font-semibold text-gray-900">
                    {request.leaveTypeId?.name || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.totalDays} day(s)
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date Range</div>
                  <div className="font-semibold text-gray-900">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Applied: {formatDate(request.createdAt)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  {request.description}
                </div>
              </div>

              {request.periodAdjustments && request.periodAdjustments.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">
                    Period Adjustments ({request.periodAdjustments.length} period(s))
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-300">
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Day</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Period</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Class</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Substitute</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {request.periodAdjustments.map((adjustment, idx) => {
                            const date = new Date(adjustment.date);
                            const formattedDate = date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            });
                            return (
                              <tr key={idx} className="border-b border-blue-200">
                                <td className="py-2 px-3">{formattedDate}</td>
                                <td className="py-2 px-3">{adjustment.day}</td>
                                <td className="py-2 px-3 font-medium">Period {adjustment.period}</td>
                                <td className="py-2 px-3">{adjustment.className}</td>
                                <td className="py-2 px-3">
                                  {adjustment.substituteFacultyId ? (
                                    <span className="text-green-700 font-medium">
                                      {adjustment.substituteFacultyId?.name || "Assigned"}
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-medium">Not Assigned</span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {adjustment.status === "adjusted" ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      ✓ Adjusted
                                    </span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                      ⚠ Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View Details & Respond
                </button>
              </div>

              {selectedRequest && selectedRequest._id === request._id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any comments..."
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction(request._id, "approve")}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(request._id, "reject")}
                      disabled={actionLoading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setComments("");
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApproveLeave;



