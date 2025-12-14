import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

function ViewDepartmentLeaves() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hodId = user._id || user.id;

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (hodId) {
      loadLeaveRequests();
    }
  }, [hodId]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/hod/all/${hodId}`
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
    return moment(date).format("MMM D, YYYY");
  };

  const filteredRequests = filterStatus === "all" 
    ? leaveRequests 
    : leaveRequests.filter(req => req.status === filterStatus);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500">Loading leave requests...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Department Leave Requests</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold text-gray-700">Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Requests</option>
          <option value="pending_hod">Pending HOD Approval</option>
          <option value="pending_director">Pending Director Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected_by_hod">Rejected by HOD</option>
          <option value="rejected_by_director">Rejected by Director</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No leave requests found.</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.employeeId?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.employeeId?.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.leaveTypeId?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
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

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Leave Request Details</h2>
            
            <div className="space-y-4">
              <div>
                <strong>Employee:</strong> {selectedRequest.employeeId?.name || "N/A"}
                <br />
                <strong>Email:</strong> {selectedRequest.employeeId?.email || "N/A"}
              </div>
              
              <div>
                <strong>Leave Type:</strong> {selectedRequest.leaveTypeId?.name || "N/A"}
              </div>
              
              <div>
                <strong>Date Range:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                <br />
                <strong>Total Days:</strong> {selectedRequest.totalDays}
              </div>
              
              <div>
                <strong>Description:</strong>
                <p className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.periodAdjustments && selectedRequest.periodAdjustments.length > 0 && (
                <div>
                  <strong>Period Adjustments:</strong>
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                          {selectedRequest.periodAdjustments.map((adjustment, idx) => (
                            <tr key={idx} className="border-b border-blue-200">
                              <td className="py-2 px-3">{formatDate(adjustment.date)}</td>
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.hodApproval?.approvedBy && (
                <div>
                  <strong>HOD Approval:</strong>
                  <p className="text-sm text-gray-600">
                    Approved by: {selectedRequest.hodApproval.approvedBy?.name || "N/A"}
                    <br />
                    {selectedRequest.hodApproval.comments && `Comments: ${selectedRequest.hodApproval.comments}`}
                  </p>
                </div>
              )}

              {selectedRequest.directorApproval?.approvedBy && (
                <div>
                  <strong>Director Approval:</strong>
                  <p className="text-sm text-gray-600">
                    Approved by: {selectedRequest.directorApproval.approvedBy?.name || "N/A"}
                    <br />
                    {selectedRequest.directorApproval.comments && `Comments: ${selectedRequest.directorApproval.comments}`}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewDepartmentLeaves;



