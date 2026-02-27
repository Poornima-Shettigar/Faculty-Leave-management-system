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
  const [filter, setFilter] = useState("all");
  const [rejectModeForId, setRejectModeForId] = useState(null);

  // Advanced Filter States
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    if (directorId) {
      loadAllRequests();
      loadLeaveTypes();
    }
  }, [directorId]);

  const loadLeaveTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaveType/list");
      setLeaveTypes(res.data || []);
    } catch (err) {
      console.error("Error loading leave types:", err);
    }
  };

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/director/all/${directorId}`
      );
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // Rule: director must not approve if more than 1 day has passed after leave end day
  const canDirectorApprove = (startDate) => {
    if (!startDate) return false;

    const start = new Date(startDate);
    const today = new Date();

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return start.getTime() >= today.getTime();
  };

  const handleAction = async (requestId, action, request) => {
    if (action === "reject" && !comments.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    if (action === "approve") {
      const allowed = canDirectorApprove(request.endDate);
      if (!allowed) {
        alert(
          "You cannot approve this leave. More than one day has passed since the leave ended."
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Are you sure you want to ${action} this leave request?`
      )
    )
      return;

    try {
      setActionLoading(true);
      await axios.put(
        `http://localhost:5000/api/leave-request/director/action/${requestId}`,
        {
          action,
          comments: action === "reject" ? comments.trim() : "",
          directorId,
        }
      );

      setSelectedRequest(null);
      setComments("");
      setRejectModeForId(null);
      loadAllRequests();
      alert(
        `Leave request ${action === "approve" ? "approved" : "rejected"
        } successfully`
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process request");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      "Approved by HOD": {
        label: "HOD APPROVED",
        style: "bg-blue-100 text-blue-800 border-blue-200",
      },
      "Pending Director Approval": {
        label: "PENDING",
        style: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      "Approved by Director": {
        label: "APPROVED",
        style: "bg-green-100 text-green-800 border-green-200",
      },
      "Rejected by Director": {
        label: "REJECTED",
        style: "bg-red-100 text-red-800 border-red-200",
      },
    };
    const current = config[status] || config["Pending Director Approval"];
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${current.style}`}
      >
        {current.label}
      </span>
    );
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "N/A";

  const filteredRequests = leaveRequests.filter((req) => {
    // 1. Basic Status Filter
    let matchesStatus = true;
    if (filter === "pending") matchesStatus = (req.status === "Approved by HOD" || req.status === "Pending Director Approval");
    else if (filter === "approved") matchesStatus = (req.status === "Approved by Director");
    else if (filter === "rejected") matchesStatus = (req.status === "Rejected by Director");

    if (!matchesStatus) return false;

    // 2. Month & Year Filter
    const leaveDate = new Date(req.startDate);
    if (monthFilter && (leaveDate.getMonth() + 1).toString() !== monthFilter) return false;
    if (yearFilter && leaveDate.getFullYear().toString() !== yearFilter) return false;

    // 3. Leave Type Filter
    if (typeFilter && req.leaveTypeId?._id !== typeFilter) return false;

    // 4. Name Search
    if (searchTerm && !req.employeeId?.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  // Helper: check substitute acceptance status for a request
  const getSubstituteStatus = (request) => {
    const adjs = request.periodAdjustments || [];
    if (adjs.length === 0) return { total: 0, accepted: 0, allAccepted: true };
    const accepted = adjs.filter(a => a.substituteApproval?.status === "approved").length;
    return { total: adjs.length, accepted, allAccepted: accepted === adjs.length };
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading leave records...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Faculty Leave Management
        </h1>
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm capitalize transition ${filter === f
                ? "bg-white shadow-sm text-blue-600 font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Month</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Leave Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {leaveTypes.map(lt => (
              <option key={lt._id} value={lt._id}>{lt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Search Faculty</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="w-full border-gray-200 rounded-xl text-sm focus:ring-blue-500 placeholder:text-gray-300"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">
            No {filter !== "all" ? filter : ""} leave requests found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRequests.map((request) => {
            const isSelected = selectedRequest?._id === request._id;
            const canApprove = canDirectorApprove(request.startDate);
            const isRejectMode = rejectModeForId === request._id;
            const isPending = request.status === "Approved by HOD" || request.status === "Pending Director Approval";

            return (
              <div
                key={request._id}
                className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.employeeId?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {request.employeeId?.departmentType?.departmentName ||
                          "General"}{" "}
                        • {request.leaveTypeId?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(request.status)}
                      {/* Substitute acceptance summary badge */}
                      {isPending && (() => {
                        const { total, accepted, allAccepted } = getSubstituteStatus(request);
                        if (total === 0) return (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                            No substitutes required
                          </span>
                        );
                        return allAccepted ? (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                            ✓ All {total} substitute(s) confirmed
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                            ⏳ {accepted}/{total} substitutes confirmed
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-50 text-sm">
                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">
                        Duration
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatDate(request.startDate)} -{" "}
                        {formatDate(request.endDate)}
                      </p>
                      <p className="text-blue-600 font-bold">
                        {request.totalDays} Day(s)
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">
                        HOD Recommendation
                      </p>
                      <p className="font-medium text-gray-900">
                        {request.hodApproval?.approvedBy?.name || "N/A"}
                      </p>
                      <p className="text-green-600 text-[11px] font-bold flex items-center gap-1">
                        <span className="text-lg">✓</span> Recommended
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">
                        Applied On
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    {isPending && (
                      <>
                        <div>
                          <p className="text-gray-400 uppercase text-[10px] font-bold">
                            Approval Window
                          </p>
                          <p
                            className={`text-xs font-bold ${canApprove
                              ? "text-green-600"
                              : "text-red-600"
                              }`}
                          >
                            {canApprove
                              ? "Within director approval window"
                              : "Approval window expired"}
                          </p>
                        </div>

                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              if (!canApprove) return;
                              setSelectedRequest(
                                isSelected ? null : request
                              );
                              setRejectModeForId(null);
                              setComments("");
                            }}
                            disabled={!canApprove}
                            className={`text-sm font-bold ${!canApprove
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:underline"
                              }`}
                          >
                            {isSelected ? "Hide Details" : "View & Action"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {isSelected && isPending && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-1 uppercase">
                            Reason for Leave:
                          </p>
                          <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 italic">
                            "{request.description}"
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 mb-1 uppercase">
                            HOD&apos;s Full Remark:
                          </p>
                          <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">
                            {request.hodApproval?.comments ||
                              "No specific comments provided by HOD."}
                          </p>
                        </div>
                      </div>

                      {/* Period adjustments table */}
                      {request.periodAdjustments &&
                        request.periodAdjustments.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                              Substitute Coverage ({request.periodAdjustments.length} periods)
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead className="bg-gray-50 uppercase text-gray-400">
                                  <tr>
                                    <th className="text-left py-2 px-2">Date</th>
                                    <th className="text-left py-2 px-2">Period</th>
                                    <th className="text-left py-2 px-2">Class</th>
                                    <th className="text-left py-2 px-2">Substitute</th>
                                    <th className="text-left py-2 px-2">Sub Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {request.periodAdjustments.map((adjustment, idx) => (
                                    <tr key={idx} className="border-t border-gray-100">
                                      <td className="py-2 px-2">
                                        {formatDate(adjustment.date)}
                                      </td>
                                      <td className="py-2 px-2 font-medium">
                                        Period {adjustment.period}
                                      </td>
                                      <td className="py-2 px-2">
                                        {adjustment.className}
                                      </td>
                                      <td className="py-2 px-2">
                                        {adjustment.substituteFacultyId?.name || "N/A"}
                                      </td>
                                      <td className="py-2 px-2">
                                        {adjustment.substituteApproval?.status === "approved" ? (
                                          <span className="text-green-600 font-bold">✓ Approved</span>
                                        ) : adjustment.substituteApproval?.status === "rejected" ? (
                                          <span className="text-red-600 font-bold">✗ Rejected</span>
                                        ) : (
                                          <span className="text-amber-600 font-bold">Pending</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                      <div className="pt-4 border-t border-gray-200">
                        {/* Substitute confirmation summary before approve */}
                        {(() => {
                          const { total, accepted, allAccepted } = getSubstituteStatus(request);
                          if (total > 0 && allAccepted) return (
                            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                              <span className="text-green-600 text-lg">✓</span>
                              <p className="text-xs text-green-700 font-bold">
                                All {total} substitute faculty member(s) have accepted their assignments.
                                This leave is ready for Director approval.
                              </p>
                            </div>
                          );
                          if (total === 0) return (
                            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs text-blue-700 font-medium">
                                ℹ No substitute arrangement required for this leave.
                              </p>
                            </div>
                          );
                          return null;
                        })()}
                        <div className="flex gap-3 flex-wrap mb-3">
                          <button
                            onClick={() =>
                              handleAction(
                                request._id,
                                "approve",
                                request
                              )
                            }
                            disabled={actionLoading || !canApprove}
                            className={`px-8 py-2.5 rounded-lg text-sm font-bold transition shadow-sm ${actionLoading || !canApprove
                              ? "bg-gray-400 text_WHITE cursor-not-allowed"
                              : "bg-green-600 text_WHITE hover:bg-green-700"
                              }`}
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => {
                              setRejectModeForId(request._id);
                              setComments("");
                            }}
                            disabled={actionLoading}
                            className="bg-red-600 text_WHITE px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                          >
                            {isRejectMode ? "Reject Now" : "Reject"}
                          </button>
                        </div>

                        {isRejectMode && (
                          <>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">
                              Rejection Remarks
                            </label>
                            <textarea
                              value={comments}
                              onChange={(e) =>
                                setComments(e.target.value)
                              }
                              className="w-full border rounded-lg p-3 text-sm mb-3 focus:ring-2 focus:ring-blue-500 bg_WHITE"
                              placeholder="Type reason for rejection here..."
                              rows="2"
                            />
                            <button
                              onClick={() =>
                                handleAction(
                                  request._id,
                                  "reject",
                                  request
                                )
                              }
                              disabled={actionLoading}
                              className="bg-red-600 text_WHITE px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
                            >
                              Confirm Reject
                            </button>
                          </>
                        )}

                        {!canApprove && (
                          <p className="mt-2 text-xs text-orange-600">
                            Note: You cannot approve this leave because more
                            than one day has passed after the leave end date.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(!isPending || !isSelected) && (request.status === "Approved by Director" || request.status === "Rejected by Director") && (
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <p className="text-xs font-bold text-gray-400 mb-1 uppercase">
                        Your Final Remarks:
                      </p>
                      <p className="text-gray-900 font-medium">
                        {request.directorApproval?.comments ||
                          "No remarks provided."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ApproveLeave;
