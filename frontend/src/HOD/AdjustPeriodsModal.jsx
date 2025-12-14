import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

function AdjustPeriodsModal({ leaveRequest, onClose, onSuccess }) {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const hodId = user._id || user.id;

  const [periodAdjustments, setPeriodAdjustments] = useState([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (leaveRequest) {
      loadSubstitutes();
      // Initialize period adjustments from leave request
      if (leaveRequest.periodAdjustments && leaveRequest.periodAdjustments.length > 0) {
        setPeriodAdjustments(leaveRequest.periodAdjustments.map(pa => ({
          ...pa,
          date: typeof pa.date === "string" ? pa.date : moment(pa.date).format("YYYY-MM-DD")
        })));
      }
    }
  }, [leaveRequest]);

  const loadSubstitutes = async () => {
    try {
      const departmentId = leaveRequest.employeeId?.departmentType?._id || leaveRequest.employeeId?.departmentType;
      const res = await axios.get(`http://localhost:5000/api/faculty/getByDept/${departmentId}`);
      // Filter out the employee who is on leave and check availability
      const substitutes = res.data.filter(f => 
        f._id !== leaveRequest.employeeId?._id && 
        (f.role === "teaching" || f.role === "hod")
      );
      setAvailableSubstitutes(substitutes);
    } catch (err) {
      console.error("Error loading substitutes:", err);
    }
  };

  const updateSubstitute = (index, substituteId) => {
    const updated = [...periodAdjustments];
    updated[index].substituteFacultyId = substituteId;
    updated[index].status = substituteId ? "adjusted" : "pending";
    setPeriodAdjustments(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      await axios.put(
        `http://localhost:5000/api/leave-request/hod/update-periods/${leaveRequest._id}`,
        {
          periodAdjustments: periodAdjustments.map(pa => ({
            ...pa,
            date: moment(pa.date).toDate()
          })),
          hodId
        }
      );

      setMessage({ type: "success", text: "Period adjustments updated successfully!" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Error updating period adjustments:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update period adjustments"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!leaveRequest) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Adjust Period Assignments</h2>
        <p className="text-sm text-gray-600 mb-4">
          Employee: {leaveRequest.employeeId?.name || "N/A"}
        </p>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {periodAdjustments.length > 0 ? (
          <div className="mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50 border-b border-blue-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Day</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Period</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Class</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Subject</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Substitute</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {periodAdjustments.map((adjustment, idx) => {
                    const date = moment(adjustment.date);
                    return (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-2 px-3">{date.format("MMM D, YYYY")}</td>
                        <td className="py-2 px-3">{adjustment.day}</td>
                        <td className="py-2 px-3 font-medium">Period {adjustment.period}</td>
                        <td className="py-2 px-3">{adjustment.className}</td>
                        <td className="py-2 px-3">{adjustment.subjectName || "N/A"}</td>
                        <td className="py-2 px-3">
                          <select
                            value={adjustment.substituteFacultyId?._id || adjustment.substituteFacultyId || ""}
                            onChange={(e) => updateSubstitute(idx, e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Select Substitute --</option>
                            {availableSubstitutes.map((sub) => (
                              <option key={sub._id} value={sub._id}>
                                {sub.name} ({sub.email})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          {adjustment.status === "adjusted" ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              ✓ Adjusted
                            </span>
                          ) : adjustment.status === "not_required" ? (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                              Not Required
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
        ) : (
          <p className="text-gray-500 text-center py-8">No period adjustments needed.</p>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Saving..." : "Save Adjustments"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdjustPeriodsModal;

