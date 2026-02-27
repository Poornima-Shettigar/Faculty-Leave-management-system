import React from "react";
import LoginPage from "../Components/LoginPage";
import "../Components/LoginPage.css";

function AdminLogin() {
  return (
    <LoginPage
      title="Admin Portal"
      subtitle="System Administration Access"
      icon="👨‍💼"
      gradientFrom="#1a1a2e"
      gradientTo="#16213e"
      endpoint="admin"
      defaultRole="admin"
    />
  );
}

export default AdminLogin;
