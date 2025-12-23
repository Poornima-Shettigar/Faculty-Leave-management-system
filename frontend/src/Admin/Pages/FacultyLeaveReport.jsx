import React, { useState, useEffect } from "react";
import axios from "axios";

function FacultyLeaveReport() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
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

  const fetchLeaveReport = async () => {
    if (!selectedDepartment) {
      alert("Please select a department");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/leaveType/department/leave-balance`,
        {
          params: {
            departmentId: selectedDepartment,
            month: selectedMonth,
            year: selectedYear
          }
        }
      );
      setLeaveData(res.data);
    } catch (err) {
      console.error("Error fetching leave report:", err);
      alert("Failed to load leave report");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when department or month changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchLeaveReport();
    }
  }, [selectedDepartment, selectedMonth]);

  const getDepartmentName = () => {
    const dept = departments.find(d => d._id === selectedDepartment);
    return dept ? dept.departmentName : "";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2">
            Faculty Leave Balance Report
          </h1>
          <p className="text-gray-600">
            View leave balances, used leaves, and remaining leaves for faculty members by department and month
          </p>
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
              <input
                type="text"
                value={selectedYear}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Info Card */}
        {leaveData && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-lg p-6 mb-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">{leaveData.daysInMonth}</div>
                <div className="text-sm mt-1">Days in Month</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">{leaveData.facultyLeaveData?.length || 0}</div>
                <div className="text-sm mt-1">Total Faculty</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">
                  {leaveData.facultyLeaveData?.reduce((sum, f) => sum + f.usedInMonth, 0) || 0}
                </div>
                <div className="text-sm mt-1">Total Leaves Taken</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold">
                  {leaveData.facultyLeaveData?.reduce((sum, f) => sum + f.totalRemaining, 0) || 0}
                </div>
                <div className="text-sm mt-1">Total Remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leave report...</p>
          </div>
        )}

        {/* Table */}
        {!loading && leaveData && leaveData.facultyLeaveData && leaveData.facultyLeaveData.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
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
                      Total Allocated
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      Total Used
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      Total Remaining
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider bg-yellow-500">
                      Used in {months[selectedMonth - 1]?.label}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaveData.facultyLeaveData.map((faculty, index) => (
                    <tr
                      key={faculty.facultyId}
                      className={`${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      } hover:bg-blue-50 transition`}
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
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {faculty.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-green-700">
                        {faculty.totalAllocated}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-red-600">
                        {faculty.totalUsed}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-blue-700">
                        {faculty.totalRemaining}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-purple-700 bg-yellow-50">
                        {faculty.usedInMonth}
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
                  ? "No faculty found in the selected department"
                  : "Please select a department to view the report"}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default FacultyLeaveReport;
