import React from "react";
import LoginPage from "../Components/LoginPage";
import "../Components/LoginPage.css";

function NonTeachingLogin() {
  return (
    <LoginPage
      title="Staff Portal"
      subtitle="Non-Teaching Staff Access"
      icon="🧑‍💼"
      gradientFrom="#1a3a2a"
      gradientTo="#2d1b3d"
      endpoint="auth"
      defaultRole="non-teaching"
    />
  );
}

export default NonTeachingLogin;
