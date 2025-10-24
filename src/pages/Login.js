// Sprint 3: Member 2
// Task: Create a basic login page layout for Sprint 3.
// Member 2 will add auth logic later; Member 5 will style via auth.css.

import { useState } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
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
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </label>
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
    </section>
  );
}
