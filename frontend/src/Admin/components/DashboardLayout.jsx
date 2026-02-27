import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { Button } from "../../Components/UI";
import Topbar from "./Topbar";

function Sidebar() {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(null);
  const [departmentType, setDepartmentType] = useState(null);
  const [departmentCategory, setDepartmentCategory] = useState(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deptMenuOpen, setDeptMenuOpen] = useState(false);
  const [SubjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
  const [timetableMenuOpen, setTimetableMenuOpen] = useState(false);
  const allowedHodDepartments = ["MCA", "MBA", "BBA", "BCOM", "BCA", "BSC", "BA", "MCc", "BHM", "MCOM"];
  const serviceHodDepartments = ["LIBRARY", "MANAGEMENT", "CLEANING", "OTHER", "CLERK"];


  useEffect(() => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        if (user && user.role) {
          setUserRole(user.role.toLowerCase());

          // departmentType can be an object {_id, departmentName} or a plain string ID
          const deptType = user.departmentType;
          if (deptType && typeof deptType === "object") {
            // Already have the full object — no API call needed
            setDepartmentType(deptType._id?.toString() || null);
            if (deptType.departmentName) {
              setDepartmentCategory(deptType.departmentName);
            }
          } else if (deptType && typeof deptType === "string") {
            // Plain ObjectId string
            setDepartmentType(deptType);
          } else if (user.departmentId) {
            // Fallback: use the dedicated departmentId field
            setDepartmentType(user.departmentId);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse user for sidebar", e);
    }
  }, []);


  useEffect(() => {
    // Only fetch if we have a valid 24-char ObjectId string and no name yet
    if (!departmentType || typeof departmentType !== "string" || departmentType.length !== 24) return;
    if (departmentCategory) return; // already set from the user object

    const fetchDepartment = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/department/get-by-id/${departmentType}`
        );
        if (!res.ok) {
          console.error("Failed to fetch department", res.status);
          return;
        }
        const dept = await res.json();
        setDepartmentCategory(dept.departmentName || null);
      } catch (err) {
        console.error("Error fetching department", err);
      }
    };

    fetchDepartment();
  }, [departmentType, departmentCategory]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const NavLinkItem = ({ to, children, icon = null }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `amazing-nav-link ${isActive ? 'active' : ''}`
      }
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </NavLink>
  );
  const contains = (text, value) => {
    return text?.includes(value);
  };
  const MenuSection = ({ title, children, isOpen, onToggle, icon = null }) => (
    <div>
      <button
        onClick={onToggle}
        className="w-full amazing-nav-link justify-between"
      >
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          {title}
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
  const normalizedDept = departmentCategory?.trim().toUpperCase();
  console.log("Sidebar Debug:", { userRole, normalizedDept, departmentCategory });
  return (
    <nav className="w-full h-screen bg-white border-r-2 border-purple-200 flex flex-col shadow-2xl">
      <div className="p-6 border-b-2 border-purple-100 amazing-card-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h2 className="text-xl font-bold text-white">
          {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "User"} Panel
        </h2>
        {departmentCategory && (
          <p className="text-blue-100 text-xs font-semibold uppercase mt-1">
            Dept: {departmentCategory}
          </p>
        )}
        <p className="text-sm text-blue-100 mt-1 opacity-80">Leave Management System</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)' }}>
        <NavLinkItem to="home" icon="🏠">
          Dashboard
        </NavLinkItem>

        {/* ADMIN MENU */}
        {userRole === "admin" && (
          <>
            <MenuSection
              title="Manage Users"
              isOpen={userMenuOpen}
              onToggle={() => setUserMenuOpen(!userMenuOpen)}
              icon="👥"
            >
              <NavLinkItem to="add-user">Add User</NavLinkItem>
              <NavLinkItem to="delete-user">Delete/Edit User</NavLinkItem>
            </MenuSection>

            <MenuSection
              title="Manage Department"
              isOpen={deptMenuOpen}
              onToggle={() => setDeptMenuOpen(!deptMenuOpen)}
              icon="🏢"
            >
              <NavLinkItem to="add-dept">Add Department</NavLinkItem>
              <NavLinkItem to="delete-dept">Delete/Edit Department</NavLinkItem>
            </MenuSection>

            <MenuSection
              title="Allocate Leave"
              isOpen={leaveMenuOpen}
              onToggle={() => setLeaveMenuOpen(!leaveMenuOpen)}
              icon="📅"
            >
              <NavLinkItem to="leave-add">Add Leave</NavLinkItem>
              <NavLinkItem to="leave-delete">Delete/Edit Leave</NavLinkItem>
            </MenuSection>

            <MenuSection
              title="Reports"
              isOpen={timetableMenuOpen}
              onToggle={() => setTimetableMenuOpen(!timetableMenuOpen)}
              icon="📊"
            >
              <NavLinkItem to="leave-report">Leave Reports</NavLinkItem>
            </MenuSection>

            <NavLinkItem to="profile" icon="👤">
              My Profile
            </NavLinkItem>
          </>
        )}

        {/* FACULTY MENU */}
        {(userRole === "teaching") && (
          <>
            <NavLinkItem to="apply-leave" icon="✍️">
              Apply Leave
            </NavLinkItem>
            <NavLinkItem to="my-leave-status" icon="📋">
              Leave Status
            </NavLinkItem>
            <NavLinkItem to="view-subject" icon="📚">
              My Subjects
            </NavLinkItem>
            <NavLinkItem to="my-timetable" icon="📅">
              Timetable
            </NavLinkItem>
            <NavLinkItem to="substitution-details" icon="🔄">
              Substitution
            </NavLinkItem>
            <NavLinkItem to="profile" icon="👤">
              My Profile
            </NavLinkItem>
          </>
        )}
        {(userRole === "non-teaching") && (
          <>
            <NavLinkItem to="apply-leave" icon="✍️">
              Apply Leave
            </NavLinkItem>
            <NavLinkItem to="my-leave-status" icon="📋">
              Leave Status
            </NavLinkItem>
            {/* <NavLinkItem to="view-subject" icon="📚">
              My Subjects
            </NavLinkItem>
            <NavLinkItem to="my-timetable" icon="📅">
              Timetable
            </NavLinkItem>
            <NavLinkItem to="substitution-details" icon="🔄">
              Substitution
            </NavLinkItem> */}
            <NavLinkItem to="profile" icon="👤">
              My Profile
            </NavLinkItem>
          </>
        )}

        {/* HOD MENU */}
        {userRole?.toLowerCase() === "hod" && (
          <>


            <MenuSection
              title="Manage Faculty"
              isOpen={userMenuOpen}
              onToggle={() => setUserMenuOpen(!userMenuOpen)}
              icon="👥"
            >
              <NavLinkItem to="faculty-list">View Faculty</NavLinkItem>
            </MenuSection>

            <MenuSection
              title="Leave Management"
              isOpen={leaveMenuOpen}
              onToggle={() => setLeaveMenuOpen(!leaveMenuOpen)}
              icon="📊"
            >
              <NavLinkItem to="approve-leave">
                Approve Leave
              </NavLinkItem>
              <NavLinkItem to="view-department-leaves">Department Leaves</NavLinkItem>
{normalizedDept && serviceHodDepartments.some(d => contains(normalizedDept, d)) ? (
  <NavLinkItem to="apply-leave">
    Apply Leave
  </NavLinkItem>
) : (
  <NavLinkItem to="apply-leave-hod">
    Apply Leave
  </NavLinkItem>
)}            </MenuSection>

            {/* Academic section: Show if NOT a service department */}
            {normalizedDept && !serviceHodDepartments.some(d => contains(normalizedDept, d)) && (
              <MenuSection
                title="Academic"
                isOpen={SubjectMenuOpen}
                onToggle={() => setSubjectMenuOpen(!SubjectMenuOpen)}
                icon="📚"
              >
                <NavLinkItem to="add-sub">Add Subject</NavLinkItem>
                <NavLinkItem to="delete-sub">Manage Subjects</NavLinkItem>
                <NavLinkItem to="timetable-add">Add Timetable</NavLinkItem>
                <NavLinkItem to="timetable-view">Manage Timetable</NavLinkItem>
                <NavLinkItem to="add-class">Add Class</NavLinkItem>
                <NavLinkItem to="delete-class">Manage Class</NavLinkItem>


              </MenuSection>
            )}

            <NavLinkItem to="my-leave-status" icon="📋">
              My Leave Status
            </NavLinkItem>

            {normalizedDept && !serviceHodDepartments.some(d => contains(normalizedDept, d)) && (
              <NavLinkItem to="substitution-details" icon="🔄">
                Substitution Requests
              </NavLinkItem>
            )}
            <NavLinkItem to="profile" icon="👤">
              My Profile
            </NavLinkItem>
          </>
        )}

        {/* DIRECTOR MENU */}
        {userRole?.toLowerCase() === "director" && (
          <>
            <NavLinkItem to="all-dept-report" icon="📊">
              All Department Reports
            </NavLinkItem>
            <NavLinkItem to="department-faculty" icon="👥">
              Department Faculty & Leaves
            </NavLinkItem>
            <NavLinkItem to="approve-leave" icon="✅">
              Leave Requests
            </NavLinkItem>
            <NavLinkItem to="profile" icon="👤">
              My Profile
            </NavLinkItem>
          </>
        )}
      </div>

      <div className="p-4 border-t-2 border-purple-100 bg-white">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full amazing-btn-danger"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}

function DashboardLayout() {
  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Fixed Sidebar */}
      <div className="w-64 flex-shrink-0 fixed left-0 top-0 h-full z-50">
        <Sidebar />
      </div>

      {/* Main Content with Left Margin */}
      <div className="flex-1 flex flex-col ml-64" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', minHeight: '100vh' }}>
        <Topbar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
