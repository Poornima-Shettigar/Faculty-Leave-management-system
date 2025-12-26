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
  const [actionType, setActionType] = useState(null); // "approve" | "reject" | null

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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAction = async (requestId, action) => {
    if (!confirm(`Are you sure you want to ${action} this leave request?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(
        `http://localhost:5000/api/leave-request/hod/action/${requestId}`,
        {
          action,
          comments: action === "reject" ? comments.trim() : "",
          hodId,
        }
      );

      setSelectedRequest(null);
      setComments("");
      setActionType(null);
      loadPendingRequests();
      alert(
        `Leave request ${
          action === "approve" ? "approved" : "rejected"
        } successfully`
      );
    } catch (err) {
      console.error("Error processing request:", err);
      alert(err.response?.data?.message || "Failed to process request");
    } finally {
      setActionLoading(false);
    }
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Approve Leave Requests
      </h1>

      {leaveRequests.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No pending leave requests.</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Leave Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Date Range
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Total Days
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Applied On
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <React.Fragment key={request._id}>
                    {/* Main row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {request.employeeId?.name || "N/A"}
                        </div>
                        <div className="text-gray-500">
                          {request.employeeId?.email || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">
                          {request.leaveTypeId?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {request.totalDays} day(s)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <button
                          onClick={() => {
                            if (
                              selectedRequest &&
                              selectedRequest._id === request._id
                            ) {
                              setSelectedRequest(null);
                              setComments("");
                              setActionType(null);
                            } else {
                              setSelectedRequest(request);
                              setComments("");
                              setActionType(null);
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                        >
                          {selectedRequest &&
                          selectedRequest._id === request._id
                            ? "Close"
                            : "Action"}
                        </button>
                      </td>
                    </tr>

                    {/* Details row when Action clicked */}
                    {selectedRequest && selectedRequest._id === request._id && (
                      <tr className="bg-gray-50">
                        <td
                          className="px-4 py-4 text-sm text-gray-900"
                          colSpan={6}
                        >
                          {/* Description */}
                          <div className="mb-3">
                            <div className="text-sm text-gray-600 mb-1">
                              Description
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                              {request.description}
                            </div>
                          </div>

                          {/* Period adjustments table (optional) */}
                          {request.periodAdjustments &&
                            request.periodAdjustments.length > 0 && (
                              <div className="mb-4">
                                <div className="text-sm font-semibold text-gray-700 mb-2">
                                  Period Adjustments (
                                  {request.periodAdjustments.length} period(s))
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 overflow-x-auto">
                                  <table className="min-w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-blue-200">
                                        <th className="text-left py-1 px-2">
                                          Date
                                        </th>
                                        <th className="text-left py-1 px-2">
                                          Day
                                        </th>
                                        <th className="text-left py-1 px-2">
                                          Period
                                        </th>
                                        <th className="text-left py-1 px-2">
                                          Class
                                        </th>
                                        <th className="text-left py-1 px-2">
                                          Substitute
                                        </th>
                                        <th className="text-left py-1 px-2">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {request.periodAdjustments.map(
                                        (adjustment, idx) => {
                                          const date = new Date(
                                            adjustment.date
                                          );
                                          const formattedDate =
                                            date.toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            });
                                          return (
                                            <tr
                                              key={idx}
                                              className="border-b border-blue-100"
                                            >
                                              <td className="py-1 px-2">
                                                {formattedDate}
                                              </td>
                                              <td className="py-1 px-2">
                                                {adjustment.day}
                                              </td>
                                              <td className="py-1 px-2 font-medium">
                                                Period {adjustment.period}
                                              </td>
                                              <td className="py-1 px-2">
                                                {adjustment.className}
                                              </td>
                                              <td className="py-1 px-2">
                                                {adjustment.substituteFacultyId ? (
                                                  <span className="text-green-700 font-medium">
                                                    {adjustment
                                                      .substituteFacultyId
                                                      ?.name || "Assigned"}
                                                  </span>
                                                ) : (
                                                  <span className="text-red-600 font-medium">
                                                    Not Assigned
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-1 px-2">
                                                {adjustment.status ===
                                                "adjusted" ? (
                                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                    ✓ Adjusted
                                                  </span>
                                                ) : (
                                                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                    ⚠ Pending
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                          {/* Action buttons + conditional comments */}
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => {
                                  setActionType("approve");
                                  setComments("");
                                  handleAction(request._id, "approve");
                                }}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
                              >
                                {actionLoading && actionType === "approve"
                                  ? "Processing..."
                                  : "Approve"}
                              </button>
                              <button
                                onClick={() => {
                                  // set type to reject, but do not call API yet
                                  setActionType("reject");
                                }}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                              >
                                {actionType === "reject"
                                  ? "Reject (confirm below)"
                                  : "Reject"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setComments("");
                                  setActionType(null);
                                }}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                              >
                                Cancel
                              </button>
                            </div>

                            {/* Show comments only when reject is selected */}
                            {actionType === "reject" && (
                              <div className="mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Comments (required for reject)
                                </label>
                                <textarea
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  rows="3"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                                  placeholder="Add reason for rejection..."
                                />
                                <div className="mt-2">
                                  <button
                                    onClick={() =>
                                      handleAction(request._id, "reject")
                                    }
                                    disabled={
                                      actionLoading || comments.trim() === ""
                                    }
                                    className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                                  >
                                    {actionLoading
                                      ? "Processing..."
                                      : "Confirm Reject"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproveLeave;
