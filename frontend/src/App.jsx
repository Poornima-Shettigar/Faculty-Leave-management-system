import React from "react";
import { 
  BrowserRouter, 
  Routes, 
  Route 
} from "react-router-dom";

// Import the new CSS file
import "./Admin/styles/Style.css";

// Import Page Components
import Home from "./Admin/Pages/Home";
import Login from "./Admin/Login";
import   FacultyLogin from "./Faculty/FacultyLogin.jsx";
import NonTeachingLogin from "./Nonteaching/NonTeachingLogin.jsx";
import HodLogin from "./HOD/HodLogin.jsx";
import DirectorLogin from "./Director/DirectorLogin.jsx";
import { 
 
  
  Unauthorized, 
  NotFound 
} from "./Admin/Pages/Placeholders";

// Import Layouts and Protected Routes
import DashboardLayout from "./Admin/components/DashboardLayout";
import ProtectedRoute from "./ProtectedRote";
import  AddFaculty from "./Admin/Pages/AddFaculty"
import AdminUsers from "./Admin/Pages/ManageUser"
import AddDepartment from "./Admin/Pages/AddDepartment"
import AddTimetable from "./Admin/Pages/AddTimetable";
import AddSubject from "./Admin/Pages/AddSubject"
import EditSubjectModal from "./Admin/Pages/EditSubjectModal";
import ViewSubjects from "./Admin/Pages/ViewSubjects";
 import ViewTimetable from "./Admin/Pages/TimetableView.jsx";
 import DeleteDepartment from "./Admin/Pages/EditDeleteDepartment.jsx"
// Import all placeholder dashboard pages
import AddLeave from "./Admin/Pages/AddLeave.jsx"
import DeleteLeave from "./Admin/Pages/LeaveTypeManagement.jsx"
import FacultyLeaveReport from "./Admin/Pages/FacultyLeaveReport.jsx"
import DashboardHome1 from "./Nonteaching/DashboardHome.jsx"
import Addclass from "./Nonteaching/ManageClasses.jsx"
import Editdeleteclass from "./Nonteaching/editdeleteclass.jsx";
import ViewSubjectsForFaculty from "./Faculty/ViewSubject.jsx";
import ViewTimetableFaculty from "./Faculty/TimeviewFaculty.jsx";
import ApplyLeave from "./Faculty/ApplyLeave.jsx";
import MyLeaveStatus from "./Faculty/MyLeaveStatus.jsx";
import MyTimetable from "./Faculty/MyTimetable.jsx";
import HodApproveLeave from "./HOD/ApproveLeave.jsx";
import ViewDepartmentLeaves from "./HOD/ViewDepartmentLeaves.jsx";
import DirectorApproveLeave from "./Director/ApproveLeave.jsx";
import FacultyDashboard from "./Faculty/FacultyDashboard.jsx"
import ViewApprovedLeaves from "./Director/ViewApprovedLeaves.jsx";
import ApplyLeaveHod from "./HOD/ApplyLeaveHod.jsx"
import DashboardHome from "./Nonteaching/DashboardHome.jsx";
import ViewFacultylist from "./HOD/ViewFacultylist.jsx"
import AllDeptReport from "./Director/AllDeptReport.jsx"
import AnalyticsDashboard from "./Director/AnalyticsDashboard.jsx"
import SubstitutionPage from "./Faculty/SubstitutionPage.jsx";
import {
 
 
  DeleteUser,
 
  
  DeleteTimetable,

  FacultyList,
  DeptReports,
  
  
  DirectorSettings
} from "./Admin/Pages/Placeholders";

function App() {
  return (
    <>
      {/* The <style> tag is removed. The CSS is now loaded 
        from src/styles.css via the import statement at the top.
      */}
      <BrowserRouter>
        <Routes>
          {/* ---------------- HOME LANDING PAGE ---------------- */}
          <Route path="/" element={<Home />} />

          {/* ---------------- LOGIN ROUTES ---------------- */}
          <Route path="/admin-login" element={<Login />} />
          <Route path="/faculty-login" element={<FacultyLogin />} />
          <Route path="/non-teaching-login" element={<NonTeachingLogin/>}/>
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
            <Route path="edit-sub" element={<EditSubjectModal/>}/>
          </Route>

          {/* ---------------- FACULTY PROTECTED ROUTES ---------------- */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={["teaching"]}>
                <DashboardLayout /> {/* Reusing the same layout */}
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome1/>} />
            <Route path="home" element={<DashboardHome1 />} />
            <Route path="my-timetable" element={<MyTimetable />} />
            <Route path="view-timetable" element={<ViewTimetableFaculty />} />
            <Route path="view-subject" element={<ViewSubjectsForFaculty />} />
            <Route path="substitution-details" element={<SubstitutionPage />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="my-leave-status" element={<MyLeaveStatus />} />
            
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
            <Route index element={<DashboardHome1/>} />
            <Route path="home" element={<DashboardHome1 />} />
            <Route path="my-timetable" element={<MyTimetable />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="my-leave-status" element={<MyLeaveStatus />} />
          </Route>

          {/* ---------------- HOD PROTECTED ROUTES ---------------- */}
          <Route
            path="/hod/dashboard"
            element={
              <ProtectedRoute allowedRoles={["hod"]}>
                <DashboardLayout /> {/* Reusing the same layout */}
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
                      <Route path="my-leave-status" element={<MyLeaveStatus />} />

            <Route path="add-sub" element={<AddSubject />} />
            
            <Route path="delete-sub" element={<ViewSubjects />} />
              <Route path="add-class" element={<Addclass />} />
              <Route path="delete-class" element={<Editdeleteclass />} />
            <Route path="substitution-details" element={<SubstitutionPage />} />

            {/* <Route path="delete-sub" element={<ViewSubjects />} /> */}
            <Route path="edit-sub" element={<EditSubjectModal/>}/>
          </Route>

          {/* ---------------- DIRECTOR PROTECTED ROUTES ---------------- */}
          <Route
            path="/director/dashboard"
            element={
              <ProtectedRoute allowedRoles={["director"]}>
                <DashboardLayout /> {/* Reusing the same layout */}
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="home" element={<DashboardHome />} />
            <Route path="approve-leave" element={<DirectorApproveLeave />} />
            <Route path="view-approved-leaves" element={<ViewApprovedLeaves />} />
            <Route path="all-dept-report" element={<AllDeptReport />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            {/* <Route path="director-settings" element={<DirectorSettings />} /> */}
          </Route>

          {/* ---------------- Utility Pages ---------------- */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;