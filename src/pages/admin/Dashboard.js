import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
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

  // --- HELPER: Match User Side Calculation (10% Ship + 12% Tax) ---
  const calculateOrderTotal = (order) => {
    // If no items, fallback to DB total
    if (!order.items || order.items.length === 0) return Number(order.total || 0);

    const subtotal = order.items.reduce((sum, item) => {
        // Handle potential naming differences
        const price = Number(item.product_price || item.product?.price || item.price || 0);
        return sum + (price * item.quantity);
    }, 0);

    const shipping = subtotal * 0.10;
    const tax = subtotal * 0.12; 

    return subtotal + shipping + tax;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Data using Service Layer
      const ordersRes = await api.get('/orders?per_page=100');
      const productsRes = await api.get('/products?per_page=100');
      const usersRes = await api.get('/users');

      const orders = ordersRes.success ? ordersRes.data : [];
      const products = productsRes.success ? productsRes.data : [];
      const users = usersRes.success ? usersRes.data : [];

      // 2. Calculate Stats using the HELPER
      // FIX: Sum up the CALCULATED totals to match the receipt
      const totalSales = orders.reduce((sum, order) => {
          return sum + calculateOrderTotal(order);
      }, 0);

      const newOrders = orders.filter((o) => o.status === "pending").length;
      const criticalStock = products.filter((p) => p.stock <= 5).length;

      setStats({
        totalSales, 
        newOrders,
        pendingUsers: users.length,
        criticalStock,
        loading: false,
      });

      setRecentActivity(orders.slice(0, 5));

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

  // --- DESIGN: EXACTLY THE SAME ---
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
                      {/* FIX: Use Helper here too */}
                      ₱{calculateOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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