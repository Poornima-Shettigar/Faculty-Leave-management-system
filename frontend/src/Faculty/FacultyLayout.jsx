import React from "react";
import { Outlet } from "react-router-dom"; // renders nested routes
import Sidebar from "../Admin/components/Sidebar"; // your sidebar component
import ChatbotWidget from "../Components/ChatbotWidget";

const FacultyLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white p-4">
        <h2 className="font-bold text-lg mb-4">Faculty Panel 1</h2>
        <Sidebar /> {/* Your sidebar links */}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative p-6">
        {/* Nested pages like LeaveStatus, ApplyLeave will render here */}
        <Outlet />

        {/* ✅ Chatbot visible on all faculty pages */}
        <ChatbotWidget />
      </div>
    </div>
  );
};

export default FacultyLayout;
