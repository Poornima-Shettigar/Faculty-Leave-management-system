import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import CSS
import "./styles/globals.css";

// Import Pages
import Home from "./Admin/Pages/Home";
import Login from "./Admin/Login";
import FacultyLogin from "./Faculty/FacultyLogin.jsx";
import NonTeachingLogin from "./Nonteaching/NonTeachingLogin.jsx";
import HodLogin from "./HOD/HodLogin.jsx";
import DirectorLogin from "./Director/DirectorLogin.jsx";

// Layouts
import FacultyLayout from "./Faculty/FacultyLayout";
import DashboardLayout from "./Admin/components/DashboardLayout";

// Protected Route
import ProtectedRoute from "./ProtectedRote";

// Admin Pages
import AddFaculty from "./Admin/Pages/AddFaculty";
import AdminUsers from "./Admin/Pages/ManageUser";
import AddDepartment from "./Admin/Pages/AddDepartment";
import AddTimetable from "./Admin/Pages/AddTimetable";
import AddSubject from "./Admin/Pages/AddSubject";
import EditSubjectModal from "./Admin/Pages/EditSubjectModal";
import ViewSubjects from "./Admin/Pages/ViewSubjects";
import ViewTimetable from "./Admin/Pages/TimetableView.jsx";
import DeleteDepartment from "./Admin/Pages/EditDeleteDepartment.jsx";
import AddLeave from "./Admin/Pages/AddLeave.jsx";
import DeleteLeave from "./Admin/Pages/LeaveTypeManagement.jsx";
import FacultyLeaveReport from "./Admin/Pages/FacultyLeaveReport.jsx";

// Faculty Pages
import LeaveStatus from "./Faculty/MyLeaveStatus.jsx";
import ApplyLeave from "./Faculty/ApplyLeave.jsx";
import MyTimetable from "./Faculty/MyTimetable.jsx";
import ViewSubjectsForFaculty from "./Faculty/ViewSubject.jsx";
import ViewTimetableFaculty from "./Faculty/TimeviewFaculty.jsx";
import FacultyDashboard from "./Faculty/FacultyDashboard.jsx";
import SubstitutionPage from "./Faculty/SubstitutionPage.jsx";

// Non-Teaching Pages
import DashboardHome from "./Components/Enterprise/DashboardHome.jsx";
import Addclass from "./Nonteaching/ManageClasses.jsx";
import Editdeleteclass from "./Nonteaching/editdeleteclass.jsx";

// HOD Pages
import HodApproveLeave from "./HOD/ApproveLeave.jsx";
import ViewDepartmentLeaves from "./HOD/ViewDepartmentLeaves.jsx";
import ApplyLeaveHod from "./HOD/ApplyLeaveHod.jsx";
import ViewFacultylist from "./HOD/ViewFacultylist.jsx";

// Director Pages
import DirectorApproveLeave from "./Director/ApproveLeave.jsx";
import ViewApprovedLeaves from "./Director/ViewApprovedLeaves.jsx";
import AllDeptReport from "./Director/AllDeptReport.jsx";
import AnalyticsDashboard from "./Director/AnalyticsDashboard.jsx";
import DepartmentWiseFaculty from "./Director/DepartmentWiseFaculty.jsx";

// Common Components
import ProfileEdit from "./Components/ProfileEdit.jsx";

// Placeholder Pages
import { Unauthorized, NotFound, DeptReports } from "./Admin/Pages/Placeholders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------------- HOME LANDING PAGE ---------------- */}
        <Route path="/" element={<Home />} />

        {/* ---------------- LOGIN ROUTES ---------------- */}
        <Route path="/admin-login" element={<Login />} />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/non-teaching-login" element={<NonTeachingLogin />} />
        <Route path="/hod-login" element={<HodLogin />} />
        <Route path="/director-login" element={<DirectorLogin />} />

        {/* ---------------- ADMIN PROTECTED ROUTES ---------------- */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="add-user" element={<AddFaculty />} />
          <Route path="delete-user" element={<AdminUsers />} />
          <Route path="add-dept" element={<AddDepartment />} />
          <Route path="delete-dept" element={<DeleteDepartment />} />
          <Route path="leave-add" element={<AddLeave />} />
          <Route path="leave-delete" element={<DeleteLeave />} />
          <Route path="leave-report" element={<FacultyLeaveReport />} />
          <Route path="timetable-add" element={<AddTimetable />} />
          <Route path="timetable-view" element={<ViewTimetable />} />
          <Route path="add-sub" element={<AddSubject />} />
          <Route path="delete-sub" element={<ViewSubjects />} />
          <Route path="edit-sub" element={<EditSubjectModal />} />
          <Route path="profile" element={<ProfileEdit />} />
        </Route>

        {/* ---------------- FACULTY PROTECTED ROUTES ---------------- */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teaching"]}>
              <DashboardLayout /> {/* ✅ Layout includes chatbot */}
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="my-timetable" element={<MyTimetable />} />
          <Route path="view-timetable" element={<ViewTimetableFaculty />} />
          <Route path="view-subject" element={<ViewSubjectsForFaculty />} />
          <Route path="substitution-details" element={<SubstitutionPage />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="my-leave-status" element={<LeaveStatus />} />
          <Route path="profile" element={<ProfileEdit />} />
        </Route>

        {/* ---------------- NON-TEACHING PROTECTED ROUTES ---------------- */}
        <Route
          path="/non-teaching/dashboard"
          element={
            <ProtectedRoute allowedRoles={["non-teaching"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="my-timetable" element={<MyTimetable />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="my-leave-status" element={<LeaveStatus />} />
          <Route path="profile" element={<ProfileEdit />} />
        </Route>

        {/* ---------------- HOD PROTECTED ROUTES ---------------- */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute allowedRoles={["hod"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="faculty-list" element={<ViewFacultylist />} />
          <Route path="approve-leave" element={<HodApproveLeave />} />
          <Route path="view-department-leaves" element={<ViewDepartmentLeaves />} />
          <Route path="apply-leave-hod" element={<ApplyLeaveHod />} />
          <Route path="dept-reports" element={<DeptReports />} />
          <Route path="timetable-add" element={<AddTimetable />} />
          <Route path="timetable-view" element={<ViewTimetable />} />
          <Route path="add-sub" element={<AddSubject />} />
          <Route path="delete-sub" element={<ViewSubjects />} />
          <Route path="add-class" element={<Addclass />} />
          <Route path="delete-class" element={<Editdeleteclass />} />
          <Route path="substitution-details" element={<SubstitutionPage />} />
                    <Route path="apply-leave" element={<ApplyLeave />} />

          <Route path="my-leave-status" element={<LeaveStatus />} />
          <Route path="edit-sub" element={<EditSubjectModal />} />
          <Route path="profile" element={<ProfileEdit />} />
        </Route>

        {/* ---------------- DIRECTOR PROTECTED ROUTES ---------------- */}
        <Route
          path="/director/dashboard"
          element={
            <ProtectedRoute allowedRoles={["director"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="approve-leave" element={<DirectorApproveLeave />} />
          <Route path="view-approved-leaves" element={<ViewApprovedLeaves />} />
          <Route path="all-dept-report" element={<AllDeptReport />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="department-faculty" element={<DepartmentWiseFaculty />} />
          <Route path="profile" element={<ProfileEdit />} />
        </Route>

        {/* ---------------- Utility Pages ---------------- */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
