// Sprint 3: Member 2
// Task: Create a registration page layout for Sprint 3.
// Member 2 will add validation and backend hookup later.

import { useState } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/auth.css";

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    // Validation
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

    // Register user
    const result = register(formData);
    if (result.success) {
      setMessageType("success");
      setMessage(result.message);
      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      // Redirect after 1.5 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } else {
      setMessageType("error");
      setMessage(result.message);
    }
  };

  return (
    <section className="auth-page">
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
              type="password"
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
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Confirm your password"
            />
          </label>
          <button type="submit" className="form-button">
            Register
          </button>
        </form>
        <p className="auth-link">
          Already have an account?{" "}
          <a href="/login" className="auth-link-text">
            Login here
          </a>
        </p>
      </div>
    </section>
  );
}
