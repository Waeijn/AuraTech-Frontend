import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, isAdmin } from "../utils/auth";

/**
 * - Blocks access to routes unless user is authenticated
 * - Optional: restricts access to admin-only pages
 */
function ProtectedRoute({ children, adminOnly = false }) {
  // Redirect if user is not logged in
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-admin users from admin-restricted pages
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
