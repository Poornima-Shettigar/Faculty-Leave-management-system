
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  let user = null;

  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      user = JSON.parse(userData);
    }
  } catch (e) {
    console.error("Failed to parse user from localStorage", e);
  }

  if (!user) {
    // Not logged in
    // Redirect to a generic login, or a role-specific one if needed
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  if (!allowedRoles || !allowedRoles.includes(user.role)) {
    // Logged in, but not authorized
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Logged in and authorized
  return children;
}

export default ProtectedRoute;