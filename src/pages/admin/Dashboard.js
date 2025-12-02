import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE_URL = "http://localhost:8082/api";

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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // 1. Fetch Orders 
      const ordersRes = await fetch(`${API_BASE_URL}/orders?per_page=100`, { headers });
      const ordersData = await ordersRes.json();
      
      // 2. Fetch Products
      const productsRes = await fetch(`${API_BASE_URL}/products?per_page=100`);
      const productsData = await productsRes.json();

      // 3. Fetch Users (ADDED THIS TO FIX USER COUNT)
      const usersRes = await fetch(`${API_BASE_URL}/users`, { headers });
      const usersData = await usersRes.json();

      if (ordersData.success && productsData.success) {
        const orders = ordersData.data || [];
        const products = productsData.data || [];
        const users = usersData.success ? (usersData.data || []) : [];

        // Calculate Total Sales
        const totalSales = orders.reduce((sum, order) => {
            // Use the total from the DB if available, otherwise calculate
            return sum + Number(order.total);
        }, 0);

        const newOrders = orders.filter((o) => o.status === "pending").length;
        
        // Count users (excluding admin if preferred, or all users)
        const pendingUsers = users.length; 
        
        // Critical Stock: Items with stock <= 5
        const criticalStock = products.filter((p) => p.stock <= 5).length;

        setStats({
          totalSales,
          newOrders,
          pendingUsers, // Now using real data
          criticalStock,
          loading: false,
        });

        // Set Recent Activity (Last 5 orders)
        setRecentActivity(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <AdminLayout>
        <div className="loading-container" style={{ padding: "40px", textAlign: "center" }}>
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

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Total Sales</h3>
          <p>₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="admin-card">
          <h3>New Orders (Pending)</h3>
          <p>{stats.newOrders}</p>
        </div>
        <div className="admin-card">
          <h3>Total Users</h3>
          <p>{stats.pendingUsers}</p>
        </div>
        <div className="admin-card" style={{ borderLeftColor: "#ef4444" }}>
          <h3>Stock Alerts</h3>
          <p style={{ color: "#ef4444" }}>
            {stats.criticalStock} critical items
          </p>
        </div>
      </div>

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
                {recentActivity.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.shipping_name || order.user?.name}</td>
                    <td className="price-cell">
                      ₱{Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor:
                            order.status === "completed" ? "#10b981"
                              : order.status === "pending" ? "#f59e0b"
                              : "#3b82f6",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
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