import React, { useEffect, useState } from "react";
import axios from "axios";

function DashboardHome() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role?.toLowerCase();

  /* ----------- STATES ----------- */
  const [stats, setStats] = useState({});
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  /* ----------- LOAD BASIC COUNTS ----------- */
  useEffect(() => {
    loadDepartmentCount();
    loadFacultyCount();
  }, []);

  /* ----------- ROLE BASED STATS ----------- */
  useEffect(() => {
    if (role === "admin") loadAdminStats();
    if (role === "hod") {
      loadHodStats();
      loadFacultyLeaveBalance(); // Also load leave balance for HOD
    }
    if (role === "teaching" || role === "non-teaching") loadFacultyLeaveBalance();
    if (role === "director") loadDirectorStats();
  }, [role]);

  /* ----------- API FUNCTIONS ----------- */

  const loadDepartmentCount = async () => {
    const res = await axios.get("http://localhost:5000/api/department/count");
    setStats((prev) => ({ ...prev, totalDept: res.data.totalDepartments }));
  };

  const loadFacultyCount = async () => {
    const res = await axios.get("http://localhost:5000/api/faculty/count");
    setStats((prev) => ({ ...prev, totalFaculties: res.data.totalFaculties }));
  };

  const loadAdminStats = async () => {
    const res = await axios.get("http://localhost:5000/api/faculty/admin/stats");
    setStats((prev) => ({ ...prev, departmentStats: res.data }));
  };

  const loadHodStats = async () => {
    const deptId = user.departmentType?._id || user.departmentType || user.department;
    const res = await axios.get(
      `http://localhost:5000/api/leave-request/hod/stats/${deptId}`
    );
    setStats((prev) => ({ ...prev, ...res.data }));
  };

  const loadFacultyLeaveBalance = async () => {
    try {
      const employeeId = user._id || user.id;
      const res = await axios.get(
        `http://localhost:5000/api/leaveType/faculty/${employeeId}/leaves`
      );
      setLeaveBalance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setLeaveBalance([]);
    }
  };

  const loadDirectorStats = async () => {
    const res = await axios.get("http://localhost:5000/api/leave-request/director/stats");
    setStats((prev) => ({ ...prev, ...res.data }));
  };

  /* ----------- UI COMPONENTS ----------- */

  const StatCard = ({ title, value }) => (
    <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl shadow-lg p-6 hover:scale-[1.02] transition">
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-4xl font-bold mt-2">{value || 0}</p>
    </div>
  );

  /* ----------- FACULTY DASHBOARD ----------- */
  const FacultyDashboard = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Leave Balance – Current Academic Year
      </h2>

      {leaveBalance.length === 0 ? (
        <p className="text-gray-500">No leave data found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaveBalance.map((leave) => {
            const percentage =
              (leave.remainingLeaves / leave.totalAvailable) * 100;

            const barColor =
              percentage > 60
                ? "bg-green-500"
                : percentage > 30
                ? "bg-yellow-400"
                : "bg-red-500";

            return (
              <div
                key={leave.leaveTypeId}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {leave.leaveTypeName}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {leave.remainingLeaves}/{leave.totalAvailable}
                  </span>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className={`${barColor} h-2 rounded-full`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Allowed</p>
                    <p className="font-semibold">{leave.allowedLeaves}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Carry Forward</p>
                    <p className="font-semibold">{leave.carryForwardLeaves}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Used</p>
                    <p className="font-semibold text-red-600">
                      {leave.usedLeaves}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="font-semibold text-green-600">
                      {leave.remainingLeaves}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ----------- ROLE DASHBOARDS ----------- */

  const AdminDashboard = () => {
    const departmentStats = stats.departmentStats || [];
    const totalTeaching = departmentStats.reduce((sum, dept) => sum + (dept.teachingStaff || 0), 0);
    const totalNonTeaching = departmentStats.reduce((sum, dept) => sum + (dept.nonTeachingStaff || 0), 0);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Faculties" value={stats.totalFaculties} />
          <StatCard title="Total Departments" value={stats.totalDept} />
          <StatCard title="Total Teaching Staff" value={totalTeaching} />
          <StatCard title="Total Non-Teaching Staff" value={totalNonTeaching} />
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Department-wise Staff Distribution</h2>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> Staff</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Teaching Staff</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentStats.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dept.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.teachingStaff ||dept.nonTeachingStaff || 0}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dept.nonTeachingStaff || 0}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {dept.total || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const HodDashboard = () => {
    const absenceDetails = stats.absenceDetails || [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Faculty" value={stats.totalFaculty} />
          <StatCard title="Available Faculty" value={stats.availableFaculty} />
          <StatCard title="Faculty on Leave Today" value={stats.facultyOnLeave} />
          <StatCard title="Pending Leaves" value={stats.pendingLeaves} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Faculty Absence Details - {today}
          </h2>
          {absenceDetails.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
              No faculty on leave today. All faculty members are available.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {absenceDetails.map((absence, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {absence.facultyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {absence.facultyEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {absence.facultyRole}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {absence.leaveType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(absence.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(absence.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {absence.totalDays} day(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className="mt-6 bg-blue-600 text-white text-center py-4 rounded-xl cursor-pointer hover:bg-blue-700 transition"
          onClick={() => (window.location.href = "/hod/dashboard/approve-leave")}
        >
          Review Leave Requests →
        </div>
      </div>
    );
  };

  const DirectorDashboard = () => {
    const departmentStats = stats.departmentStats || [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const handleDepartmentClick = (dept) => {
      setSelectedDepartment(selectedDepartment?.departmentId === dept.departmentId ? null : dept);
    };

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Departments" value={stats.totalDepartments || stats.totalDept} />
          <StatCard title="Total Faculties" value={stats.totalFaculty || stats.totalFaculties} />
          <StatCard title="Pending Leaves" value={stats.pendingLeaves || stats.pending} />
          <StatCard title="Faculty on Leave Today" value={stats.facultyOnLeaveToday || 0} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Department-wise Faculty Availability - {today}
          </h2>
          
          {/* Graph/Chart Representation */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentStats.map((dept) => {
                const availabilityPercent = dept.totalFaculty > 0 
                  ? ((dept.availableFaculty / dept.totalFaculty) * 100).toFixed(1)
                  : 0;
                
                return (
                  <div
                    key={dept.departmentId}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDepartment?.departmentId === dept.departmentId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => handleDepartmentClick(dept)}
                  >
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {dept.departmentName}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Faculty:</span>
                        <span className="font-semibold">{dept.totalFaculty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Available:</span>
                        <span className="font-semibold text-green-600">{dept.availableFaculty}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">On Leave:</span>
                        <span className="font-semibold text-red-600">{dept.facultyOnLeave}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Availability</span>
                          <span>{availabilityPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              availabilityPercent >= 80 ? 'bg-green-500' :
                              availabilityPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${availabilityPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faculty Details Modal/Expanded View */}
          {selectedDepartment && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedDepartment.departmentName} - Faculty Details
                </h3>
                <button
                  onClick={() => setSelectedDepartment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>

              {/* Faculty on Leave */}
              {selectedDepartment.leaveDetails && selectedDepartment.leaveDetails.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3 text-red-600">
                    Faculty on Leave ({selectedDepartment.leaveDetails.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedDepartment.leaveDetails.map((leave, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{leave.facultyName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{leave.facultyEmail}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{leave.leaveType}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(leave.startDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(leave.endDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Available Faculty */}
              {selectedDepartment.availableFacultyList && selectedDepartment.availableFacultyList.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 text-green-600">
                    Available Faculty ({selectedDepartment.availableFacultyList.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDepartment.availableFacultyList.map((faculty) => (
                      <div
                        key={faculty.facultyId}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <p className="font-medium text-gray-900">{faculty.name}</p>
                        <p className="text-xs text-gray-500">{faculty.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{faculty.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ----------- MAIN RENDER ----------- */
  return (
    <div className="p-8 w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Welcome, {user.name || user.email}
      </h1>

      <div className="bg-gray-50 rounded-xl p-6">
        {role === "admin" && <AdminDashboard />}
        {role === "hod" && <HodDashboard />}
        {(role === "teaching" || role === "non-teaching") && (
          <FacultyDashboard />
        )}
        {role === "director" && <DirectorDashboard />}
      </div>
    </div>
  );
}

export default DashboardHome;
