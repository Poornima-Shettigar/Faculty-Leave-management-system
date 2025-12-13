import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "../styles/Sidebar.css";

function Sidebar() {
  // Get user and role from localStorage
  const [user, setUser] = useState(() => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      return null;
    }
  });

  const role = user?.role?.toUpperCase() || localStorage.getItem("role")?.toUpperCase() || "";

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const [timetableMenuOpen, setTimetableMenuOpen] = useState(false);
  
  // Leave request counts
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  // Fetch pending leave count for HOD and Director
  useEffect(() => {
    if (!user) return;
    
    const userRole = user.role?.toLowerCase();
    const userId = user._id || user.id;

    if (userRole === "hod" || userRole === "director") {
      loadPendingLeaveCount(userRole, userId);
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadPendingLeaveCount(userRole, userId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPendingLeaveCount = async (userRole, userId) => {
    if (!userId) return;
    
    try {
      setLoadingCount(true);
      let endpoint = "";
      
      if (userRole === "hod") {
        endpoint = `http://localhost:5000/api/leave-request/hod/pending/${userId}`;
      } else if (userRole === "director") {
        endpoint = `http://localhost:5000/api/leave-request/director/pending/${userId}`;
      }

      if (endpoint) {
        const res = await axios.get(endpoint);
        const count = Array.isArray(res.data) ? res.data.length : 0;
        setPendingLeaveCount(count);
      }
    } catch (err) {
      console.error("Error loading pending leave count:", err);
      setPendingLeaveCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  // Badge component for showing counts
  const Badge = ({ count }) => {
    if (count === 0) return null;
    return (
      <span className="sidebar-badge">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">{role} PANEL</h2>

      <ul className="sidebar-menu">

        <li>
          <NavLink to="home">Dashboard</NavLink>
        </li>

        {/* ---------------- ADMIN MENU ---------------- */}
        {role === "ADMIN" && (
          <>
            {/* USERS */}
            <li
              className="menu-parent"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              Manage Users ▾
            </li>

            {userMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-user">Add User</NavLink></li>
                <li><NavLink to="delete-user">Delete/Edit User</NavLink></li>
              </ul>
            )}

            {/* DEPARTMENT */}
            <li
              className="menu-parent"
              onClick={() => setDeptMenuOpen(!deptMenuOpen)}
            >
              Manage Department ▾
            </li>

            {deptMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-dept">Add Department</NavLink></li>
                <li><NavLink to="delete-dept">Delete/Edit Department</NavLink></li>
              </ul>
            )}

            {/* LEAVE */}
            <li
              className="menu-parent"
              onClick={() => setLeaveMenuOpen(!leaveMenuOpen)}
            >
              Allocate Leave ▾
            </li>

            {leaveMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="leave-add">Add Leave</NavLink></li>
                <li><NavLink to="leave-delete">Delete/Edit Leave</NavLink></li>
              </ul>
            )}

            {/* TIMETABLE */}
            <li
              className="menu-parent"
              onClick={() => setTimetableMenuOpen(!timetableMenuOpen)}
            >
              Allocate Timetable ▾
            </li>

            {timetableMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="timetable-add">Add Timetable</NavLink></li>
                <li><NavLink to="timetable-delete">Delete/Edit Timetable</NavLink></li>
              </ul>
            )}
          </>
        )}

        {/* ---------------- FACULTY MENU ---------------- */}
        {(role === "FACULTY" || role === "TEACHING" || role === "teaching") && (
          <>
            <li><NavLink to="my-timetable">My Timetable</NavLink></li>
            <li><NavLink to="view-timetable">View Department Timetable</NavLink></li>
            <li><NavLink to="view-subject">View Subjects</NavLink></li>
            <li><NavLink to="apply-leave">Apply Leave</NavLink></li>
            <li><NavLink to="my-leave-status">Leave Status</NavLink></li>
          </>
        )}

        {/* ---------------- NON-TEACHING MENU ---------------- */}
        {(role === "NON-TEACHING" || role === "non-teaching") && (
          <>
            <li><NavLink to="my-timetable">My Timetable</NavLink></li>
            <li><NavLink to="apply-leave">Apply Leave</NavLink></li>
            <li><NavLink to="my-leave-status">Leave Status</NavLink></li>
          </>
        )}

        {/* ---------------- HOD MENU ---------------- */}
        {(role === "HOD" || role === "hod") && (
          <>
            <li><NavLink to="faculty-list">View Faculty</NavLink></li>
            <li>
              <NavLink to="approve-leave" className="sidebar-menu-item-with-badge">
                Approve Leave Requests
                <Badge count={pendingLeaveCount} />
              </NavLink>
            </li>
            <li><NavLink to="view-department-leaves">View Department Leave Requests</NavLink></li>
            <li><NavLink to="apply-leave">Apply Leave</NavLink></li>
            <li><NavLink to="dept-reports">Department Reports</NavLink></li>
            <li><NavLink to="timetable-add">Add Timetable</NavLink></li>
            <li><NavLink to="timetable-view">View Timetable</NavLink></li>
            <li><NavLink to="add-sub">Add Subject</NavLink></li>
            <li><NavLink to="delete-sub">View Subjects</NavLink></li>
            <li><NavLink to="add-class">Add Class</NavLink></li>
            <li><NavLink to="delete-class">Edit/Delete Class</NavLink></li>
          </>
        )}

        {/* ---------------- DIRECTOR MENU ---------------- */}
        {(role === "DIRECTOR" || role === "director") && (
          <>
            <li>
              <NavLink to="approve-leave" className="sidebar-menu-item-with-badge">
                Approve Leave Requests
                <Badge count={pendingLeaveCount} />
              </NavLink>
            </li>
            <li><NavLink to="view-approved-leaves">View Approved Leaves</NavLink></li>
            <li><NavLink to="all-dept-report">All Department Reports</NavLink></li>
            <li><NavLink to="analytics">Analytics Dashboard</NavLink></li>
            <li><NavLink to="director-settings">Director Settings</NavLink></li>
          </>
        )}

      </ul>
    </div>
  );
}

export default Sidebar;
