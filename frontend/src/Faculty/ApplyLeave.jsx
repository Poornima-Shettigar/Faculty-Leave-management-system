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
  const [halfDaySession, setHalfDaySession] = useState("morning"); // "morning" or "afternoon"

  // Period/Adjustment States
  const [periods, setPeriods] = useState([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState([]);
  const [periodAdjustments, setPeriodAdjustments] = useState([]);
  const [subjectsMap, setSubjectsMap] = useState({});
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [leaveBalance, setLeaveBalance] = useState([]);

  // Load initial data
  useEffect(() => {
    loadLeaveTypes();
    loadLeaveBalance();
  }, [employeeId]);

  // Load periods when dates change
  useEffect(() => {
    const effectiveEndDate = isHalfDay ? startDate : endDate;
    if ((user.role === "teaching" || user.role === "hod") && startDate && effectiveEndDate && startDate <= effectiveEndDate) {
      loadPeriods(startDate, effectiveEndDate);
    } else {
      setPeriods([]);
      setPeriodAdjustments([]);
    }
  }, [startDate, endDate, isHalfDay, user.role]);

  // Logic: Check if current leave is Casual Leave
  const isCasualLeave = () => {
    const lt = leaveTypes.find((t) => t._id === selectedLeaveType);
    return lt?.name.toLowerCase().includes("casual");
  };

  // Logic: Filter adjustments based on session
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
      setLeaveTypes(res.data.filter((lt) => lt.roles?.includes(userRole)));
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load leave types" });
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/leaveType/faculty/${employeeId}/leaves`);
      setLeaveBalance(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadPeriods = async (start, end) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/leave-request/periods/${employeeId}/${start}/${end}`);
      const fetchedPeriods = res.data.periods || [];
      setPeriods(fetchedPeriods);
      setAvailableSubstitutes(res.data.availableSubstitutes || []);
      
      // Fetch subjects map
      const uniqueClasses = [...new Set(fetchedPeriods.map(p => ({ dept: p.departmentId, class: p.className })))];
      const subjectsData = {};
      for (const item of uniqueClasses) {
        try {
          const subRes = await axios.get(`http://localhost:5000/api/subject/${item.dept}/${item.class}/all`);
          subRes.data.forEach(sub => { subjectsData[sub._id] = sub.subjectName; });
        } catch (e) { console.error(e); }
      }
      setSubjectsMap(subjectsData);
      
      setPeriodAdjustments(fetchedPeriods.map(p => ({
        ...p,
        substituteFacultyId: null,
        status: "pending"
      })));
    } catch (err) {
      setPeriods([]);
      setPeriodAdjustments([]);
    } finally { setLoading(false); }
  };

  const updateSubstitute = (originalIndex, substituteId) => {
    const updated = [...periodAdjustments];
    updated[originalIndex].substituteFacultyId = substituteId;
    updated[originalIndex].status = substituteId ? "adjusted" : "pending";
    setPeriodAdjustments(updated);
  };

  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    if (startDate && endDate && startDate <= endDate) {
      const diff = Math.abs(new Date(endDate) - new Date(startDate));
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmergency = description.toLowerCase().includes("emergency");

    if ((user.role === "teaching" || user.role === "hod") && !isEmergency) {
      const unadjusted = filteredAdjustments.filter(p => !p.substituteFacultyId);
      if (unadjusted.length > 0) {
        setMessage({ type: "error", text: `Please adjust all ${unadjusted.length} periods for the ${halfDaySession} session.` });
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
        periodAdjustments: (user.role === "teaching" || user.role === "hod") ? filteredAdjustments : []
      };

      await axios.post("http://localhost:5000/api/leave-request/apply", payload);
      setMessage({ type: "success", text: "Leave request submitted!" });
      // Reset logic...
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Submission failed" });
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Apply for Leave</h1>

      {/* Leave Balance */}
      {leaveBalance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {leaveBalance.map((lb) => (
            <div key={lb.leaveTypeId} className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
              <p className="text-xs text-blue-600 font-bold uppercase">{lb.leaveTypeName}</p>
              <p className="text-2xl font-black">{lb.remainingLeaves}</p>
            </div>
          ))}
        </div>
      )}

      {message.text && (
        <div className={`p-4 rounded-lg mb-6 border ${message.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Leave Type */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-semibold mb-2">Leave Type *</label>
            <select 
              className="w-full border rounded-lg p-2.5" 
              value={selectedLeaveType} 
              onChange={(e) => setSelectedLeaveType(e.target.value)} 
              required
            >
              <option value="">-- Choose --</option>
              {leaveTypes.map(lt => (
                <option key={lt._id} value={lt._id}>{lt.name}</option>
              ))}
            </select>
          </div>

          {/* Half Day Toggle */}
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

          {/* Dates */}
          <div>
            <label className="block text-sm font-semibold mb-2">{isHalfDay ? "Date *" : "Start Date *"}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border rounded-lg p-2.5" required />
          </div>
          {!isHalfDay && (
            <div>
              <label className="block text-sm font-semibold mb-2">End Date *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border rounded-lg p-2.5" required />
            </div>
          )}
        </div>

        {/* Adjustments Section */}
        {filteredAdjustments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">
              Required Adjustments for {isHalfDay ? halfDaySession.toUpperCase() : "Full Day"}
            </h3>
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
                  {filteredAdjustments.map((p) => {
                    // Find original index to update the correct object in state
                    const originalIdx = periodAdjustments.findIndex(orig => orig.period === p.period && orig.date === p.date);
                    return (
                      <tr key={`${p.date}-${p.period}`} className={p.substituteFacultyId ? "bg-green-50" : ""}>
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
                            {availableSubstitutes.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
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
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg p-2.5" rows="3" placeholder="Explain why..." required />
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <div className="text-lg font-bold">Total Duration: <span className="text-blue-600">{calculateDays()} Day(s)</span></div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ApplyLeave;
