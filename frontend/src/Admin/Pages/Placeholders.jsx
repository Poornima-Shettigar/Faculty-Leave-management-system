import React from "react";
import { Link } from "react-router-dom";

// --- Login Placeholders ---
export function FacultyLogin() {
  return <div className="p-8 text-center text-xl" style={{padding: '2rem', textAlign: 'center', fontSize: '1.25rem'}}>Faculty Login Page Placeholder. <Link to="/admin-login">Go to Main Login</Link></div>;
}
export function HodLogin() {
  return <div className="p-8 text-center text-xl" style={{padding: '2rem', textAlign: 'center', fontSize: '1.25rem'}}>HOD Login Page Placeholder. <Link to="/admin-login">Go to Main Login</Link></div>;
}
export function DirectorLogin() {
  return <div className="p-8 text-center text-xl" style={{padding: '2rem', textAlign: 'center', fontSize: '1.25rem'}}>Director Login Page Placeholder. <Link to="/admin-login">Go to Main Login</Link></div>;
}

// --- Dashboard Page Placeholders ---
const PageH2 = ({ children }) => <h2 className="text-2xl font-semibold" style={{fontSize: '1.5rem', fontWeight: '600'}}>{children}</h2>;

export function DashboardHome() { return <PageH2>Dashboard Home</PageH2>; }
export function AddFaculty() { return <PageH2>Add New Faculty Page</PageH2>; }
export function AddDepartment() { return <PageH2>Add New Department Page</PageH2>; }
export function DeleteUser() { return <PageH2>Delete/Edit User Page</PageH2>; }
export function DeleteDepartment() { return <PageH2>Delete/Edit Department Page</PageH2>; }
export function AddLeave() { return <PageH2>Add Leave Page</PageH2>; }
export function DeleteLeave() { return <PageH2>Delete/Edit Leave Page</PageH2>; }
export function AddTimetable() { return <PageH2>Add Timetable Page</PageH2>; }
export function DeleteTimetable() { return <PageH2>Delete/Edit Timetable Page</PageH2>; }
export function ViewTimetable() { return <PageH2>My Timetable Page</PageH2>; }
export function ApplyLeave() { return <PageH2>Apply Leave Page</PageH2>; }
export function MyLeaveStatus() { return <PageH2>My Leave Status Page</PageH2>; }
export function FacultyList() { return <PageH2>View Faculty List Page</PageH2>; }
export function ApproveLeave() { return <PageH2>Approve Leave Page</PageH2>; }
export function DeptReports() { return <PageH2>Department Reports Page</PageH2>; }
export function AllDeptReport() { return <PageH2>All Department Reports Page</PageH2>; }
export function AnalyticsDashboard() { return <PageH2>Analytics Dashboard Page</PageH2>; }
export function DirectorSettings() { return <PageH2>Director Settings Page</PageH2>; }

// --- Utility Pages ---
export function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6'}}>
      <h1 className="text-center text-3xl text-red-600 font-bold" style={{textAlign: 'center', fontSize: '1.875rem', color: '#DC2626', fontWeight: 'bold'}}>
        ❌ Unauthorized
      </h1>
      <p className="text-xl mt-4" style={{fontSize: '1.25rem', marginTop: '1rem'}}>You are not authorized to view this page.</p>
      <Link to="/" className="mt-8 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" style={{marginTop: '2rem', padding: '0.5rem 1.5rem', backgroundColor: '#2563EB', color: 'white', borderRadius: '0.375rem', textDecoration: 'none'}}>
        Go to Homepage
      </Link>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6'}}>
      <h1 className="text-center text-3xl text-gray-800 font-bold" style={{textAlign: 'center', fontSize: '1.875rem', color: '#1F2937', fontWeight: 'bold'}}>
        404 - Page Not Found
      </h1>
      <p className="text-xl mt-4" style={{fontSize: '1.25rem', marginTop: '1rem'}}>Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="mt-8 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" style={{marginTop: '2rem', padding: '0.5rem 1.5rem', backgroundColor: '#2563EB', color: 'white', borderRadius: '0.375rem', textDecoration: 'none'}}>
        Go to Homepage
      </Link>
    </div>
  );
}