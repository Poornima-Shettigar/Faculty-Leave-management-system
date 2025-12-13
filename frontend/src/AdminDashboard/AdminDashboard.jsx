import React from "react";
import Sidebar from "../Admin/components/Sidebar";
import Topbar from "../Admin/components/Topbar";
import { Outlet } from "react-router-dom";
import "../Admin/styles/dashboard.css";

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
