import { useState } from "react";
import { useAuth } from "../components/Navbar"; // Hook for authentication context
import "../styles/auth.css";

/**
 * Register Component
 * Provides a form for new users to register an account.
 * Includes client-side validation for required fields and password matching.
 */
export default function Register() {
  const { register } = useAuth();

  // --- State Hooks ---
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  // State for displaying status messages (success/error)
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // --- Handlers ---

  /** Updates form data state on input change. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handles form submission: validates inputs and attempts user registration.
   * Redirects to the login page on successful registration.
   * @param {object} e - The form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    // 1. Client-side Validation: Check for required fields
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setMessageType("error");
      setMessage("All fields are required");
      return;
    }

    // 2. Client-side Validation: Check for password match
    if (formData.password !== formData.confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match");
      return;
    }

    // 3. Client-side Validation: Check for minimum password length
    if (formData.password.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters");
      return;
    }

    // Attempt registration via Auth Context
    const result = register(formData);
    setMessageType(result.success ? "success" : "error");
    setMessage(result.message);

    if (result.success) {
      // Clear form on successful registration
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-wrapper">
        {/* LEFT SIDE: Brand Panel (Marketing/Visual Section) */}
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

        {/* RIGHT SIDE: Registration Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-container">
            <h1>Register</h1>
            {/* Display status messages (success/error) */}
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
                  // Conditionally set input type for show/hide password feature
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

              {/* Password visibility toggle control */}
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

              <button type="submit" className="form-button">
                Register
              </button>
            </form>

            {/* Link to Login Page */}
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
