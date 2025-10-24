// Sprint 1: Member 2
// Task: Implement basic Navbar structure for navigation.

import React, { createContext, useContext, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("users");
    return stored ? JSON.parse(stored) : [];
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Register user
  const register = ({ name, email, password }) => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    const newUser = { name, email, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    return { success: true, message: "Registration successful!" };
  };

  // Login user
  const login = ({ email, password }) => {
    const stored = JSON.parse(localStorage.getItem("users")) || [];
    const user = stored.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return { success: true, message: "Login successful!" };
    } else {
      return { success: false, message: "Invalid email or password" };
    }
  };

  // Load current user on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Logout user
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Hide navbar on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <img
            src="/img/logo/LOGO.png"
            alt="Logo"
            className="navbar__logo-img"
          />
          <Link to="/" className="navbar__brand-text">
            AuraTech
          </Link>
        </div>

        <form className="navbar__search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>

        <nav className="navbar__links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/products" className="nav-link">
            Products
          </Link>
          <Link to="/cart" className="nav-link">
            Cart
          </Link>
          <Link to="/checkout" className="nav-link">
            Checkout
          </Link>

          {!currentUser ? (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          ) : (
            <>
              <span className="nav-user-greeting">
                Welcome, {currentUser.name}
              </span>
              <button onClick={handleLogout} className="nav-logout-btn">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
