// src/pages/admin/Dashboard.js

import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

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
    // TODO: Replace with Laravel API call
    // fetchDashboardStats();
    loadLocalStats();
  }, []);

  // Temporary function using localStorage - Replace with API call
  const loadLocalStats = () => {
    try {
      // Get orders from localStorage
      const orders = JSON.parse(localStorage.getItem("orders")) || [];
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const inventory =
        JSON.parse(localStorage.getItem("temporary_inventory")) || {};

      // Calculate stats
      const totalSales = orders.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      );
      const newOrders = orders.filter((o) => o.status === "pending").length;
      const pendingUsers = users.filter((u) => u.role !== "admin").length;
      const criticalStock = Object.values(inventory).filter(
        (stock) => stock <= 5
      ).length;

      setStats({
        totalSales,
        newOrders,
        pendingUsers,
        criticalStock,
        loading: false,
      });

      // Get recent activity
      const recentOrders = orders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentActivity(recentOrders);
    } catch (error) {
      console.error("Error loading stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  // TODO: Implement Laravel API integration
  /*
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats({
        totalSales: data.total_sales,
        newOrders: data.new_orders,
        pendingUsers: data.pending_users,
        criticalStock: data.critical_stock,
        loading: false,
      });
      setRecentActivity(data.recent_activity || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };
  */

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
          <p>₱{stats.totalSales.toLocaleString()}</p>
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
        <h2
          style={{ marginBottom: "20px", color: "var(--color-text-primary)" }}
        >
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
                {recentActivity.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.userName}</td>
                    <td className="price-cell">
                      ₱{order.total.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            order.status === "completed"
                              ? "#10b981"
                              : order.status === "pending"
                              ? "#f59e0b"
                              : "#3b82f6",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
