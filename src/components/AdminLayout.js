import React from "react";
import AdminSidebar from "./AdminSidebar";
// Import the admin-specific styles
import "../styles/admin.css";

// A wrapper for all admin pages to enforce the dashboard layout
const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout-container">
      <AdminSidebar />
      <main className="admin-main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;
