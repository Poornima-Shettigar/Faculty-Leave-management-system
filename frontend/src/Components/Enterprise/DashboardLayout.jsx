import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { EnterpriseButton, EnterpriseCard, EnterpriseKPICard } from './index';
import profileImg from '../../assets/image.png';

const EnterpriseDashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userId = user._id || user.id;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const NavLinkItem = ({ to, children, icon = null, badge = null }) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `enterprise-nav-link flex items-center px-4 py-3 text-sm font-medium rounded-enterprise transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
            : 'text-neutral-700 hover:text-primary-600 hover:bg-primary-50'
        } ${sidebarCollapsed ? 'justify-center' : ''}`
      }
    >
      {icon && <span className={`${sidebarCollapsed ? 'hidden' : 'mr-3'}`}>{icon}</span>}
      <span className={sidebarCollapsed ? 'hidden' : ''}>{children}</span>
      {badge && !sidebarCollapsed && (
        <span className="ml-auto">
          {badge}
        </span>
      )}
    </NavLink>
  );

  const MenuSection = ({ title, children, isOpen, onToggle, icon = null, badge = null }) => (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-enterprise transition-all duration-200 ${
          sidebarCollapsed ? 'justify-center' : ''
        }`}
      >
        <div className="flex items-center">
          {icon && <span className={`${sidebarCollapsed ? 'hidden' : 'mr-3'}`}>{icon}</span>}
          <span className={sidebarCollapsed ? 'hidden' : ''}>{title}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            sidebarCollapsed ? 'hidden' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && !sidebarCollapsed && (
        <div className="ml-4 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-institutional-50 flex">
      {/* Enterprise Header */}
      <header className="enterprise-header">
        <div className="enterprise-header-content">
          {/* Institution Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary-600 rounded-enterprise flex items-center justify-center">
              <span className="text-white font-bold text-sm">PIM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                Poornaprajna Institute of Management
              </h1>
              <p className="text-sm text-neutral-600">
                Faculty Leave Management System
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-enterprise transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.293-1.293a2 2 0 00-2.828 0l-2.828 2.828a2 2 0 002.828 2.828L18.707 17.586a2 2 0 00-2.828 2.828L15 17z" />
                </svg>
                {/* Notification Badge */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </span>
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-enterprise-lg shadow-enterprise-xl border border-neutral-100 z-50">
                  <div className="p-4 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer border-b border-neutral-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 1.414l8-8a1 1 0 011.414-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900">Leave Approved</p>
                          <p className="text-xs text-neutral-600 mt-1">Your sick leave request has been approved by HOD</p>
                          <p className="text-xs text-neutral-400 mt-1">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 text-neutral-700 hover:text-primary-600 hover:bg-primary-50 rounded-enterprise transition-all duration-200"
              >
                <img
                  src={profileImg}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {user.role === 'teaching' ? 'Teaching Faculty' : 
                     user.role === 'hod' ? 'Head of Department' :
                     user.role === 'admin' ? 'Administrator' :
                     user.role === 'director' ? 'Director' :
                     user.role === 'non-teaching' ? 'Non-Teaching Staff' : 'User'}
                  </p>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-enterprise-lg shadow-enterprise-xl border border-neutral-100 z-50">
                  <div className="p-2">
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 rounded-enterprise cursor-pointer transition-colors duration-200">
                      View Profile
                    </div>
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 rounded-enterprise cursor-pointer transition-colors duration-200">
                      Settings
                    </div>
                    <div className="border-t border-neutral-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 rounded-enterprise cursor-pointer transition-colors duration-200 text-left"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Enterprise Sidebar */}
        <nav className={`enterprise-sidebar ${sidebarCollapsed ? 'enterprise-sidebar-collapsed' : ''} transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-900">
                {sidebarCollapsed ? 'PIM' : user.role === 'teaching' ? 'Faculty Panel' : 
                 user.role === 'hod' ? 'HOD Panel' :
                 user.role === 'admin' ? 'Admin Panel' :
                 user.role === 'director' ? 'Director Panel' :
                 user.role === 'non-teaching' ? 'Staff Panel' : 'Dashboard'}
              </h2>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 text-neutral-500 hover:text-neutral-700 rounded-enterprise transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavLinkItem to="home" icon="🏠">
              Dashboard
            </NavLinkItem>

            {/* Faculty Menu */}
            {(user.role === 'teaching' || user.role === 'non-teaching') && (
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
              </>
            )}

            {/* HOD Menu */}
            {user.role === 'hod' && (
              <>
                <MenuSection
                  title="Manage Faculty"
                  icon="👥"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="faculty-list">View Faculty</NavLinkItem>
                  <NavLinkItem to="add-user">Add Faculty</NavLinkItem>
                </MenuSection>

                <MenuSection
                  title="Leave Management"
                  icon="📊"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="approve-leave">Approve Leave</NavLinkItem>
                  <NavLinkItem to="view-department-leaves">Department Leaves</NavLinkItem>
                  <NavLinkItem to="apply-leave-hod">Apply Leave</NavLinkItem>
                </MenuSection>

                <MenuSection
                  title="Academic"
                  icon="📚"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="add-sub">Add Subject</NavLinkItem>
                  <NavLinkItem to="delete-sub">Manage Subjects</NavLinkItem>
                  <NavLinkItem to="timetable-add">Add Timetable</NavLinkItem>
                  <NavLinkItem to="timetable-view">Manage Timetable</NavLinkItem>
                </MenuSection>

                <NavLinkItem to="my-leave-status" icon="📋">
                  My Leave Status
                </NavLinkItem>
              </>
            )}

            {/* Admin Menu */}
            {user.role === 'admin' && (
              <>
                <MenuSection
                  title="User Management"
                  icon="👥"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="add-user">Add User</NavLinkItem>
                  <NavLinkItem to="delete-user">Manage Users</NavLinkItem>
                </MenuSection>

                <MenuSection
                  title="Department"
                  icon="🏢"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="add-dept">Add Department</NavLinkItem>
                  <NavLinkItem to="delete-dept">Manage Departments</NavLinkItem>
                </MenuSection>

                <MenuSection
                  title="Leave Configuration"
                  icon="📅"
                  isOpen={false}
                  onToggle={() => {}}
                >
                  <NavLinkItem to="leave-add">Add Leave Type</NavLinkItem>
                  <NavLinkItem to="leave-delete">Manage Leave Types</NavLinkItem>
                  <NavLinkItem to="leave-report">Leave Reports</NavLinkItem>
                </MenuSection>
              </>
            )}

            {/* Director Menu */}
            {user.role === 'director' && (
              <>
                <NavLinkItem to="all-dept-report" icon="📊">
                  All Reports
                </NavLinkItem>
                <NavLinkItem to="department-faculty" icon="👥">
                  Department Overview
                </NavLinkItem>
                <NavLinkItem to="approve-leave" icon="✅">
                  Approve Leave
                </NavLinkItem>
              </>
            )}

            {/* Common Menu Items */}
            <NavLinkItem to="profile" icon="👤">
              Profile
            </NavLinkItem>
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-neutral-100">
            <EnterpriseButton
              onClick={handleLogout}
              variant="outline"
              className="w-full"
              icon="🚪"
            >
              {sidebarCollapsed ? '' : 'Logout'}
            </EnterpriseButton>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnterpriseDashboardLayout;
