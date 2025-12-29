import React, { useState, useEffect } from "react";
import axios from "axios";

function FacultyPresentDaysReport() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  // Helper to safely get summary values
  const getSummaryValue = (key) => {
    if (!leaveData?.summary) return 0;
    return leaveData.summary[key] || leaveData.summary[`${key}InMonth`] || 0;
  };

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/department/list");
      setDepartments(res.data);
      if (res.data.length > 0) {
        setSelectedDepartment(res.data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      alert("Failed to load departments");
    }
  };

  const fetchPresentDaysReport = async () => {
    if (!selectedDepartment) {
      alert("Please select a department");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leaveType/department/present-days`,
        {
          params: {
            departmentId: selectedDepartment,
            month: selectedMonth,
            year: selectedYear
          }
        }
      );
      console.log("API Response:", res.data); // Debug log
      setLeaveData(res.data);
    } catch (err) {
      console.error("Error fetching present days report:", err.response?.data || err);
      alert("Failed to load present days report");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when filters change
  useEffect(() => {
    if (selectedDepartment) {
      fetchPresentDaysReport();
    }
  }, [selectedDepartment, selectedMonth, selectedYear]);

  const getDepartmentName = () => {
    const dept = departments.find(d => d._id === selectedDepartment);
    return dept ? dept.departmentName : "";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-extrabold text-green-900 mb-2">
            Faculty Present Days Report
          </h1>
          <p className="text-gray-600">
            Actual present days = Days in Month - Sundays - Govt Holidays - (Leaves taken except CL/EL)
          </p>
          {getDepartmentName() && (
            <p className="text-sm text-blue-600 font-semibold mt-2">
              Department: {getDepartmentName()} | {months[selectedMonth - 1]?.label} {selectedYear}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              >
                {[2023, 2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards - FIXED for govt holidays */}
        {leaveData && leaveData.summary && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl shadow-lg p-6 mb-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">{getSummaryValue('daysInMonth')}</div>
                <div className="text-sm mt-1">Days in Month</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-orange-200">{getSummaryValue('sundays')}</div>
                <div className="text-sm mt-1">Sundays</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-red-200">
                  {getSummaryValue('govtHolidays')}
                </div>
                <div className="text-sm mt-1">Govt Holidays</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-yellow-200">
                  {getSummaryValue('workingDays')}
                </div>
                <div className="text-sm mt-1">Working Days</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-4xl font-extrabold text-yellow-300">
                  {getSummaryValue('totalPresentDays')}
                </div>
                <div className="text-sm mt-1">TOTAL PRESENT DAYS</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculating present days...</p>
          </div>
        )}

        {/* Table */}
        {!loading && leaveData?.facultyPresentData?.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Days in Month</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-orange-500">Working Days</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-red-500">
                      Leaves Deducted<br className="hidden md:block" />(excl. CL/EL)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-green-500">PRESENT DAYS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaveData.facultyPresentData.map((faculty, index) => (
                    <tr
                      key={faculty.facultyId}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-green-50 transition`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{faculty.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{faculty.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                          {faculty.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">{faculty.daysInMonth}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-orange-700 bg-orange-50">{faculty.workingDays}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-red-600 bg-red-50">{faculty.leaveDaysDeducted}</td>
                      <td className="px-6 py-4 text-center text-2xl font-extrabold text-green-700 bg-green-50">
                        {faculty.presentDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                {selectedDepartment
                  ? "No faculty found in the selected department or no data for this period"
                  : "Please select a department to view the report"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default FacultyPresentDaysReport;
