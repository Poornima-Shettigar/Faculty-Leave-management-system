import React, { useState, useEffect } from "react";
import axios from "axios";

function ApplyLeave() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeId = user._id || user.id;

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [periods, setPeriods] = useState([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [periodAdjustments, setPeriodAdjustments] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({}); // Map to store subjects by ID
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [leaveBalance, setLeaveBalance] = useState([]);

  // Load leave types and balance
  useEffect(() => {
    loadLeaveTypes();
    loadLeaveBalance();
  }, [employeeId]);

  // Load periods when dates change (for teaching staff)
  useEffect(() => {
    if (user.role === "teaching" && startDate && endDate && startDate <= endDate) {
      loadPeriods();
    } else {
      setPeriods([]);
      setPeriodAdjustments([]);
    }
  }, [startDate, endDate, user.role]);

  const loadLeaveTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaveType/list");
      const userRole = user.role?.toLowerCase();
      const filtered = res.data.filter(
        (lt) => lt.roles && lt.roles.includes(userRole)
      );
      setLeaveTypes(filtered);
    } catch (err) {
      console.error("Error loading leave types:", err);
      setMessage({ type: "error", text: "Failed to load leave types" });
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/leaveType/faculty/${employeeId}/leaves`
      );
      setLeaveBalance(res.data || []);
    } catch (err) {
      console.error("Error loading leave balance:", err);
    }
  };

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/periods/${employeeId}/${startDate}/${endDate}`
      );
      const fetchedPeriods = res.data.periods || [];
      setPeriods(fetchedPeriods);
      setAvailableSubstitutes(res.data.availableSubstitutes || []);
      
      // Fetch subjects for all unique classes
      const uniqueClasses = [...new Set(fetchedPeriods.map(p => ({ dept: p.departmentId, class: p.className })))];
      const subjectsData = {};
      
      for (const { dept, class: className } of uniqueClasses) {
        try {
          // Fetch all subjects for the class (all semesters)
          const subRes = await axios.get(`http://localhost:5000/api/subject/${dept}/${className}/all`);
          subRes.data.forEach(sub => {
            subjectsData[sub._id] = sub.subjectName;
          });
        } catch (err) {
          console.error(`Error loading subjects for ${className}:`, err);
        }
      }
      setSubjectsMap(subjectsData);
      
      // Initialize period adjustments
      const adjustments = fetchedPeriods.map((p) => ({
        ...p,
        substituteFacultyId: null,
        status: "pending"
      }));
      setPeriodAdjustments(adjustments);
    } catch (err) {
      console.error("Error loading periods:", err);
      setPeriods([]);
      setPeriodAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSubstitute = (index, substituteId) => {
    const updated = [...periodAdjustments];
    updated[index].substituteFacultyId = substituteId;
    updated[index].status = substituteId ? "adjusted" : "pending";
    setPeriodAdjustments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!selectedLeaveType || !startDate || !endDate || !description.trim()) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setMessage({ type: "error", text: "End date must be after start date" });
      return;
    }

    // For teaching staff, check if all periods are adjusted
    if (user.role === "teaching" && periods.length > 0) {
      const unadjustedPeriods = periodAdjustments.filter(
        p => !p.substituteFacultyId || p.status !== "adjusted"
      );
      if (unadjustedPeriods.length > 0) {
        setMessage({ 
          type: "error", 
          text: `Please assign substitute faculty for all ${unadjustedPeriods.length} pending period(s) before submitting.` 
        });
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        employeeId,
        leaveTypeId: selectedLeaveType,
        startDate,
        endDate,
        description: description.trim(),
        periodAdjustments: user.role === "teaching" ? periodAdjustments : []
      };

      const res = await axios.post(
        "http://localhost:5000/api/leave-request/apply",
        payload
      );

      setMessage({
        type: "success",
        text: "Leave request submitted successfully!"
      });

      // Reset form
      setSelectedLeaveType("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setPeriodAdjustments([]);
      setPeriods([]);
      loadLeaveBalance();

      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit leave request"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeName = (id) => {
    const lt = leaveTypes.find((t) => t._id === id);
    return lt ? lt.name : "";
  };

  const getRemainingLeaves = (leaveTypeId) => {
    const balance = leaveBalance.find((b) => b.leaveTypeId === leaveTypeId);
    return balance ? balance.remainingLeaves : 0;
  };

  const calculateDays = () => {
    if (startDate && endDate && startDate <= endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Apply for Leave</h1>

      {/* Leave Balance Card */}
      {leaveBalance.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Leave Balance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {leaveBalance.map((leave) => (
              <div key={leave.leaveTypeId} className="bg-white p-3 rounded">
                <div className="text-gray-600">{leave.leaveTypeName}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {leave.remainingLeaves}
                </div>
                <div className="text-xs text-gray-500">remaining</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "error"
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-green-100 text-green-800 border border-green-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        {/* Leave Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Leave Type</option>
            {leaveTypes.map((lt) => {
              const remaining = getRemainingLeaves(lt._id);
              return (
                <option key={lt._id} value={lt._id}>
                  {lt.name} ({remaining} remaining)
                </option>
              );
            })}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Total Days */}
        {calculateDays() > 0 && (
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <span className="text-sm text-gray-600">Total Days: </span>
              <span className="text-lg font-semibold text-gray-900">
                {calculateDays()} day(s)
              </span>
              {selectedLeaveType && (
                <span className="ml-4 text-sm text-gray-600">
                  (Remaining: {getRemainingLeaves(selectedLeaveType)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description/Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide a reason for your leave request..."
            required
          />
        </div>

        {/* Period Adjustments (Teaching Staff Only) */}
        {user.role === "teaching" && (
          <div className="mb-6">
            {loading && startDate && endDate ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">Loading your scheduled periods...</p>
              </div>
            ) : periods.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Period Adjustments Required
                </h3>
                {(() => {
                  const adjustedCount = periodAdjustments.filter(p => p.substituteFacultyId && p.status === "adjusted").length;
                  const pendingCount = periods.length - adjustedCount;
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ You have {periods.length} period(s) scheduled during your leave period.
                        </p>
                        <div className="flex gap-4 text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Adjusted: {adjustedCount}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Pending: {pendingCount}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Please assign substitute faculty for each period. Leave requests cannot be submitted until all periods are adjusted.
                      </p>
                    </div>
                  );
                })()}
                
                {/* Group periods by date */}
                {(() => {
                  const periodsByDate = {};
                  periodAdjustments.forEach((period, index) => {
                    if (!periodsByDate[period.date]) {
                      periodsByDate[period.date] = [];
                    }
                    periodsByDate[period.date].push({ ...period, index });
                  });

                  return Object.keys(periodsByDate).sort().map((date) => {
                    const datePeriods = periodsByDate[date];
                    const dateObj = new Date(date);
                    const formattedDate = dateObj.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    });

                    return (
                      <div key={date} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-600 text-white px-4 py-3">
                          <h4 className="font-semibold">{formattedDate}</h4>
                          <p className="text-sm text-blue-100">
                            {datePeriods.length} period(s) scheduled
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Class</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Assign Substitute Faculty</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {datePeriods.map((period) => {
                                const subjectName = subjectsMap[period.subjectId] || "N/A";
                                const isAdjusted = period.substituteFacultyId && period.status === "adjusted";
                                
                                return (
                                  <tr key={period.index} className={isAdjusted ? "bg-green-50" : "bg-white hover:bg-gray-50"}>
                                    <td className="px-4 py-3 text-sm font-medium">
                                      Period {period.period}
                                    </td>
                                    <td className="px-4 py-3 text-sm">{period.className}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{subjectName}</td>
                                    <td className="px-4 py-3">
                                      <select
                                        value={period.substituteFacultyId || ""}
                                        onChange={(e) => updateSubstitute(period.index, e.target.value)}
                                        className={`w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 ${
                                          isAdjusted 
                                            ? "border-green-300 bg-white" 
                                            : "border-red-300 bg-red-50"
                                        }`}
                                      >
                                        <option value="">-- Select Substitute --</option>
                                        {availableSubstitutes.map((sub) => (
                                          <option key={sub._id} value={sub._id}>
                                            {sub.name} ({sub.email})
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {isAdjusted ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          ✓ Assigned
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
                    );
                  });
                })()}
              </>
            ) : user.role === "teaching" && startDate && endDate && !loading ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  ✓ No periods scheduled during your leave period. You can proceed with the leave request.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedLeaveType("");
              setStartDate("");
              setEndDate("");
              setDescription("");
              setPeriodAdjustments([]);
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplyLeave;

