import React from "react";
import LoginPage from "../Components/LoginPage";
import "../Components/LoginPage.css";

function HodLogin() {
  return (
    <LoginPage
      title="HOD Portal"
      subtitle="Head of Department Access"
      icon="🏛️"
      gradientFrom="#2c3e50"
      gradientTo="#4a235a"
      endpoint="auth"
      defaultRole="hod"
    />
  );
}

export default HodLogin;
