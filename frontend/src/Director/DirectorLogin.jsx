import React, { useState } from "react";
import "./Login.css";
import bgImage from "../assets/pim.jpg";
import logo from "../assets/logo.jpg";
import { useNavigate } from "react-router-dom";

function DirectorLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "director"  // default selected role
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });


      const data = await res.json();
console.log(formData);
      if (res.status === 200) {
          // Store user details including ROLE
        localStorage.setItem("user", JSON.stringify(data));

        // Redirect based on ROLE
        if (data.role === "admin") {
          navigate("/admin/dashboard");
        } else if (data.role === "teaching") {
           navigate("/faculty/dashboard");
        } else if (data.role === "teaching") {
           navigate("/admin/dashboard");}
        else if (data.role === "hod") {
          navigate("/hod/dashboard");
        } else if (data.role === "director") {
          navigate("/director/dashboard");
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server error. Try again later.");
      console.log(err);
    }
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-box">
        <div className="login-header">
          <img src={logo} alt="PIM Logo" className="login-logo" />
          <h2>Login Portal</h2>
          <p>Please select your role & login</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* Role Dropdown */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="role-select"
          >
            <option value="admin">Admin</option>
            <option value="teaching">Teaching</option>
             <option value="non-teaching">Non-Teaching</option>
            <option value="hod">HOD</option>
            <option value="director">Director</option>
          </select>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>

      <footer className="footer">
        © 2024 Poornaprajna Institute of Management. All Rights Reserved.
      </footer>
    </div>
  );
}

export default DirectorLogin;


