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

  useEffect(() => {
    if (directorId) loadAllRequests();
  }, [directorId]);

  const loadAllRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/leave-request/director/all/${directorId}`);
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    if (action === "reject" && !comments.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    if (!window.confirm(`Are you sure you want to ${action} this leave request?`)) return;

    try {
      setActionLoading(true);
      await axios.put(`http://localhost:5000/api/leave-request/director/action/${requestId}`, {
        action,
        comments: comments.trim(),
        directorId
      });

      setSelectedRequest(null);
      setComments("");
      loadAllRequests();
      alert(`Leave request ${action === "approve" ? "approved" : "rejected"} successfully`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process request");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending_director: { label: "PENDING", style: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      approved: { label: "APPROVED", style: "bg-green-100 text-green-800 border-green-200" },
      rejected_by_director: { label: "REJECTED", style: "bg-red-100 text-red-800 border-red-200" },
    };
    const current = config[status] || config.pending_director;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${current.style}`}>
        {current.label}
      </span>
    );
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";

  const filteredRequests = leaveRequests.filter(req => {
    if (filter === "all") return true;
    if (filter === "pending") return req.status === "pending_director";
    if (filter === "approved") return req.status === "approved";
    if (filter === "rejected") return req.status === "rejected_by_director";
    return true;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leave records...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Faculty Leave Management</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm capitalize transition ${
                filter === f ? "bg-white shadow-sm text-blue-600 font-bold" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">No {filter !== 'all' ? filter : ''} leave requests found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRequests.map((request) => (
            <div key={request._id} className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{request.employeeId?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {request.employeeId?.departmentType?.departmentName || "General"} • {request.leaveTypeId?.name}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-50 text-sm">
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold">Duration</p>
                    <p className="font-medium text-gray-900">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
                    <p className="text-blue-600 font-bold">{request.totalDays} Day(s)</p>
                  </div>

                  {/* MODIFIED: Show HOD Name and Status instead of just Remark */}
                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold">HOD Recommendation</p>
                    <p className="font-medium text-gray-900">{request.hodApproval?.approvedBy?.name || "N/A"}</p>
                    <p className="text-green-600 text-[11px] font-bold flex items-center gap-1">
                      <span className="text-lg">✓</span> Recommended
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 uppercase text-[10px] font-bold">Applied On</p>
                    <p className="font-medium text-gray-900">{formatDate(request.createdAt)}</p>
                  </div>

                  <div className="flex items-center">
                    <button 
                      onClick={() => setSelectedRequest(selectedRequest?._id === request._id ? null : request)}
                      className="text-blue-600 hover:underline font-bold text-sm"
                    >
                      {selectedRequest?._id === request._id ? "Hide Details" : "View & Action"}
                    </button>
                  </div>
                </div>

                {selectedRequest?._id === request._id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase">Reason for Leave:</p>
                        <p className="text-gray-700 bg-white p-3 rounded border border-gray-200 italic">"{request.description}"</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase">HOD's Full Remark:</p>
                        <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">
                          {request.hodApproval?.comments || "No specific comments provided by HOD."}
                        </p>
                      </div>
                    </div>

                    {request.status === "pending_director" ? (
                      <div className="pt-4 border-t border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Your Decision Remarks</label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          className="w-full border rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Type approval or rejection reason here..."
                          rows="2"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAction(request._id, "approve")}
                            disabled={actionLoading}
                            className="bg-green-600 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(request._id, "reject")}
                            disabled={actionLoading}
                            className="bg-red-600 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase">Your Final Remarks:</p>
                        <p className="text-gray-900 font-medium">{request.directorApproval?.comments || "No remarks provided."}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApproveLeave;