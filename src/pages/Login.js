import { useState } from "react";
import { useAuth } from "../components/Navbar"; // Hook for authentication logic
import "../styles/auth.css";

/**
 * Login Component
 * Provides a form for existing users to authenticate and log into the application.
 */
export default function Login() {
  const { login } = useAuth();

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
   * Redirects to the home page on success.
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
    setMessageType(result.success ? "success" : "error");
    setMessage(result.message);

    if (result.success) {
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
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
