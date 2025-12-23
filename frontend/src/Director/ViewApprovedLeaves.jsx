import React, { useState, useEffect } from "react";
import axios from "axios";

function LeaveApprovalDashboard() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const directorId = user._id || user.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (directorId) {
      loadPendingLeaves();
    }
  }, [directorId]);

  // Fetch pending leaves for the director
  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      // Assuming endpoint for pending leaves. Adjust URL as per your backend route
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/director/pending/${directorId}`
      );
      setLeaveRequests(res.data || []);
    } catch (err) {
      console.error("Error loading leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!selectedRequest) return;
    
    try {
      setActionLoading(true);
      const payload = {
        status: status, // "Approved" or "Rejected"
        comments: remarks,
        approvedBy: directorId
      };

      // Adjust endpoint to your specific approval/rejection route
      await axios.put(
        `http://localhost:5000/api/leave-request/director-action/${selectedRequest._id}`,
        payload
      );

      // Refresh list and close modal
      await loadPendingLeaves();
      setSelectedRequest(null);
      setRemarks("");
      alert(`Leave request ${status} successfully.`);
    } catch (err) {
      console.error(`Error ${status} request:`, err);
      alert(`Failed to ${status} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to format dates without external libraries
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading pending requests...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Leave Approval Requests</h1>

      {leaveRequests.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center border border-gray-200">
          <p className="text-gray-500 text-lg">No pending leave requests found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Leave Dates
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.employeeId?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {request.employeeId?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {/* Assuming 'designation' or 'role' field exists */}
                      {request.employeeId?.designation || "Faculty"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {request.employeeId?.departmentType?.departmentName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(request.startDate)} <span className="text-gray-400">to</span> {formatDate(request.endDate)}
                      <div className="text-xs text-gray-500">({request.totalDays} days)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      >
                        View & Act
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Review Request</h3>
              <button 
                onClick={() => { setSelectedRequest(null); setRemarks(""); }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Applicant</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.employeeId?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Leave Type</p>
                  <p className="text-gray-900 font-medium">{selectedRequest.leaveTypeId?.name || "General"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">From</p>
                  <p className="text-gray-900">{formatDate(selectedRequest.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">To</p>
                  <p className="text-gray-900">{formatDate(selectedRequest.endDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Reason / Description</p>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {selectedRequest.description || "No description provided."}
                </div>
              </div>

              {/* Remarks Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Remarks (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows="3"
                  placeholder="Enter comments for approval or rejection..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => handleAction("Rejected")}
                disabled={actionLoading}
                className={`px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  actionLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
              
              <button
                onClick={() => handleAction("Approved")}
                disabled={actionLoading}
                className={`px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  actionLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {actionLoading ? "Processing..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveApprovalDashboard;