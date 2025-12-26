import React, { useEffect, useState } from "react";
import axios from "axios";

function MySubstitutionStatus() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const facultyId = user?._id || user?.id || null;

  const [subs, setSubs] = useState([]);
  const [filteredSubs, setFilteredSubs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Load all substitutions once
  useEffect(() => {
    if (!facultyId) {
      setLoading(false);
      return;
    }

    const loadSubs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/leave-request/my-substitutions/${facultyId}`
        );
        setSubs(res.data || []);
      } catch (err) {
        console.error("Error loading substitutions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSubs();
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

  if (!facultyId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">
          No logged-in faculty found. Please log in again.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading your substitutions...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        My Substitutions
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <button
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "day"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => setViewMode("day")}
          >
            Day-wise
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => setViewMode("month")}
          >
            Month-wise
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              viewMode === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
            onClick={() => setViewMode("all")}
          >
            All
          </button>
        </div>

        {viewMode === "day" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Select date:</span>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}

        {viewMode === "month" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Select month:</span>
            <input
              type="month"
              className="border rounded px-2 py-1 text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">
            No substitutions found for the selected {viewMode}.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Day
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Sem
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Period
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Original Faculty
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {formatDate(s.date)}
                    </td>
                    <td className="px-6 py-4 text-sm">{s.day}</td>
                    <td className="px-6 py-4 text-sm">{s.className}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.semester || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">{s.period}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.originalFaculty?.name} (
                      {s.originalFaculty?.email})
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {s.description || "-"}
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
