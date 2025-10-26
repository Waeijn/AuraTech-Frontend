// Sprint 3: Member 2 - Login Page with Split Layout

import { useState } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  // 1. Add showPassword state
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password) {
      setMessageType("error");
      setMessage("Email and password are required");
      return;
    }

    // Attempt login
    const result = login(formData);
    if (result.success) {
      setMessageType("success");
      setMessage(result.message);
      // Redirect after 1 second
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } else {
      setMessageType("error");
      setMessage(result.message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        {/* LEFT SIDE: Brand Panel (Logo & Tagline) */}
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

        {/* RIGHT SIDE: Form Panel */}
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
                />
              </label>
              <label className="form-label">
                Password
                <input
                  name="password"
                  // 2. Conditional input type
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </label>

              {/* 3. Password Toggle UI */}
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

              <button type="submit" className="form-button">
                Login
              </button>
            </form>
            <p className="auth-link">
              Don't have an account?{" "}
              <a href="/register" className="auth-link-text">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
