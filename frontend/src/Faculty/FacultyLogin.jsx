import React from "react";
import LoginPage from "../Components/LoginPage";
import "../Components/LoginPage.css";

function FacultyLogin() {
  return (
    <LoginPage
      title="Faculty Portal"
      subtitle="Teaching Staff Access"
      icon="👨‍🏫"
      gradientFrom="#0f4c75"
      gradientTo="#1b262c"
      endpoint="auth"
      defaultRole="teaching"
    />
  );
}

export default FacultyLogin;
