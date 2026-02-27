import React, { useEffect, useState } from "react";
import axios from "axios";

function MySubstitutionStatus() {
  const [facultyId, setFacultyId] = useState(null);
  const [subs, setSubs] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let id = localStorage.getItem("userId");

    if (!id && storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        id = userObj?.id || userObj?._id;
        console.log("SubstitutionPage: Detected Faculty ID:", id);
      } catch (e) {
        console.error("SubstitutionPage: Error parsing user from localStorage", e);
      }
    }
    setFacultyId(id);
  }, []);

  const [viewMode, setViewMode] = useState("day"); // "day" | "month" | "all"
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
      2,
      "0"
    )}`
  );

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load all substitutions
  const loadSubs = async (fid) => {
    const activeFid = fid || facultyId;
    if (!activeFid) {
      console.warn("SubstitutionPage: No facultyId available for loading");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leave-request/my-substitutions/${activeFid}`
      );
      console.log("SubstitutionPage: Loaded subs count:", res.data?.length);
      setSubs(res.data || []);
    } catch (err) {
      console.error("SubstitutionPage: API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facultyId) {
      loadSubs(facultyId);
    }
  }, [facultyId]);

  // Apply filters whenever subs / viewMode / selectedDate / selectedMonth change
  useEffect(() => {
    let filtered = subs;

    if (viewMode === "day" && selectedDate) {
      const target = new Date(selectedDate).toDateString();
      filtered = subs.filter((s) => {
        const d = new Date(s.date).toDateString();
        return d === target;
      });
    }

    if (viewMode === "month" && selectedMonth) {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10); // 1–12

      filtered = subs.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getFullYear() === year && d.getMonth() + 1 === month
        );
      });
    }

    setFilteredSubs(filtered);
  }, [subs, viewMode, selectedDate, selectedMonth]);

  // ── TIME WINDOW RULE ──────────────────────────────────────────────────
  // Substitute can respond before the leave date OR on the leave date up to 10:00 AM
  const isResponseAllowed = (leaveDateStr) => {
    if (!leaveDateStr) return true;
    const leaveDate = new Date(leaveDateStr);
    leaveDate.setHours(0, 0, 0, 0);
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Before the leave day → always allowed
    if (now < leaveDate) return true;
    // On the leave day, only before 10:00 AM
    if (now.getTime() === leaveDate.getTime() || todayStart.getTime() === leaveDate.getTime()) {
      return now.getHours() < 10;
    }
    // After the leave day → not allowed
    return false;
  };
  // ─────────────────────────────────────────────────────────────────────

  // Handle Approval
  const handleApprove = async (leaveRequestId, periodId, leaveDateStr) => {
    if (!isResponseAllowed(leaveDateStr)) {
      alert("Substitution response time has expired. You can respond only before the leave day or before 10:00 AM on the leave day.");
      return;
    }
    if (!window.confirm("Are you sure you want to approve this substitution period?")) {
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:5000/api/leave-request/substitute/approve/${leaveRequestId}/${periodId}`,
        {
          substituteId: facultyId,
          comments: "Approved via dashboard"
        }
      );

      alert(res.data.message);
      loadSubs();
    } catch (err) {
      console.error("Error approving substitution:", err);
      alert(err.response?.data?.message || "Failed to approve substitution");
    }
  };

  // Handle Rejection
  const handleReject = async (leaveRequestId, periodId, leaveDateStr) => {
    if (!isResponseAllowed(leaveDateStr)) {
      alert("Substitution response time has expired. You can respond only before the leave day or before 10:00 AM on the leave day.");
      return;
    }
    const reason = prompt("Please provide a reason for rejection:");
    if (reason === null) return; // Cancelled

    try {
      const res = await axios.put(
        `http://localhost:5000/api/leave-request/substitute/reject/${leaveRequestId}/${periodId}`,
        {
          substituteId: facultyId,
          comments: reason || "No reason provided"
        }
      );

      alert(res.data.message);
      loadSubs();
    } catch (err) {
      console.error("Error rejecting substitution:", err);
      alert(err.response?.data?.message || "Failed to reject substitution");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium font-sans">Loading your substitutions...</p>
        </div>
      </div>
    );
  }

  if (!facultyId) {
    return (
      <div className="p-8 text-center bg-gray-50 min-h-screen">
        <p className="text-gray-500 text-lg font-medium">
          No logged-in faculty found. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            My Substitutions
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage your assigned substitution periods
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-wrap items-center gap-6">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "day"
              ? "bg-white text-blue-600 shadow-md transform scale-105"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setViewMode("day")}
          >
            Day View
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "month"
              ? "bg-white text-blue-600 shadow-md transform scale-105"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setViewMode("month")}
          >
            Month View
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "all"
              ? "bg-white text-blue-600 shadow-md transform scale-105"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setViewMode("all")}
          >
            Show All
          </button>
        </div>

        {viewMode === "day" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Date:</span>
            <input
              type="date"
              className="border-gray-300 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        {viewMode === "month" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">Month:</span>
            <input
              type="month"
              className="border-gray-300 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white shadow-xl rounded-3xl p-16 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-xl font-medium">
            No substitutions found for the selected {viewMode}.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Date & Day</th>
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Class / Period</th>
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Faculty</th>
                  <th className="px-8 py-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold">{formatDate(s.date)}</span>
                        <span className="text-blue-500 text-xs font-black uppercase tracking-tighter mt-1">{s.day}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-bold">{s.className}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-400 text-xs font-medium">Period {s.period}</span>
                          {s.semester && (
                            <>
                              <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                              <span className="text-gray-400 text-xs font-medium">Sem {s.semester}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200">
                          {s.originalFaculty?.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{s.originalFaculty?.name}</span>
                          <span className="text-gray-400 text-xs truncate max-w-[150px]">{s.originalFaculty?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {s.substituteApproval?.status === "approved" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 text-xs font-black uppercase tracking-wider rounded-full ring-1 ring-green-200">
                          Approved
                        </span>
                      ) : s.substituteApproval?.status === "rejected" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider rounded-full ring-1 ring-red-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-600 text-xs font-black uppercase tracking-wider rounded-full ring-1 ring-amber-200 animate-pulse">
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3 transition-opacity">
                        {(s.substituteApproval?.status === "pending" || !s.substituteApproval?.status) && (
                          <>
                            {isResponseAllowed(s.date) ? (
                              <>
                                <button
                                  onClick={() => handleApprove(s.leaveRequestId, s.periodId, s.date)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                                  title="Approve Substitution"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-xs font-bold">Approve</span>
                                </button>
                                <button
                                  onClick={() => handleReject(s.leaveRequestId, s.periodId, s.date)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                                  title="Reject Substitution"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-xs font-bold">Reject</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex flex-col items-center text-center">
                                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider rounded-full ring-1 ring-gray-200">
                                  ⏰ Time Expired
                                </span>
                                <span className="text-[10px] text-gray-400 mt-1 max-w-[140px] leading-tight">
                                  Response only allowed before leave day or before 10:00 AM
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {s.substituteApproval?.status && s.substituteApproval?.status !== "pending" && (
                          <span className="text-gray-300 text-xs italic font-medium">Completed</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default MySubstitutionStatus;
