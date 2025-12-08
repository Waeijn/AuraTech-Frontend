import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../utils/api"; 

export default function UserManagement() {
  // State Management 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch Users on Mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const data = response.data || [];
      
      const usersWithRoles = data.map((user) => ({
        ...user,
        // Map backend logic (1/0) to frontend UI ("admin"/"user")
        role: (user.is_admin === 1 || user.is_admin === true || user.role === 'admin') ? "admin" : "user",
        registeredDate: user.created_at || user.registeredDate || new Date().toISOString(),
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtering Users 
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Delete User
  const handleDeleteUser = async (userEmail, userId) => {
    if (userEmail === "admin@auratech.com") {
      alert("Cannot delete the admin account!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      try {
        await api.delete(`/users/${userId}`);
        const updatedUsers = users.filter((user) => user.email !== userEmail);
        setUsers(updatedUsers);
      } catch (error) {
        alert("Failed to delete user.");
      }
    }
  };

  // Toggle Role
  const handleRoleToggle = async (userEmail, userId, currentRole) => {
    if (userEmail === "admin@auratech.com") {
      alert("Cannot modify the admin account role!");
      return;
    }

    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const newRole = currentRole === "admin" ? "user" : "admin";

    const payload = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      is_admin: newRole === "admin" ? 1 : 0 
    };

    try {
      await api.put(`/users/${userId}`, payload);
      
      // Update UI
      const updatedUsers = users.map((user) =>
        user.email === userEmail ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      
    } catch (error) {
      console.error("Role Update Error:", error);
      alert("Failed. Check console.");
    }
  };

  const getRoleColor = (role) => {
    return role === "admin" ? "#7b1fa2" : "#0097a7";
  };

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
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="admin-select">
            <option value="all">All Users</option>
            <option value="user">Regular Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="search-group">
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="admin-search-input" />
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        {loading ? <p>Loading users...</p> : filteredUsers.length === 0 ? (
          <div className="empty-state"><p>No users found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Registered</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.email}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.registeredDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.email !== "admin@auratech.com" && (
                        <>
                          <button
                            onClick={() => handleRoleToggle(user.email, user.id, user.role)}
                            className="btn-action btn-role"
                            title={user.role === "admin" ? "Demote" : "Promote"}
                          >
                            {user.role === "admin" ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            )}
                          </button>
                          <button onClick={() => handleDeleteUser(user.email, user.id)} className="btn-delete" title="Delete User">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </>
                      )}
                      {user.email === "admin@auratech.com" && <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Protected</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="admin-grid" style={{ marginTop: "30px" }}>
        <div className="admin-card"><h3>Total Users</h3><p>{users.length}</p></div>
        <div className="admin-card"><h3>Administrators</h3><p style={{ color: "#7b1fa2" }}>{users.filter(u => u.role === "admin").length}</p></div>
        <div className="admin-card"><h3>Regular Users</h3><p style={{ color: "#0097a7" }}>{users.filter(u => u.role === "user").length}</p></div>
      </div>
    </AdminLayout>
  );
}