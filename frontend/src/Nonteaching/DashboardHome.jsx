import React, { useEffect, useState } from "react";
import axios from "axios";

function DashboardHome() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role?.toLowerCase();

  /* ----------- STATES ----------- */
  const [stats, setStats] = useState({});
  const [leaveBalance, setLeaveBalance] = useState([]);

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
    const res = await axios.get("http://localhost:5000/api/admin/stats");
    setStats((prev) => ({ ...prev, ...res.data }));
  };

  const loadHodStats = async () => {
    const res = await axios.get(
      `http://localhost:5000/api/hod/stats/${user.department}`
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
    const res = await axios.get("http://localhost:5000/api/director/stats");
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

  const AdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Faculties" value={stats.totalFaculties} />
      <StatCard title="Total Departments" value={stats.totalDept} />
    </div>
  );

  const HodDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Department Faculties" value={stats.faculties} />
      <StatCard title="Pending Leaves" value={stats.pending} />
      <StatCard title="Approved Leaves" value={stats.approved} />
      <StatCard title="Rejected Leaves" value={stats.rejected} />

      <div
        className="col-span-full bg-blue-600 text-white text-center py-4 rounded-xl cursor-pointer hover:bg-blue-700 transition"
        onClick={() => (window.location.href = "/hod/dashboard/approve-leave")}
      >
        Review Leave Requests →
      </div>
    </div>
  );

  const DirectorDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Departments" value={stats.totalDept} />
      <StatCard title="Total Faculties" value={stats.totalFaculties} />
      <StatCard title="Pending Leaves" value={stats.pending} />
      <StatCard title="Approved Leaves" value={stats.approved} />

      <div
        className="col-span-full bg-blue-600 text-white text-center py-4 rounded-xl cursor-pointer hover:bg-blue-700 transition"
        onClick={() => (window.location.href = "/director/dashboard/analytics")}
      >
        View Analytics →
      </div>
    </div>
  );

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
