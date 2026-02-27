import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";
import logo from "../assets/logo.jpg";

/**
 * Shared professional login page.
 *
 * Props:
 *  - role: string (e.g. "teaching", "hod", "director", "non-teaching")
 *  - title: string (display title, e.g. "Faculty Portal")
 *  - subtitle: string
 *  - icon: emoji string
 *  - gradientFrom / gradientTo: CSS colour stops
 *  - endpoint: "auth" | "admin"   (which API endpoint to hit)
 *  - defaultRole: the role value to send when using /api/auth/login
 *  - showRoleSelect: bool – show a role <select> (unified portal)
 */
function LoginPage({
    title = "Login",
    subtitle = "Poornaprajna Institute of Management",
    icon = "🔐",
    gradientFrom = "#1e3a5f",
    gradientTo = "#0f2440",
    endpoint = "auth",        // "auth" or "admin"
    defaultRole = "teaching",
    showRoleSelect = false,
}) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(defaultRole);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const roleRoutes = {
        admin: "/admin/dashboard",
        teaching: "/faculty/dashboard",
        "non-teaching": "/non-teaching/dashboard",
        hod: "/hod/dashboard",
        director: "/director/dashboard",
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const url =
                endpoint === "admin"
                    ? "http://localhost:5000/api/admin/login"
                    : "http://localhost:5000/api/auth/login";

            const payload =
                endpoint === "admin"
                    ? { email, password }
                    : { email, password, role };

            const res = await axios.post(url, payload);

            if (res.data.success) {
                const userData = endpoint === "admin" ? res.data.admin : res.data.user;
                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("token", res.data.token || "");

                const userRole = userData.role?.toLowerCase();
                const destination = roleRoutes[userRole] || "/";
                navigate(destination);
            } else {
                setError(res.data.message || "Login failed");
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="lp-root"
            style={{
                background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            }}
        >
            {/* Animated background blobs */}
            <div className="lp-blob lp-blob-1" style={{ background: `${gradientFrom}66` }} />
            <div className="lp-blob lp-blob-2" style={{ background: `${gradientTo}55` }} />
            <div className="lp-blob lp-blob-3" style={{ background: `${gradientFrom}44` }} />

            {/* Left branding panel (hidden on mobile) */}
            <div className="lp-branding">
                <img src={logo} alt="PIM Logo" className="lp-brand-logo" />
                <h1 className="lp-brand-title">Poornaprajna Institute of Management</h1>
                <p className="lp-brand-sub">Faculty Leave Management System</p>
                <div className="lp-brand-stats">
                    <div className="lp-stat">
                        <span className="lp-stat-num">NAAC</span>
                        <span className="lp-stat-label">A+ Accredited</span>
                    </div>
                    <div className="lp-stat-divider" />
                    <div className="lp-stat">
                        <span className="lp-stat-num">2006</span>
                        <span className="lp-stat-label">Established</span>
                    </div>
                    <div className="lp-stat-divider" />
                    <div className="lp-stat">
                        <span className="lp-stat-num">AICTE</span>
                        <span className="lp-stat-label">Approved</span>
                    </div>
                </div>
                <p className="lp-brand-address">
                    📍 Poornaprajna Campus, Udupi, Karnataka – 576101
                </p>
            </div>

            {/* Right login card */}
            <div className="lp-card-wrapper">
                <div className="lp-card">
                    {/* Card header */}
                    <div className="lp-card-header">
                        <div className="lp-icon-circle">
                            <span className="lp-icon">{icon}</span>
                        </div>
                        <h2 className="lp-card-title">{title}</h2>
                        <p className="lp-card-subtitle">{subtitle}</p>
                    </div>

                    {/* Error alert */}
                    {error && (
                        <div className="lp-error">
                            <span className="lp-error-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="lp-form">
                        {/* Role selector for unified portal */}
                        {showRoleSelect && (
                            <div className="lp-field">
                                <label className="lp-label">Login As</label>
                                <div className="lp-input-wrap">
                                    <span className="lp-input-icon">👤</span>
                                    <select
                                        className="lp-select"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="teaching">Teaching Staff</option>
                                        <option value="non-teaching">Non-Teaching Staff</option>
                                        <option value="hod">HOD</option>
                                        <option value="director">Director</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="lp-field">
                            <label className="lp-label">Email Address</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon">✉️</span>
                                <input
                                    type="email"
                                    className="lp-input"
                                    placeholder="you@pim.ac.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="lp-field">
                            <label className="lp-label">Password</label>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon">🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="lp-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="lp-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="lp-submit"
                            disabled={loading}
                            style={{
                                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                            }}
                        >
                            {loading ? (
                                <span className="lp-spinner-wrap">
                                    <span className="lp-spinner" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In →"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="lp-card-footer">
                        <a href="/" className="lp-back-link">
                            ← Back to Home
                        </a>
                        <span className="lp-divider-dot">•</span>
                        <a href="mailto:purushotham@pim.ac.in" className="lp-back-link">
                            IT Support
                        </a>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="lp-badges">
                    <div className="lp-badge">🔒 Secure Login</div>
                    <div className="lp-badge">🏛️ PIM Official</div>
                    {/* <div className="lp-badge">📱 Mobile Ready</div> */}
                </div>
            </div>

            {/* Bottom copyright */}
            <p className="lp-copyright">
                © 2026 Poornaprajna Institute of Management. All Rights Reserved.
            </p>
        </div>
    );
}

export default LoginPage;
