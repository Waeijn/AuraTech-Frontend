import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import { authService } from "../services/authService"; // Import Service
import "../styles/auth.css";

export default function Login() {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE (Exact same as your orig file) ---
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- REDIRECT LOGIC (Preserved from your orig file) ---
  useEffect(() => {
    if (currentUser) {
      // If Admin, go to Dashboard. Else, Home.
      if (currentUser.is_admin || currentUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setIsLoading(true);

    if (!formData.email || !formData.password) {
      setMessageType("error");
      setMessage("Email and password are required");
      setIsLoading(false);
      return;
    }

    try {
      // --- SERVICE LAYER INTEGRATION ---
      // Replaced fetch with authService.login
      // The service automatically saves the token to localStorage
      const response = await authService.login(formData);

      if (response.success) {
        setMessageType("success");
        setMessage("Login successful!");

        // Update Context
        // This triggers the useEffect above to handle the redirect
        if (login) {
          login(response.data.user, response.data.token); 
        } 
      } 
    } catch (error) {
      console.error("Login Error:", error);
      setMessageType("error");
      // Service throws error with message
      setMessage(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX (Exact copy from login-orig.txt) ---
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

              <button type="submit" className="form-button" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
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