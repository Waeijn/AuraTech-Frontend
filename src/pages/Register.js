import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService"; 
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    // 1. Client-side Validation
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

    setIsLoading(true);

    try {
      // 2. USE SERVICE (Replaces manual fetch)
      // The service automatically handles headers and saves the token upon success
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword
      });

      if (response.success) {
        setMessageType("success");
        setMessage("Registration successful! Redirecting...");
        
        // Madelyn's service saves the token, so the user is now logged in.
        // We redirect to home or login page.
        setTimeout(() => {
          navigate("/"); // Redirect to Home since they are auto-logged in
        }, 1500);
      } 
    } catch (error) {
      console.error("Register Error:", error);
      setMessageType("error");
      // The service throws an error with the message from the backend
      setMessage(error.message || "Registration failed.");
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

              <button type="submit" className="form-button" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Register"}
              </button>
            </form>

            <p className="auth-link">
              Already have an account?{" "}
              <Link to="/login" className="auth-link-text">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}