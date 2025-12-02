import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE_URL = "http://localhost:8082/api";

export default function OrderReview() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const response = await fetch(`${API_BASE_URL}/orders?per_page=100`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setOrders(data.data);
      } else {
        console.error("Failed to load orders:", data.message);
      }
    } catch (error) {
      console.error("Admin fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status === filter;
    
    const orderId = order.order_number || order.id || "";
    const name = order.shipping_name || order.user?.name || "Guest";
    const email = order.shipping_email || order.user?.email || "N/A";

    const matchesSearch =
      orderId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  // REAL API INTEGRATION HERE
  const handleStatusChange = async (orderId, newStatus) => {
    // 1. Optimistic UI Update (Update screen immediately)
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);

    // 2. Send Update to Backend
    try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            alert("Failed to update status on server. Please refresh.");
            fetchOrders(); // Revert changes on failure
        }
    } catch (error) {
        console.error("Error updating order:", error);
        fetchOrders();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "processing": return "#3b82f6";
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) return <AdminLayout><p style={{padding:"20px"}}>Loading orders...</p></AdminLayout>;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Order Review</h1>
        <p>Manage and track all customer orders</p>
      </div>

      <div className="admin-grid" style={{ marginTop: "20px", marginBottom: "30px" }}>
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
            placeholder="Search Order ID, Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      <div className="admin-table-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state"><p>No orders found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.shipping_name || order.user?.name}</td>
                  <td>{order.shipping_email || order.user?.email}</td>
                  <td className="price-cell">₱{Number(order.total).toLocaleString()}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
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