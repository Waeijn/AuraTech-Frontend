// src/pages/admin/OrderReview.js

import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

export default function OrderReview() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Load orders from localStorage on mount
  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(storedOrders);
  }, []);

  // Filter orders based on status and search
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    const matchesSearch =
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Update order status
  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  // Delete order
  const handleDeleteOrder = (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      const updatedOrders = orders.filter((order) => order.id !== orderId);
      setOrders(updatedOrders);
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "processing":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Order Review</h1>
        <p>Manage and track all customer orders</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="admin-select"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search by Order ID, Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Items</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.userName}</td>
                  <td>{order.userEmail}</td>
                  <td className="price-cell">
                    ₱{order.total.toLocaleString()}
                  </td>
                  <td>{order.items.length} item(s)</td>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="btn-delete"
                        title="Delete Order"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Stats */}
      <div className="admin-grid" style={{ marginTop: "30px" }}>
        <div className="admin-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>
        <div className="admin-card">
          <h3>Pending</h3>
          <p style={{ color: "#f59e0b" }}>
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="admin-card">
          <h3>Processing</h3>
          <p style={{ color: "#3b82f6" }}>
            {orders.filter((o) => o.status === "processing").length}
          </p>
        </div>
        <div className="admin-card">
          <h3>Completed</h3>
          <p style={{ color: "#10b981" }}>
            {orders.filter((o) => o.status === "completed").length}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
