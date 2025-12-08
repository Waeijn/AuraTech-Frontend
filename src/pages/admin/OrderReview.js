import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { orderService } from "../../services/orderService"; 
import { api } from "../../utils/api"; 

/**
 * Displays all customer orders with filtering, searching,
 * status management, and deletion functionality.
 */
export default function OrderReview() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * Fetches all orders from API
   * and stores them in state.
   */
  const fetchOrders = async () => {
    try {
      const response = await orderService.getAll();
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies search and filter logic on all orders.
   * Supports searching by: order ID, name, or email.
   */
  const filteredOrders = orders.filter((order) => {
    const status = order.status || "";
    const userName = order.user?.name || order.userName || "Guest";
    const userEmail = order.user?.email || order.userEmail || "N/A";
    const orderId = order.id.toString();

    const matchesFilter = filter === "all" || status.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      orderId.includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  /**
   * Updates order status in the backend
   * and instantly updates UI without page refresh.
   */
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });

      // Update local state so UI changes instantly
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  /**
   * Deletes an order permanently.
   * Asks for confirmation before removing.
   */
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/orders/${orderId}`);

        // Remove order from UI
        const updatedOrders = orders.filter((order) => order.id !== orderId);
        setOrders(updatedOrders);
      } catch (error) {
        alert("Failed to delete order.");
      }
    }
  };

  /**
   * Returns corresponding color based on status.
   */
  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "completed": case "delivered": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1>Order Review</h1>
        <p>Manage and track all customer orders</p>
      </div>

      {/* Filter + Search Controls */}
      <div className="admin-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="admin-select">
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
            placeholder="Search Order ID, Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        {loading ? <p>Loading orders...</p> : filteredOrders.length === 0 ? (
          <div className="empty-state"><p>No orders found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th> {/* Important column restored */}
                <th>Total</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => {
                const userName = order.user?.name || order.userName || "Guest";
                const userEmail = order.user?.email || order.userEmail || "N/A"; 
                const total = order.total_amount || order.total || 0;
                const itemsCount = order.items ? order.items.length : 0;

                return (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{userName}</td>
                    <td>{userEmail}</td>
                    <td className="price-cell">₱{total.toLocaleString()}</td>
                    <td>{itemsCount} item(s)</td>

                    {/* Status Badge */}
                    <td>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {order.status}
                      </span>
                    </td>

                    {/* Status Change + Delete */}
                    <td>
                      <div className="action-buttons" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        
                        {/* Update order status */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Delete order */}
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* STATISTICS CARDS */}
      <div className="admin-grid" style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <div className="admin-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>

        <div className="admin-card">
          <h3>Pending</h3>
          <p style={{ color: "#f59e0b" }}>{orders.filter((o) => (o.status || "").toLowerCase() === "pending").length}</p>
        </div>

        <div className="admin-card">
          <h3>Processing</h3>
          <p style={{ color: "#3b82f6" }}>{orders.filter((o) => (o.status || "").toLowerCase() === "processing").length}</p>
        </div>

        <div className="admin-card">
          <h3>Completed</h3>
          <p style={{ color: "#10b981" }}>{orders.filter((o) => (o.status || "").toLowerCase() === "completed").length}</p>
        </div>

        <div className="admin-card">
          <h3>Cancelled</h3>
          <p style={{ color: "#ef4444" }}>{orders.filter((o) => (o.status || "").toLowerCase() === "cancelled").length}</p>
        </div>
      </div>
    </AdminLayout>
  );
}
