import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import "../styles/auth.css";

// API URL Configuration
const API_BASE_URL = "http://localhost:8082/api";

export default function Login() {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
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
      // REAL API CALL
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success!
        setMessageType("success");
        setMessage("Login successful!");
        
        // Save Token
        localStorage.setItem("ACCESS_TOKEN", data.data.token);
        
        // Update Context (Assuming Navbar.js has a login function that accepts user data)
        // If not, we might need to reload the page to trigger the AuthProvider check
        if (login) {
          login(data.data.user); 
        } else {
          window.location.href = "/"; // Force reload if context update fails
        }

      } else {
        // Error from backend
        setMessageType("error");
        setMessage(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setMessageType("error");
      setMessage("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
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