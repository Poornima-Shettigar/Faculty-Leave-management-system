import React, { useState } from "react";
import "./Login.css";
import bgImage from "../assets/pim.jpg";
import logo from "../assets/logo.jpg";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "Admin"
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 200) {
        alert(`Welcome, ${data.name}!`);

        // Save login details
        localStorage.setItem("user", JSON.stringify(data));

        // Redirect to admin dashboard
        navigate("/admin-dashboard");
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
          <h2>Admin Portal Login</h2>
          <p>Welcome, please sign in.</p>
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

          <div className="form-options">
            <label>
              <input type="checkbox" /> Remember Me
            </label>
            <a href="#" className="forgot-link">
              Forgot Password?
            </a>
          </div>

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

export default Login;
