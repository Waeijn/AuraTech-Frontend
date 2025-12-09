import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../utils/api";

// Skeleton component for a single user row in the table
const UserRowSkeleton = ({ columns = 5 }) => (
  <tr className="skeleton-row">
    {[...Array(columns)].map((_, index) => (
      <td key={index}>
        <div
          className="skeleton-text"
          style={{
            width: `${Math.random() * (85 - 45) + 45}%`,
            height: "1rem",
            margin: 0,
          }}
        ></div>
      </td>
    ))}
  </tr>
);

// Skeleton component for the summary stats cards
const UserCardSkeleton = () => (
  <div className="admin-card skeleton-card">
    {/* Title Skeleton */}
    <div
      className="skeleton-text"
      style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
    ></div>
    {/* Value Skeleton */}
    <div
      className="skeleton-text"
      style={{ width: "40%", height: "2rem" }}
    ></div>
  </div>
);

export default function UserManagement() {
  // State Management
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // States to control button spinners on actions
  const [isUpdatingId, setIsUpdatingId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // Fetch Users on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  /** Fetches all users from the API and maps their roles for UI display. */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      const data = response.data || [];

      const usersWithRoles = data.map((user) => ({
        ...user,
        // Maps backend logic (1/0) to frontend UI ("admin"/"user").
        role:
          user.is_admin === 1 || user.is_admin === true || user.role === "admin"
            ? "admin"
            : "user",
        registeredDate:
          user.created_at || user.registeredDate || new Date().toISOString(),
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  /** Filters users based on the current search term and role filter. */
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  /** Deletes a user permanently after checking for protected admin status. */
  const handleDeleteUser = async (userEmail, userId) => {
    if (userEmail === "admin@auratech.com") {
      alert("Cannot delete the admin account!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      try {
        setIsDeletingId(userId);
        await api.delete(`/users/${userId}`);
        const updatedUsers = users.filter((user) => user.email !== userEmail);
        setUsers(updatedUsers);
      } catch (error) {
        alert("Failed to delete user.");
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  /** Toggles the user's admin role after checking for protected admin status. */
  const handleRoleToggle = async (userEmail, userId, currentRole) => {
    if (userEmail === "admin@auratech.com") {
      alert("Cannot modify the admin account role!");
      return;
    }

    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const newRole = currentRole === "admin" ? "user" : "admin";

    const payload = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      is_admin: newRole === "admin" ? 1 : 0,
    };

    try {
      setIsUpdatingId(userId);
      await api.put(`/users/${userId}`, payload);

      const updatedUsers = users.map((user) =>
        user.email === userEmail ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Role Update Error:", error);
      alert("Failed. Check console.");
    } finally {
      setIsUpdatingId(null);
    }
  };

  /** Returns the appropriate color for the role badge. */
  const getRoleColor = (role) => {
    return role === "admin" ? "#7b1fa2" : "#0097a7";
  };

  // Loading State UI with Skeleton
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div
            className="skeleton-text"
            style={{ width: "250px", height: "2rem", marginBottom: "8px" }}
          ></div>
          <div
            className="skeleton-text"
            style={{ width: "350px", height: "1rem" }}
          ></div>
        </div>

        <div className="admin-controls">
          <div className="filter-group">
            <label className="skeleton-text" style={{ width: "100px" }}>
              &nbsp;
            </label>
            <div
              className="admin-select skeleton-text"
              style={{ width: "180px", height: "40px" }}
            ></div>
          </div>

          <div className="search-group">
            <div
              className="admin-search-input skeleton-text"
              style={{ width: "300px", height: "40px" }}
            ></div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table skeleton-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, index) => (
                <UserRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="admin-grid"
          style={{
            marginTop: "30px",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <UserCardSkeleton />
          <UserCardSkeleton />
          <UserCardSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="admin-page-header">
        <h1>User Management</h1>
        <p>Manage registered users and their permissions</p>
      </div>

      {/* Filters and Search */}
      <div className="admin-controls">
        <div className="filter-group">
          <label>Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Users</option>
            <option value="user">Regular Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isUpdating = isUpdatingId === user.id;
                const isDeleting = isDeletingId === user.id;
                const isDisabled = isUpdating || isDeleting;

                return (
                  <tr key={user.email}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getRoleColor(user.role) }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {new Date(user.registeredDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {user.email !== "admin@auratech.com" && (
                          <>
                            <button
                              onClick={() =>
                                handleRoleToggle(user.email, user.id, user.role)
                              }
                              className="btn-action btn-role"
                              title={
                                user.role === "admin" ? "Demote" : "Promote"
                              }
                              disabled={isDisabled}
                            >
                              {isUpdating ? (
                                <span
                                  className="button-spinner"
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    margin: 0,
                                  }}
                                ></span>
                              ) : user.role === "admin" ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUser(user.email, user.id)
                              }
                              className="btn-delete"
                              title="Delete User"
                              disabled={isDisabled}
                            >
                              {isDeleting ? (
                                <span
                                  className="button-spinner"
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    margin: 0,
                                  }}
                                ></span>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                        {user.email === "admin@auratech.com" && (
                          <span
                            style={{ fontSize: "0.85rem", color: "#6b7280" }}
                          >
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-grid" style={{ marginTop: "30px" }}>
        <div className="admin-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="admin-card">
          <h3>Administrators</h3>
          <p style={{ color: "#7b1fa2" }}>
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>
        <div className="admin-card">
          <h3>Regular Users</h3>
          <p style={{ color: "#0097a7" }}>
            {users.filter((u) => u.role === "user").length}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
