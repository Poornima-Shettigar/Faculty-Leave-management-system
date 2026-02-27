import React, { useState, useEffect } from "react";
import axios from "axios";

function FacultyPresentDaysReport() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(false);

  // only one user input: holidays in that month
  const [holidays, setHolidays] = useState(0);

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

  const getSummaryValue = (key) => {
    if (!leaveData?.summary) return 0;
    return leaveData.summary[key] || leaveData.summary[`${key}InMonth`] || 0;
  };

  const totalDays = getSummaryValue("daysInMonth");
  const backendWorkingDays = totalDays;//getSummaryValue("workingDays");

  // holidays constrained between 0 and totalDays
  const safeHolidays =
    holidays < 0 ? 0 : holidays > totalDays ? totalDays : holidays;

  // if user has entered holidays, use them; else fall back to backend
  const workingDays =
    totalDays > 0 && safeHolidays > 0
      ? Math.max(totalDays - safeHolidays, 0)
      : backendWorkingDays;

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
        "http://localhost:5000/api/leaveType/department/present-days",
        {
          params: {
            departmentId: selectedDepartment,
            month: selectedMonth,
            year: selectedYear
          }
        }
      );
      setLeaveData(res.data);
      // reset holidays when month/department/year changes
      setHolidays(0);
    } catch (err) {
      console.error(
        "Error fetching present days report:",
        err.response?.data || err
      );
      alert("Failed to load present days report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDepartment) {
      fetchPresentDaysReport();
    }
  }, [selectedDepartment, selectedMonth, selectedYear]);

  const getDepartmentName = () => {
    const dept = departments.find((d) => d._id === selectedDepartment);
    return dept ? dept.departmentName : "";
  };

  // compute present days per faculty using user holidays
  const facultyWithPresent = leaveData?.facultyPresentData?.map((f) => {
    const leaveDays = f.leaveDaysDeducted || 0;
    const present = Math.max(workingDays - leaveDays, 0);
    return { ...f, presentDaysManual: present };
  }) || [];

  const totalPresentDays =
    facultyWithPresent.reduce((sum, f) => sum + f.presentDaysManual, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-extrabold text-green-900 mb-2">
            Faculty Present Days Report
          </h1>
          <p className="text-gray-600">
            Working Days = Days in Month - Holidays (entered by user).
            Present Days = Working Days - Leaves taken (excluding CL/EL/OOD).
            <br />
            <span className="text-green-700 font-bold">
              Note: The report includes approved leaves for the entire month.
              "Leaves Taken (To Date)" includes all leaves up to and including today.
            </span>
          </p>
          {getDepartmentName() && (
            <p className="text-sm text-blue-600 font-semibold mt-2">
              Department: {getDepartmentName()} |{" "}
              {months[selectedMonth - 1]?.label} {selectedYear}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                {departments.map((dept) => (
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
                {months.map((month) => (
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
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* ONLY user holidays input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Total Holidays in Month
              </label>
              <input
                type="number"
                min="0"
                max={totalDays || 31}
                value={holidays}
                onChange={(e) => setHolidays(Number(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. 8"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be between 0 and {totalDays || "days in month"}.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {leaveData && leaveData.summary && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl shadow-lg p-6 mb-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">{totalDays}</div>
                <div className="text-sm mt-1">Days in Month</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-orange-200">
                  {safeHolidays}
                </div>
                <div className="text-sm mt-1">Holidays </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-yellow-200">
                  {workingDays}
                </div>
                <div className="text-sm mt-1">Working Days</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-4xl font-extrabold text-yellow-300">
                  {totalPresentDays}
                </div>
                <div className="text-sm mt-1">TOTAL PRESENT DAYS</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculating present days...</p>
          </div>
        )}

        {/* Table */}
        {!loading && facultyWithPresent.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      Days in Month
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-orange-500">
                      Leaves Taken (To Date)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-red-500">
                      Leaves Taken (Full Month)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-green-500">
                      PRESENT DAYS (Full Month)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facultyWithPresent.map((faculty, index) => (
                    <tr
                      key={faculty.facultyId}
                      className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-green-50 transition`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        {faculty.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {faculty.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                          {faculty.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                        {totalDays}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-orange-600 bg-orange-50">
                        {faculty.leaveDaysToDate || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-red-600 bg-red-50">
                        {faculty.leaveDaysDeducted || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-2xl font-extrabold text-green-700 bg-green-50">
                        {faculty.presentDaysManual}
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
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                No Data Available
              </h3>
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
