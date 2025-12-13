// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
        <span>POORNAPRAJNA INSTITUTE OF MANAGEMENT</span>
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/academics">Academics</Link></li>
        <li><Link to="/placements">Placements</Link></li>
        <li><Link to="/activities">Activities</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>

      <div className="login-dropdown">
        <button className="login-btn">Login</button>
        <div className="dropdown-content">
          <Link to="/login/admin">Admin Login</Link>
          <Link to="/login/faculty">Faculty Login</Link>
          <Link to="/login/hod">HOD Login</Link>
          <Link to="/login/director">Director Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
