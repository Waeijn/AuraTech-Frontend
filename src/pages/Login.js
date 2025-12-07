import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/authService"; 
import { isAdmin } from "../utils/auth"; // Use Mades's Helper
import "../styles/auth.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password) {
      setMessageType("error");
      setMessage("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      // API Call
      await authService.login(formData);
      
      setMessageType("success");
      setMessage("Login successful! Redirecting...");

      // FIX: Use Mades's isAdmin() helper for consistent checking
      const adminCheck = isAdmin();
      
      setTimeout(() => {
        if (adminCheck) {
          window.location.href = "/admin"; // Force reload to Admin Dashboard
        } else {
          window.location.href = "/"; // Force reload to User Home
        }
      }, 1000);

    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-brand-panel">
          <div className="brand-content">
            <img src="/img/logo/LOGO.png" alt="AuraTech Logo" className="brand-logo" />
            <h2>AuraTech</h2>
            <p className="brand-tagline">Power. Precision. Performance.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-container">
            <h1>Login</h1>
            {message && (
              <div className={`form-message form-message-${messageType}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="form-label">
                Email
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </label>

              <label className="form-label">
                Password
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </label>

              <div className="password-toggle-wrapper">
                <input
                  type="checkbox"
                  className="password-toggle"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                  id="showPassLogin"
                />
                <label htmlFor="showPassLogin" className="password-toggle-label">
                  Show Password
                </label>
              </div>

              <button type="submit" className="form-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-link">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link-text">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}