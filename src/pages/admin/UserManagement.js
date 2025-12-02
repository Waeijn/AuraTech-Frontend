import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { api } from "../../utils/api"; // FIX: Import Service Layer

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // 1. Fetch Users (FIX: Use api.get)
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Filter Logic (Preserved)
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = user.role || (user.is_admin ? "admin" : "user");
    const matchesRole = roleFilter === "all" || userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // 3. Delete User (FIX: Use api.delete)
  const handleDeleteUser = async (userId, userEmail) => {
    if (userEmail === "admin@auratech.com") {
      alert("Cannot delete the main admin account!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user: ${userEmail}?`)) return;

    try {
      await api.delete(`/users/${userId}`);
      alert("User deleted successfully.");
      fetchUsers(); 
    } catch (error) {
      alert("Error deleting user.");
    }
  };

  // 4. Toggle Role (FIX: Use api.put)
  const handleRoleToggle = async (user) => {
    if (user.email === "admin@auratech.com") {
      alert("Cannot modify the main admin account!");
      return;
    }

    const currentRole = user.role || (user.is_admin ? "admin" : "user");
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      await api.put(`/users/${user.id}`, { role: newRole });
      alert(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      alert("Error updating role.");
    }
  };

  const getRoleColor = (role) => (role === "admin" ? "#7b1fa2" : "#0097a7");

  if (loading) return <AdminLayout><p style={{padding:"20px"}}>Loading users...</p></AdminLayout>;

  // --- DESIGN: EXACTLY THE SAME AS BEFORE ---
  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>User Management</h1>
        <p>Manage registered users and their permissions</p>
      </div>

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
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state"><p>No users found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getRoleColor(user.role || (user.is_admin ? "admin" : "user")) }}>
                      {user.role || (user.is_admin ? "admin" : "user")}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.email !== "admin@auratech.com" && (
                        <>
                          <button onClick={() => handleRoleToggle(user)} className="btn-action btn-role" title="Toggle Role">
                            Change Role
                          </button>
                          <button onClick={() => handleDeleteUser(user.id, user.email)} className="btn-delete" title="Delete User">
                             🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}