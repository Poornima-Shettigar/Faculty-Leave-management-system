import React from "react";
import LoginPage from "../Components/LoginPage";
import "../Components/LoginPage.css";

function DirectorLogin() {
  return (
    <LoginPage
      title="Director Portal"
      subtitle="Institutional Leadership Access"
      icon="🎓"
      gradientFrom="#1c3a1c"
      gradientTo="#0d2b3e"
      endpoint="auth"
      defaultRole="director"
    />
  );
}

export default DirectorLogin;
