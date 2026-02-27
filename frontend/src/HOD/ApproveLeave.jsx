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
  const [actionType, setActionType] = useState(null);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [tempAdjustments, setTempAdjustments] = useState([]);
  const [deptFaculty, setDeptFaculty] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadPendingRequests();
    loadDeptFaculty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hodId]);

  const loadDeptFaculty = async () => {
    try {
      if (!user.departmentType) return;
      const res = await axios.get(`http://localhost:5000/api/faculty/getByDept/${user.departmentType._id || user.departmentType}`);
      setDeptFaculty(res.data || []);
    } catch (err) {
      console.error("Error loading department faculty:", err);
    }
  };

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

  const checkSubstitutionStatus = (request) => {
    const adjustments = request.periodAdjustments || [];
    if (adjustments.length === 0) return { allAccepted: true, total: 0, accepted: 0 };
    const total = adjustments.length;
    const accepted = adjustments.filter(
      (p) => p.substituteApproval?.status === "approved"
    ).length;
    return { allAccepted: accepted === total, total, accepted };
  };

  const isHodApprovalAllowed = (request) => {
    if (!request.startDate) return true;
    const leaveStart = new Date(request.startDate);
    leaveStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today <= leaveStart;
  };

  // Is this an emergency request that's already HOD-approved? (post-approval sub arrangement)
  const isEmergencyPostApproval = (request) => {
    const isEmergency = request.leaveTypeId?.name?.toLowerCase().includes("emergency");
    return isEmergency && request.status === "Pending Director Approval";
  };

  const handleAction = async (request, action) => {
    if (!request) return;

    const isEmergency = request.leaveTypeId?.name?.toLowerCase().includes("emergency");

    if (action === "approve") {
      if (!isHodApprovalAllowed(request)) {
        alert("Cannot approve: The leave start date has already passed. HOD can only approve on or before the leave start date.");
        return;
      }
      // For non-emergency: substitution must be complete
      if (!isEmergency) {
        const { allAccepted, total, accepted } = checkSubstitutionStatus(request);
        if (!allAccepted) {
          alert(
            `Cannot approve yet!\n\nAll ${total} substitute faculty member(s) must accept the request first.\nCurrently, only ${accepted} have accepted.`
          );
          return;
        }
      }
      // For emergency leaves: HOD can approve without substitutes
    }

    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) {
      return;
    }

    try {
      setActionLoading(true);

      await axios.put(
        `http://localhost:5000/api/leave-request/hod/action/${request._id}`,
        {
          action,
          comments: comments.trim() || "",
          hodId,
        }
      );

      setSelectedRequest(null);
      setComments("");
      setActionType(null);
      await loadPendingRequests();

      alert(
        `Leave request ${action === "approve" ? "approved and forwarded to Director" : "rejected"} successfully`
      );
    } catch (err) {
      alert(err.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (request) => {
    setEditingRequestId(request._id);
    // Normalise substituteFacultyId to a plain string ID
    // The API returns populated objects {_id, name, email} — we only want the raw ID for editing
    const cloned = (request.periodAdjustments || []).map(adj => ({
      ...adj,
      substituteFacultyId:
        adj.substituteFacultyId?._id?.toString()
        ?? adj.substituteFacultyId?.toString()
        ?? ""
    }));
    setTempAdjustments(cloned);
  };

  const handleAdjustChange = (idx, facultyId) => {
    const updated = [...tempAdjustments];
    updated[idx].substituteFacultyId = facultyId;
    setTempAdjustments(updated);
  };

  const saveAdjustments = async () => {
    try {
      setSaveLoading(true);
      await axios.put(`http://localhost:5000/api/leave-request/hod/update-periods/${editingRequestId}`, {
        periodAdjustments: tempAdjustments,
        hodId
      });
      alert("Substitutes updated successfully. They will receive notifications to confirm.");
      setEditingRequestId(null);
      loadPendingRequests();
    } catch (err) {
      console.error("Error updating adjustments:", err);
      alert(err.response?.data?.message || "Failed to update substitutes");
    } finally {
      setSaveLoading(false);
    }
  };

  // Separate requests into two groups:
  // 1. pendingApproval: requests awaiting HOD action (approve/reject)
  // 2. postApprovalEmergency: emergency leaves already HOD-approved, for substitute arrangement
  const pendingApproval = leaveRequests.filter(r => !isEmergencyPostApproval(r));
  const postApprovalEmergency = leaveRequests.filter(r => isEmergencyPostApproval(r));

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading pending requests...</div>
      </div>
    );
  }

  const renderPeriodTable = (request, editMode) => {
    const adjustments = editMode ? tempAdjustments : (request.periodAdjustments || []);
    if (adjustments.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Period Adjustments ({adjustments.length} period{adjustments.length > 1 ? "s" : ""})
        </div>
        <div className={`${editMode ? "bg-white border-blue-400 border-2" : "bg-blue-50 border-blue-200"} border rounded-lg p-3 overflow-x-auto transition-all`}>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-blue-200 font-bold uppercase tracking-wider text-blue-800">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Day</th>
                <th className="text-left py-2 px-2">Period</th>
                <th className="text-left py-2 px-2">Class</th>
                <th className="text-left py-2 px-2">Substitute Faculty</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj, idx) => (
                <tr key={idx} className="border-b border-blue-100 hover:bg-blue-100/50">
                  <td className="py-2 px-2 font-medium">{formatDate(adj.date)}</td>
                  <td className="py-2 px-2">{adj.day}</td>
                  <td className="py-2 px-2 font-bold text-blue-600">Period {adj.period}</td>
                  <td className="py-2 px-2">{adj.className}</td>
                  <td className="py-2 px-2">
                    {editMode ? (
                      <select
                        value={adj.substituteFacultyId?._id || adj.substituteFacultyId || ""}
                        onChange={(e) => handleAdjustChange(idx, e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-xs"
                      >
                        <option value="">-- Select Substitute --</option>
                        {deptFaculty
                          .filter(f => f._id !== request.employeeId?._id)
                          .map(f => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                          ))
                        }
                      </select>
                    ) : (
                      adj.substituteFacultyId ? (
                        <span className="text-green-700 font-bold">
                          {adj.substituteFacultyId?.name || "Assigned"}
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold italic">Not Assigned</span>
                      )
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {editMode ? (
                      <span className="text-gray-400 italic">Editing...</span>
                    ) : (
                      adj.substituteApproval?.status === "approved" ? (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">✓ Accepted</span>
                      ) : adj.substituteApproval?.status === "rejected" ? (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">✗ Declined</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse">⏳ Waiting</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {editMode && (
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setEditingRequestId(null)}
                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveAdjustments}
                disabled={saveLoading}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 disabled:opacity-50 transition"
              >
                {saveLoading ? "Saving..." : "Save & Request Acceptance"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRequestRow = (request, isPostApproval = false) => {
    const { allAccepted, total, accepted } = checkSubstitutionStatus(request);
    const isEmergency = request.leaveTypeId?.name?.toLowerCase().includes("emergency");
    const approvalDateAllowed = isHodApprovalAllowed(request);
    const canApprove = !isPostApproval && approvalDateAllowed && (isEmergency || allAccepted);
    const isSelected = selectedRequest?._id === request._id;
    const isEditing = editingRequestId === request._id;

    return (
      <React.Fragment key={request._id}>
        <tr className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-900">
            <div className="font-semibold">{request.employeeId?.name || "N/A"}</div>
            <div className="text-gray-500 text-xs">{request.employeeId?.email || ""}</div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            <div className="font-semibold">{request.leaveTypeId?.name || "N/A"}</div>
            {isEmergency && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Emergency</span>
            )}
            {isPostApproval && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold ml-1">HOD Approved</span>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            {formatDate(request.startDate)} — {formatDate(request.endDate)}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            {request.totalDays} day(s)
          </td>
          <td className="px-4 py-3 text-sm">
            {total > 0 ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden min-w-[60px]">
                    <div
                      className={`h-full transition-all ${allAccepted ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${(accepted / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600">{accepted}/{total}</span>
                </div>
                {!allAccepted && (
                  <span className="text-[10px] text-amber-600 font-semibold">⏳ Awaiting substitutes</span>
                )}
                {allAccepted && (
                  <span className="text-[10px] text-green-600 font-semibold">✓ All accepted</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">None assigned</span>
            )}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            {formatDate(request.createdAt)}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            <button
              onClick={() => {
                if (isSelected) {
                  setSelectedRequest(null);
                  setComments("");
                  setActionType(null);
                  setEditingRequestId(null);
                } else {
                  setSelectedRequest(request);
                  setComments("");
                  setActionType(null);
                  setEditingRequestId(null);
                }
              }}
              className="px-3 py-1 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {isSelected ? "Close" : isPostApproval ? "Arrange Substitutes" : "Review"}
            </button>
          </td>
        </tr>

        {isSelected && (
          <tr className="bg-gray-50">
            <td className="px-4 py-4 text-sm text-gray-900" colSpan={7}>

              {/* Post-approval banner for emergency */}
              {isPostApproval && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3 shadow-sm">
                  <span className="text-purple-500 text-xl mt-0.5">✅</span>
                  <div className="flex-1">
                    <div className="font-bold text-purple-800 text-sm">Emergency Leave — Already Approved by You</div>
                    <div className="text-purple-700 text-xs mt-1">
                      This leave has been forwarded to the Director. You can now arrange substitute faculty on behalf of this employee.
                      Assigned substitutes will receive notifications to accept.
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => startEditing(request)}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition whitespace-nowrap"
                    >
                      Assign Substitutes
                    </button>
                  )}
                </div>
              )}

              {/* Date expiry warning (only for pending approval) */}
              {!isPostApproval && !approvalDateAllowed && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <span className="text-red-500 text-xl">🚫</span>
                  <div className="text-red-700 text-xs font-semibold">
                    Approval window has expired. HOD can only approve on or before the leave start date ({formatDate(request.startDate)}).
                    You may still reject the request.
                  </div>
                </div>
              )}

              {/* Substitution Banner (only for pending approval requests) */}
              {!isPostApproval && (() => {
                if (!allAccepted && isEmergency) {
                  return (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 shadow-sm">
                      <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
                      <div className="flex-1">
                        <div className="font-bold text-blue-800 text-sm">Emergency Leave — Approve First, Arrange Substitutes Later</div>
                        <div className="text-blue-700 text-xs mt-1">
                          For emergency leaves, you can approve immediately. After approval, you can still arrange substitutes on behalf of the faculty from this same page.
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Reason */}
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Reason for Leave</div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm italic">
                  "{request.description}"
                </div>
              </div>

              {/* Period Adjustments Table */}
              {request.periodAdjustments && request.periodAdjustments.length > 0 &&
                renderPeriodTable(request, isEditing)
              }

              {/* Assign substitutes button for post-approval (when no periods yet assigned) */}
              {isPostApproval && !isEditing && (!request.periodAdjustments || request.periodAdjustments.length === 0) && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      // Start editing with empty adjustments (HOD will fill in)
                      setEditingRequestId(request._id);
                      setTempAdjustments([]);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition"
                  >
                    + Arrange Substitutes
                  </button>
                </div>
              )}

              {/* Edit substitute button for non-post-approval */}
              {!isPostApproval && !isEditing && (
                <div className="mb-4">
                  {isEmergency && (
                    <button
                      onClick={() => startEditing(request)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
                    >
                      Arrange Substitutes (Optional)
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons — only for non-post-approval */}
              {!isPostApproval && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setActionType("approve");
                        handleAction(request, "approve");
                      }}
                      disabled={actionLoading || !canApprove || isEditing}
                      className={`px-5 py-2 rounded-lg text-sm transition font-bold shadow-md ${actionLoading || !canApprove || isEditing
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                        }`}
                      title={
                        !approvalDateAllowed
                          ? "Approval window has passed"
                          : (!isEmergency && !allAccepted)
                            ? "All substitutes must accept first"
                            : "Approve and forward to Director"
                      }
                    >
                      {actionLoading && actionType === "approve" ? "Processing..." : "✓ Approve & Forward to Director"}
                    </button>

                    <button
                      onClick={() => setActionType("reject")}
                      disabled={actionLoading || isEditing}
                      className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {actionType === "reject" ? "Reject (confirm below)" : "✗ Reject"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedRequest(null);
                        setComments("");
                        setActionType(null);
                        setEditingRequestId(null);
                      }}
                      className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Contextual hint messages */}
                  {!isEmergency && !allAccepted && approvalDateAllowed && (
                    <p className="text-xs text-amber-600 font-semibold">
                      ⚠ Approve is locked until all {total} substitute(s) accept. ({accepted}/{total} done)
                    </p>
                  )}
                  {isEmergency && approvalDateAllowed && (
                    <p className="text-xs text-blue-600 font-semibold">
                      ℹ Emergency leave — you can approve now and arrange substitutes after approval from this same page.
                    </p>
                  )}

                  {/* Rejection comment box */}
                  {actionType === "reject" && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Rejection (required)
                      </label>
                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                        placeholder="Provide a clear reason for rejection..."
                      />
                      <div className="mt-2">
                        <button
                          onClick={() => handleAction(request, "reject")}
                          disabled={actionLoading || comments.trim() === ""}
                          className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {actionLoading ? "Processing..." : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const tableHeader = (
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Leave Type</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date Range</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Days</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Substitution</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Applied On</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
      </tr>
    </thead>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Approve Leave Requests
        </h1>
        <button
          onClick={loadPendingRequests}
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
        >
          ↺ Refresh
        </button>
      </div>

      {/* SECTION 1: Pending Approval Requests */}
      {pendingApproval.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center mb-6">
          <p className="text-gray-500 text-lg">No leave requests pending your approval.</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-lg font-bold text-gray-800">📋 Pending Approval</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Non-emergency leaves appear here only after all substitutes have accepted. Emergency leaves appear immediately.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              {tableHeader}
              <tbody className="divide-y divide-gray-200">
                {pendingApproval.map((request) => renderRequestRow(request, false))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: Post-Approval Emergency Substitute Arrangement */}
      {postApprovalEmergency.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl border border-purple-200 mb-8">
          <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 rounded-t-xl">
            <h2 className="text-lg font-bold text-purple-800">🚨 Emergency Leaves — Arrange Substitutes</h2>
            <p className="text-xs text-purple-600 mt-0.5">
              These emergency leaves have been approved by you and forwarded to the Director.
              You can now arrange substitute faculty on behalf of the employee.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              {tableHeader}
              <tbody className="divide-y divide-gray-200">
                {postApprovalEmergency.map((request) => renderRequestRow(request, true))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApproveLeave;
