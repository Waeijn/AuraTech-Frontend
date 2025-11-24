import React, { useState, useEffect } from "react"; // <-- Import useEffect
import { Link, useNavigate } from "react-router-dom"; // <-- Use Link and useNavigate
import { useAuth } from "../components/Navbar"; // Hook for authentication logic
import "../styles/auth.css";

/**
 * Login Component
 * Provides a form for existing users to authenticate and log into the application.
 * Handles role-based redirection after successful login.
 */
export default function Login() {
  // Destructure required state and functions from Auth context
  const { currentUser, login } = useAuth();
  const navigate = useNavigate(); // Hook for programmatic navigation

  // --- State Hooks ---
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  // State for displaying success or error messages to the user
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
   * Handles form submission: validates inputs and attempts user login.
   * @param {object} e - The form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    if (!formData.email || !formData.password) {
      setMessageType("error");
      setMessage("Email and password are required");
      return;
    }

    // Attempt login using the Auth Context
    const result = login(formData);

    // Display result message immediately, even if it's a success
    setMessageType(result.success ? "success" : "error");
    setMessage(result.message);

    // NOTE: The actual redirection is handled by the useEffect hook below
    // because state updates (like currentUser) can be asynchronous.
  };

  // --- Redirection Logic (The robust fix for admin login) ---

  useEffect(() => {
    if (currentUser) {
      // Login was successful and currentUser state is updated.
      // Now check the role property (which we set in Navbar.js)

      if (currentUser.role === "admin") {
        // 1. Admin login: redirect to the admin dashboard
        navigate("/admin", { replace: true });
      } else {
        // 2. Regular user login: redirect to the home page or account page
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, navigate]); // Depend on currentUser and navigate

  // --- End Redirection Logic ---

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

        {/* RIGHT SIDE: Login Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-container">
            <h1>Login</h1>
            {/* Display status messages (success/error) */}
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
                  // Conditionally set input type for show/hide password feature
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                />
              </label>

              {/* Password visibility toggle control */}
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

            {/* Link to Registration Page */}
            <p className="auth-link">
              Don't have an account?{" "}
              {/* Use the Link component from react-router-dom */}
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
