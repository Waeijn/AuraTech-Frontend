import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import { api } from "../../utils/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    newOrders: 0,
    pendingUsers: 0,
    criticalStock: 0,
    loading: true,
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // 1. Fetch real data from APIs
      const orderRes = await orderService.getAll();
      const orders = orderRes.data || [];

      const productRes = await productService.getAll();
      const products = Array.isArray(productRes.data) ? productRes.data : (productRes.data?.data || []);

      // Fetch users count if possible, otherwise rely on local fallback or simple API
      let usersCount = 0;
      try {
        const userRes = await api.get('/users');
        usersCount = userRes.data?.length || 0;
      } catch (e) {
        console.warn("User stats fetch failed");
      }

      // 2. Calculate Stats from real data
      const totalSales = orderService
        .filter(order => (order.status || "").toLowerCase() !== 'cancelled')
        .reduce(
          (sum, order) => sum + (order.total_amount || order.total || 0),
          0
        );

      const newOrders = orders.filter((o) => (o.status || "").toLowerCase() === "pending").length;
      
      const criticalStock = products.filter(
        (p) => (p.stock || 0) <= 5
      ).length;

      setStats({
        totalSales,
        newOrders,
        pendingUsers: usersCount,
        criticalStock,
        loading: false,
      });

      // 3. Get recent activity
      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        .slice(0, 5);
      setRecentActivity(recentOrders);

    } catch (error) {
      console.error("Error loading stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <h2>Loading dashboard...</h2>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome, Admin! Here is a summary of your key metrics.</p>
      </div>

      {/* Stats Cards */}
      <div className="admin-grid">
        <div className="admin-card">
          <h3>Total Sales</h3>
          <p>₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="admin-card">
          <h3>New Orders</h3>
          <p>{stats.newOrders}</p>
        </div>
        <div className="admin-card">
          <h3>Pending Users</h3>
          <p>{stats.pendingUsers}</p>
        </div>
        <div className="admin-card" style={{ borderLeftColor: "#ef4444" }}>
          <h3>Stock Alerts</h3>
          <p style={{ color: "#ef4444" }}>
            {stats.criticalStock} critical items
          </p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ marginBottom: "20px", color: "var(--color-text-primary)" }}>
          Recent Activity
        </h2>
        <div className="admin-table-container">
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity to display.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((order) => {
                   const userName = order.user?.name || order.userName || "Guest";
                   const total = order.total_amount || order.total || 0;
                   const status = order.status || "pending";
                   
                   return (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{userName}</td>
                        <td className="price-cell">
                          ₱{total.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor:
                                status === "completed" || status === "delivered"
                                  ? "#10b981"
                                  : status === "pending"
                                  ? "#f59e0b"
                                  : status === "cancelled"
                                  ? "#ef4444"
                                  : "#3b82f6",
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td>{new Date(order.created_at || order.date).toLocaleDateString()}</td>
                      </tr>
                   );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}