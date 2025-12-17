import React, { useState, useEffect } from "react";
import axios from "axios";

function ApproveLeave() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const directorId = user._id || user.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, [directorId]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/director/pending/${directorId}`
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
      await axios.put(`http://localhost:5000/api/leave-request/director/action/${requestId}`, {
        action,
        comments: comments.trim(),
        directorId
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Employee</div>
                  <div className="font-semibold text-gray-900">
                    {request.employeeId?.name || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.employeeId?.email || ""}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Role: {request.employeeId?.role || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Department</div>
                  <div className="font-semibold text-gray-900">
                    {request.employeeId?.departmentType?.departmentName || "N/A"}
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

              {request.hodApproval?.approvedBy && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800">
                    ✓ Approved by HOD: {request.hodApproval.approvedBy?.name || "N/A"}
                  </div>
                  {request.hodApproval.comments && (
                    <div className="text-sm text-green-700 mt-1">
                      Comments: {request.hodApproval.comments}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Description</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  {request.description}
                </div>
              </div>

              {/* {request.periodAdjustments && request.periodAdjustments.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Period Adjustments</div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    {request.periodAdjustments.length} period(s)  adjusted
                  </div>
                </div>
              )} */}
              {/* {request.periodAdjustments && request.periodAdjustments.length > 0 && (
  <div className="mb-4">
    <div className="text-sm font-medium text-gray-700 mb-2">
      Period Adjustment Status
    </div>

    <div className="space-y-2">
      {request.periodAdjustments.map((pa, index) => {
        let statusText = "Needed";
        let statusColor = "text-red-700";
        let bgColor = "bg-red-50 border-red-200";

        if (pa.status === "adjusted") {
          statusText = "Adjusted";
          statusColor = "text-green-700";
          bgColor = "bg-green-50 border-green-200";
        } else if (pa.status === "not_required") {
          statusText = "Not Required";
          statusColor = "text-gray-700";
          bgColor = "bg-gray-50 border-gray-200";
        }

        return (
          <div
            key={index}
            className={`flex flex-col md:flex-row md:justify-between md:items-center gap-2 p-3 rounded-lg border text-sm ${bgColor}`}
          >
            <div className="text-gray-800">
              <div className="font-semibold">
                {formatDate(pa.date)} ({pa.day})
              </div>
              <div className="text-xs text-gray-600">
                Period {pa.period} | {pa.className}
              </div>
            </div>

            <div className={`font-semibold ${statusColor}`}>
              {statusText}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)} */}
{request.periodAdjustments && request.periodAdjustments.length > 0 && (() => {
  const totalPeriods = request.periodAdjustments.length;

  const adjustedPeriods = request.periodAdjustments.filter(
    pa => pa.status === "adjusted"
  );

  const adjustedCount = adjustedPeriods.length;

  const adjustedWithFaculty = adjustedPeriods.filter(
    pa => pa.substituteFacultyId
  ).length;

  const adjustedWithoutFaculty = adjustedCount - adjustedWithFaculty;

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-700 mb-2">
        Period Adjustment Summary
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-gray-600">Total Periods</div>
          <div className="text-lg font-semibold text-gray-900">
            {totalPeriods}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-gray-600">Adjusted Periods</div>
          <div className="text-lg font-semibold text-green-700">
            {adjustedCount}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-gray-600">Adjusted With Other Faculty</div>
          <div className="text-lg font-semibold text-blue-700">
            {adjustedWithFaculty}
          </div>
        </div>

        {adjustedWithoutFaculty > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-gray-600">Adjusted Without Other Faculty</div>
            <div className="text-lg font-semibold text-yellow-700">
              {adjustedWithoutFaculty}
            </div>
          </div>
        )}
      </div>
    </div>
  );
})()}


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











