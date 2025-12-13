import React, { useEffect, useState } from "react";
import axios from "axios";

function DashboardHome() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role?.toLowerCase();

  /* ----------- STATES ----------- */
  const [stats, setStats] = useState({});
  const [leaveBalance, setLeaveBalance] = useState([]);

  /* ----------- LOAD BASIC COUNTS (Runs Once) ----------- */
  useEffect(() => {
    loadDepartmentCount();
    loadFacultyCount();
  }, []);

  /* ----------- ROLE BASED STATS ----------- */
  useEffect(() => {
    if (role === "admin") loadAdminStats();
    if (role === "hod") loadHodStats();
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
    const res = await axios.get(`http://localhost:5000/api/hod/stats/${user.department}`);
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

  /* ----------- COMPONENTS ----------- */

  const FacultyDashboard = () => (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Leave Balance – Current Academic Year
      </h2>

      {leaveBalance.length === 0 ? (
        <p className="text-gray-500 text-sm">No leave data found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Leave Type</th>
                <th className="px-4 py-3 text-left">Allowed</th>
                <th className="px-4 py-3 text-left">Carry Forward</th>
                <th className="px-4 py-3 text-left">Used</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Remaining</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {leaveBalance.map((leave) => (
                <tr
                  key={leave.leaveTypeId}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{leave.leaveTypeName}</td>
                  <td className="px-4 py-3">{leave.allowedLeaves}</td>
                  <td className="px-4 py-3">{leave.carryForwardLeaves}</td>
                  <td className="px-4 py-3">{leave.usedLeaves}</td>
                  <td className="px-4 py-3">{leave.totalAvailable}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">
                    {leave.remainingLeaves}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const StatCard = ({ title, value }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
      <h3 className="text-gray-600 text-sm">{title}</h3>
      <p className="text-3xl font-bold text-blue-600 mt-2">{value}</p>
    </div>
  );

  const AdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Faculties" value={stats.totalFaculties || 0} />
      <StatCard title="Total Departments" value={stats.totalDept || 0} />
    </div>
  );

  const HodDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Department Faculties" value={stats.faculties} />
      <StatCard title="Pending Leaves" value={stats.pending} />
      <StatCard title="Approved Leaves" value={stats.approved} />
      <StatCard title="Rejected Leaves" value={stats.rejected} />

      <div
        className="col-span-full bg-blue-600 rounded-xl text-white text-center py-4 cursor-pointer hover:bg-blue-700 transition"
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
        className="col-span-full bg-blue-600 rounded-xl text-white text-center py-4 cursor-pointer hover:bg-blue-700 transition"
        onClick={() => (window.location.href = "/director/dashboard/analytics")}
      >
        View Analytics →
      </div>
    </div>
  );

  return (
    <div className="p-8 w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Welcome, {user.name || user.email}
      </h1>

      {role === "admin" && <AdminDashboard />}
      {role === "hod" && <HodDashboard />}
      {(role === "teaching" || role === "non-teaching") && <FacultyDashboard />}
      {role === "director" && <DirectorDashboard />}
    </div>
  );
}

export default DashboardHome;
