import React, { useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import Topbar from "./Topbar";

// 1. Topbar Component - Import from separate file instead
// This Topbar is now handled by the separate Topbar.jsx component

// 2. Sidebar Component
function Sidebar() {
  const navigate = useNavigate();
  let userRole = null;
  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      if (user && user.role) {
        userRole = user.role;
      }
    }
  } catch (e) {
    console.error("Failed to parse user for sidebar", e);
  }

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  
  const [SubjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const [timetableMenuOpen, setTimetableMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="sidebar">
      <h2 className="sidebar-title">{userRole ? userRole.toUpperCase() : 'USER'} PANEL</h2>

      <ul className="sidebar-menu">
        <li>
          <NavLink to="home" end>Dashboard</NavLink>
        </li>

        {/* ADMIN MENU */}
        {userRole === "admin" && (
          <>
            <li className="menu-parent" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              Manage Users ▾
            </li>
            {userMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-user">Add User</NavLink></li>
                <li><NavLink to="delete-user">Delete/Edit User</NavLink></li>
              </ul>
            )}
            <li className="menu-parent" onClick={() => setDeptMenuOpen(!deptMenuOpen)}>
              Manage Department ▾
            </li>
            {deptMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-dept">Add Department</NavLink></li>
                <li><NavLink to="delete-dept">Delete/Edit Department</NavLink></li>
              </ul>
            )}
            
            <li className="menu-parent" onClick={() => setLeaveMenuOpen(!leaveMenuOpen)}>
              Allocate Leave ▾
            </li>
            {leaveMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="leave-add">Add Leave</NavLink></li>
                <li><NavLink to="leave-delete">Delete/Edit Leave</NavLink></li>
              </ul>
            )}
           
          </>
        )}

        {/* FACULTY MENU */}
        {userRole === "teaching" && (
          <>
            <li><NavLink to="view-timetable">My Timetable</NavLink></li>
             <li><NavLink to="view-subject">My Subject</NavLink></li>
            <li><NavLink to="apply-leave">Apply Leave</NavLink></li>
            <li><NavLink to="my-leave-status">Leave Status</NavLink></li>

          </>
        )}
  {userRole === "non-teaching" && (
          <>
            <li><NavLink to="view-timetable">My Timetable</NavLink></li>
            <li><NavLink to="apply-leave">Apply Leave</NavLink></li>
            <li><NavLink to="my-leave-status">Leave Status</NavLink></li>
          </>
        )}

        {/* HOD MENU */}
        {userRole === "hod" && (
          <>
            <li><NavLink to="faculty-list">View Faculty</NavLink></li>
            <li><NavLink to="view-department-leaves">Approve Leave</NavLink></li>
            <li><NavLink to="approve-leave">Pending leave Leave</NavLink></li>

<li><NavLink to="apply-leave-hod">Apply Leave</NavLink></li>
<li><NavLink to="my-leave-status">Leave Status</NavLink></li>
            <li><NavLink to="dept-reports">Department Reports</NavLink></li>
           <li className="menu-parent" onClick={() => setSubjectMenuOpen(!SubjectMenuOpen)}>
              Manage Subject ▾
            </li>
            {SubjectMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-sub">Add Subject</NavLink></li>
                <li><NavLink to="delete-sub">Delete/Edit Subject</NavLink></li>
              </ul>
            )}
          <li className="menu-parent" onClick={() => setTimetableMenuOpen(!timetableMenuOpen)}>
              Allocate Timetable ▾
            </li>
            {timetableMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="timetable-add">Add Timetable</NavLink></li>
                <li><NavLink to="timetable-view">Delete/Edit Timetable</NavLink></li>
              </ul>
            )}
             <li className="menu-parent" onClick={() => setDeptMenuOpen(!deptMenuOpen)}>
              Manage Class ▾
            </li>
            {deptMenuOpen && (
              <ul className="submenu">
                <li><NavLink to="add-class">Add Class</NavLink></li>
                <li><NavLink to="delete-class">Delete/Edit Class</NavLink></li>
              </ul>
            )}
          </>
        )}

        {/* DIRECTOR MENU */}
        {userRole === "director" && (
          <>
            <li><NavLink to="all-dept-report">All Department Reports</NavLink></li>
            <li><NavLink to="analytics">Analytics Dashboard</NavLink></li>
            <li><NavLink to="director-settings">Director Settings</NavLink></li>
          </>
        )}
      </ul>
      <button onClick={handleLogout} className="sidebar-button" style={{marginTop: "2rem"}}>
        Logout
      </button>
    </nav>
  );
}

// 3. DashboardLayout (Main Export)
// This combines the pieces into the dashboard layout.
function DashboardLayout() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <div className="bg-white p-6 rounded-lg shadow-md" style={{backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;