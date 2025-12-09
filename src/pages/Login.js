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

    // Client-side validation
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

      const adminCheck = isAdmin();

      setTimeout(() => {
        if (adminCheck) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/";
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
        {/* Brand panel with logo and tagline */}
        <div className="auth-brand-panel">
          <div className="brand-content">
            <img
              src="/img/logo/LOGO.png"
              alt="AuraTech Logo"
              className="brand-logo"
            />
            <h2>AuraTech</h2>
            <p className="brand-tagline">Power. Precision. Performance.</p>
          </div>
        </div>

        {/* Login form panel */}
        <div className="auth-form-panel">
          <div className="auth-container">
            <h1>Login</h1>

            {/* Display success or error messages */}
            {message && (
              <div className={`form-message form-message-${messageType}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email input */}
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

              {/* Password input with show/hide toggle */}
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
                <label
                  htmlFor="showPassLogin"
                  className="password-toggle-label"
                >
                  Show Password
                </label>
              </div>

              {/* Submit button */}
              <button type="submit" className="form-button" disabled={loading}>
                {loading ? (
                  <div className="form-button-content-wrapper">
                    <div className="spinner"></div>
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Link to register page */}
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
