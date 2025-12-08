import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./Navbar";
import "../styles/admin.css";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Automatically close sidebar on mobile after navigation
  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Ensure admin pages have their own body styling
  useEffect(() => {
    document.body.classList.add("admin-page");
    return () => {
      document.body.classList.remove("admin-page");
    };
  }, []);

  // Detect clicks outside the sidebar (mobile) to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        !e.target.closest(".admin-sidebar") &&
        !e.target.closest(".sidebar-toggle-button")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent background scrolling when sidebar is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        className="sidebar-toggle-button"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {/* Renders hamburger or close icon */}
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Overlay behind sidebar for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Main admin sidebar */}
      <aside className={`admin-sidebar ${isOpen ? "is-open" : ""}`}>
        <h3>Admin Panel</h3>
        <nav>
          <ul>
            <li>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/products"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Product Management
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                Order Review
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/users"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeSidebar}
              >
                User Management
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Footer: shows logged-in admin + logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <p className="admin-user-name">{currentUser?.name}</p>
            <p className="admin-user-role">Administrator</p>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
