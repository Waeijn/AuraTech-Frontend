import { useState } from "react";
import { authService } from "../services/authService"; // Integration
import "../styles/auth.css";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessageType("error");
      setMessage("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      
      // API Call - Sending 'password_confirmation' for Laravel
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword 
      });

      setMessageType("success");
      setMessage("Registration successful! Redirecting...");
      
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

    } catch (error) {
      setMessageType("error");
      console.error("Registration Error:", error);
      
      let errorMsg = error.message || "Registration failed.";
      if (errorMsg.includes("Unexpected token") || errorMsg.includes("<!DOCTYPE")) {
          errorMsg = "Connection Error: Check API_BASE_URL config.";
      }
      setMessage(errorMsg);
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

        {/* UI FIX: Added styles to allow scrolling if content gets too tall */}
        <div 
          className="auth-form-panel" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            overflowY: "auto", 
            maxHeight: "100vh" 
          }}
        >
          <div className="auth-container" style={{ margin: "auto", padding: "20px 0" }}>
            <h1>Register</h1>
            {message && (
              <div className={`form-message form-message-${messageType}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="form-label">
                Full name
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </label>
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
              <label className="form-label">
                Confirm Password
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </label>

              <div className="password-toggle-wrapper">
                <input
                  type="checkbox"
                  className="password-toggle"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                  id="showPass"
                />
                <label htmlFor="showPass" className="password-toggle-label">
                  Show Password
                </label>
              </div>

              <button type="submit" className="form-button" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p className="auth-link">
              Already have an account?{" "}
              <a href="/login" className="auth-link-text">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}