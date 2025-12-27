import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

function ApplyLeave() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const employeeId = user._id || user.id;

  // Form States
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  // Half Day States
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState("morning");

  // Period/Adjustment States
  const [periods, setPeriods] = useState([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [periodAdjustments, setPeriodAdjustments] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});

  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [leaveBalance, setLeaveBalance] = useState([]);

  // Get selected leave type details
  const selectedLeaveTypeData = useMemo(() => {
    return leaveTypes.find(lt => lt._id === selectedLeaveType);
  }, [leaveTypes, selectedLeaveType]);

  // Get selected leave type balance
  const selectedLeaveBalance = useMemo(() => {
    return leaveBalance.find(lb => lb.leaveTypeId === selectedLeaveType) || null;
  }, [leaveBalance, selectedLeaveType]);

  // Calculate leave stats for selected type based on effect (ADD vs DEDUCT)
  const selectedLeaveStats = useMemo(() => {
    if (!selectedLeaveBalance || !selectedLeaveTypeData) return null;
    
    const requestingDays = calculateDays();
    const effect = selectedLeaveTypeData.leaveEffect; // "ADD" or "DEDUCT"

    if (effect === "DEDUCT") {
        const total = selectedLeaveBalance.totalLeaves ?? 0;
        const remaining = selectedLeaveBalance.remainingLeaves ?? 0;
        const used = Math.max(total - remaining, 0);
        const willRemain = remaining - requestingDays;
        
        return { 
            type: "DEDUCT",
            used, 
            remaining, 
            total, 
            willRemain, 
            requestingDays,
            isInsufficient: willRemain < 0 
        };
    } else {
        // ADD type (e.g., On-Duty)
        // For ADD types, we usually track how many are taken. 'usedLeaves' should be available from API.
        // If not, we assume 0. totalLeaves might not be relevant or could be a cap.
        const used = selectedLeaveBalance.usedLeaves ?? 0;
        const willBeTotalUsed = used + requestingDays;

        return {
            type: "ADD",
            used,
            willBeTotalUsed,
            requestingDays,
            isInsufficient: false // Usually no hard limit for ADD types unless specified
        };
    }
  }, [selectedLeaveBalance, selectedLeaveTypeData, startDate, endDate, isHalfDay]);

  // Load initial data
  useEffect(() => {
    loadLeaveTypes();
    loadLeaveBalance();
  }, [employeeId]);

  // ... (loadPeriods effect remains same) ...
  useEffect(() => {
    const effectiveEndDate = isHalfDay ? startDate : endDate;
    if (
      (user.role === "teaching" || user.role === "hod") &&
      startDate &&
      effectiveEndDate &&
      startDate <= effectiveEndDate
    ) {
      loadPeriods(startDate, effectiveEndDate);
    } else {
      setPeriods([]);
      setPeriodAdjustments([]);
    }
  }, [startDate, endDate, isHalfDay, user.role]);

  // ... (isCasualLeave function remains same) ...
  const isCasualLeave = () => {
    const lt = leaveTypes.find((t) => t._id === selectedLeaveType);
    return lt?.name.toLowerCase().includes("casual");
  };

  // ... (filteredAdjustments memo remains same) ...
  const filteredAdjustments = useMemo(() => {
    if (!isHalfDay) return periodAdjustments;
    return periodAdjustments.filter((p) => {
      const pNum = parseInt(p.period);
      return halfDaySession === "morning" ? pNum <= 3 : pNum > 3;
    });
  }, [periodAdjustments, isHalfDay, halfDaySession]);

  const loadLeaveTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaveType/list");
      const userRole = user.role?.toLowerCase();
      // Ensure your API returns 'leaveEffect' field
      setLeaveTypes(res.data.filter((lt) => lt.roles?.includes(userRole)));
    } catch (err) {
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
      console.error(err);
    }
  };

  const loadPeriods = async (start, end) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/periods/${employeeId}/${start}/${end}`
      );
      const fetchedPeriods = res.data.periods || [];
      setPeriods(fetchedPeriods);
      setAvailableSubstitutes(res.data.availableSubstitutes || []);

      const uniqueClasses = [
        ...new Set(
          fetchedPeriods.map((p) => ({ dept: p.departmentId, class: p.className }))
        ),
      ];
      const subjectsData = {};
      for (const item of uniqueClasses) {
        try {
          const subRes = await axios.get(
            `http://localhost:5000/api/subject/${item.dept}/${item.class}/all`
          );
          subRes.data.forEach((sub) => {
            subjectsData[sub._id] = sub.subjectName;
          });
        } catch (e) {
          console.error(e);
        }
      }
      setSubjectsMap(subjectsData);

      setPeriodAdjustments(
        fetchedPeriods.map((p) => ({
          ...p,
          substituteFacultyId: null,
          status: "pending",
        }))
      );
    } catch (err) {
      setPeriods([]);
      setPeriodAdjustments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSubstitute = (originalIndex, substituteId) => {
    const updated = [...periodAdjustments];
    updated[originalIndex].substituteFacultyId = substituteId;
    updated[originalIndex].status = substituteId ? "adjusted" : "pending";
    setPeriodAdjustments(updated);
  };

  // Helper function for calculateDays needs to be defined inside or outside
  function calculateDays() { // Made this a regular function to hoist or define before usage
    if (isHalfDay) return 0.5;
    if (startDate && endDate && startDate <= endDate) {
      const diff = Math.abs(new Date(endDate) - new Date(startDate));
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmergency = description.toLowerCase().includes("emergency");

    // Logic: Only block submission if DEDUCT type and insufficient balance
    if (selectedLeaveStats?.type === "DEDUCT" && selectedLeaveStats.isInsufficient) {
      setMessage({
        type: "error",
        text: `Insufficient leave balance! You only have ${selectedLeaveStats.remaining} days remaining.`
      });
      return;
    }

    if ((user.role === "teaching" || user.role === "hod") && !isEmergency) {
      const unadjusted = filteredAdjustments.filter((p) => !p.substituteFacultyId);
      if (unadjusted.length > 0) {
        setMessage({
          type: "error",
          text: `Please adjust all ${unadjusted.length} periods for the ${halfDaySession} session.`,
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
        endDate: isHalfDay ? startDate : endDate,
        description,
        isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : null,
        totalDays: calculateDays(),
        periodAdjustments:
          user.role === "teaching" || user.role === "hod"
            ? filteredAdjustments
            : [],
      };

      await axios.post("http://localhost:5000/api/leave-request/apply", payload);
      setMessage({ type: "success", text: "Leave request submitted successfully!" });
      loadLeaveBalance();
      setSelectedLeaveType("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setIsHalfDay(false);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Submission failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Apply for Leave</h1>

      {/* Selected Leave Type Balance Display */}
      {selectedLeaveType && selectedLeaveStats && (
        <div className={`mb-8 p-6 border-2 rounded-2xl shadow-xl ${
            selectedLeaveStats.type === "DEDUCT" 
            ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        }`}>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
            📊 {selectedLeaveTypeData?.name} Status
            <span className="text-xs px-2 py-1 bg-white rounded-full border text-gray-500 uppercase">
                {selectedLeaveStats.type === "DEDUCT" ? "Limited Allowance" : "Tracking Only"}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Logic for DEDUCT Type (e.g., Casual Leave) */}
            {selectedLeaveStats.type === "DEDUCT" && (
                <>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md">
                        <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">Leaves Used</p>
                        <p className="text-3xl font-black text-red-600 mt-2">{selectedLeaveStats.used}</p>
                        <p className="text-xs text-gray-500">days consumed</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md">
                        <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">Remaining Balance</p>
                        <p className="text-3xl font-black text-blue-600 mt-2">{selectedLeaveStats.remaining}</p>
                        <p className="text-xs text-gray-500">days available</p>
                    </div>
                    <div className={`text-center p-4 rounded-xl shadow-md ${
                        !selectedLeaveStats.isInsufficient 
                            ? 'bg-white border-2 border-green-200' 
                            : 'bg-red-50 border-2 border-red-200'
                    }`}>
                        <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">
                            After Request ({selectedLeaveStats.requestingDays} days)
                        </p>
                        <p className={`text-3xl font-black mt-2 ${
                            !selectedLeaveStats.isInsufficient ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {selectedLeaveStats.willRemain}
                        </p>
                        <p className={`text-xs mt-1 ${
                            !selectedLeaveStats.isInsufficient ? 'text-green-700' : 'text-red-700 font-bold'
                        }`}>
                            {!selectedLeaveStats.isInsufficient ? 'Remaining' : 'INSUFFICIENT!'}
                        </p>
                    </div>
                </>
            )}

            {/* Logic for ADD Type (e.g., On Duty / Comp Off) */}
            {selectedLeaveStats.type === "ADD" && (
                <>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md md:col-span-1">
                        <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">Current Usage</p>
                        <p className="text-3xl font-black text-indigo-600 mt-2">{selectedLeaveStats.used}</p>
                        <p className="text-xs text-gray-500">days taken this year</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl shadow-md md:col-span-2 border-2 border-indigo-100">
                        <p className="text-sm text-gray-600 uppercase font-bold tracking-wide">
                            Projected Total Usage
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                             <span className="text-2xl font-bold text-gray-400">{selectedLeaveStats.used}</span>
                             <span className="text-xl text-gray-400">+</span>
                             <span className="text-2xl font-bold text-blue-600">{selectedLeaveStats.requestingDays} (Request)</span>
                             <span className="text-xl text-gray-400">=</span>
                             <span className="text-4xl font-black text-indigo-700">{selectedLeaveStats.willBeTotalUsed}</span>
                        </div>
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Days total after this request</p>
                    </div>
                </>
            )}

          </div>

          {selectedLeaveStats.type === "DEDUCT" && selectedLeaveStats.isInsufficient && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 font-semibold text-center">
              ⚠️ You don't have enough remaining leaves for this request!
            </div>
          )}
        </div>
      )}

      {/* Grid of All Leave Balances - Optional, simplified for view */}
      {leaveBalance.length > 0 && !selectedLeaveType && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {leaveBalance.map((lb, i) => {
                // Find matching leave type definition to check effect
                const def = leaveTypes.find(lt => lt._id === lb.leaveTypeId);
                const isDeduct = def?.leaveEffect === "DEDUCT";
                const total = lb.totalLeaves ?? 0;
                const remaining = lb.remainingLeaves ?? 0;
                const used = lb.usedLeaves ?? (total - remaining);

                return (
                    <div key={i} className="p-4 rounded-xl border bg-gray-50 border-gray-100 hover:shadow-md cursor-pointer" onClick={() => setSelectedLeaveType(lb.leaveTypeId)}>
                        <p className="text-xs font-bold uppercase text-gray-500 mb-2">{lb.leaveTypeName}</p>
                        {isDeduct ? (
                            <>
                                <p className="text-2xl font-black text-gray-800">{remaining}</p>
                                <p className="text-xs text-gray-500">days remaining</p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl font-black text-gray-800">{used}</p>
                                <p className="text-xs text-gray-500">days taken</p>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-xl mb-6 border-2 ${message.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700">Leave Type *</label>
            <select
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-400"
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              required
            >
              <option value="">-- Select Leave Type --</option>
              {leaveTypes.map((lt, i) => (
                <option key={i} value={lt._id}>{lt.name}</option>
              ))}
            </select>
          </div>

          {/* ... (Date inputs and half-day logic remain exactly as before) ... */}
          {/* Re-implementing simplified date inputs for brevity in this response */}
           {isCasualLeave() && (
            <div className="col-span-2 md:col-span-1 flex items-end pb-1">
              <div className="flex items-center gap-4 bg-orange-50 p-2 rounded-lg border border-orange-200 w-full">
                <label className="flex items-center cursor-pointer ml-2">
                  <input type="checkbox" checked={isHalfDay} onChange={(e) => setIsHalfDay(e.target.checked)} className="w-4 h-4" />
                  <span className="ml-2 text-sm font-bold">Half Day</span>
                </label>
                {isHalfDay && (
                   <div className="flex bg-white rounded border overflow-hidden ml-auto">
                     <button type="button" onClick={() => setHalfDaySession("morning")} className={`px-3 py-1 text-xs ${halfDaySession === "morning" ? "bg-blue-600 text-white" : ""}`}>Morning</button>
                     <button type="button" onClick={() => setHalfDaySession("afternoon")} className={`px-3 py-1 text-xs ${halfDaySession === "afternoon" ? "bg-blue-600 text-white" : ""}`}>Afternoon</button>
                   </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">{isHalfDay ? "Date *" : "Start Date *"}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3" required />
          </div>
          {!isHalfDay && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">End Date *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3" required />
            </div>
          )}
        </div>

        {/* ... (Period adjustment table logic remains exactly as before) ... */}
        {filteredAdjustments.length > 0 && (
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Required Adjustments</h3>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 uppercase text-gray-500 font-bold">
                            <tr>
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3">Class & Subject</th>
                                <th className="px-4 py-3">Assign Substitute</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredAdjustments.map((p, idx) => {
                                const originalIdx = periodAdjustments.findIndex(orig => orig.period === p.period && orig.date === p.date);
                                return (
                                    <tr key={idx}>
                                        <td className="px-4 py-3 font-bold">P{p.period}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{p.className}</div>
                                            <div className="text-xs text-gray-500">{subjectsMap[p.subjectId] || "Loading..."}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select 
                                                className="w-full border rounded p-1.5 bg-white"
                                                value={p.substituteFacultyId || ""}
                                                onChange={(e) => updateSubstitute(originalIdx, e.target.value)}
                                            >
                                                <option value="">-- Select Faculty --</option>
                                                {availableSubstitutes.map((s, si) => (
                                                    <option key={si} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Reason *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3" rows="3" required />
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
            <div className="text-xl font-bold text-gray-800">Requesting: <span className="text-blue-600 text-2xl">{calculateDays()} Day(s)</span></div>
            <button 
                type="submit" 
                disabled={loading || (selectedLeaveStats?.isInsufficient)}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${loading || selectedLeaveStats?.isInsufficient ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}
            >
                {loading ? "Submitting..." : "Submit Application"}
            </button>
        </div>
      </form>
    </div>
  );
}

export default ApplyLeave;