import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; 
import { useAuth } from "../components/Navbar";
import "../styles/purchase.css";
import { orderService } from "../services/orderService"; 

export default function PurchaseHistory() {
  const { currentUser } = useAuth();
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshHistory = useCallback(async () => {
    if (currentUser) {
      try {
        setLoading(true);
        const response = await orderService.getAll();
        setAllHistory(response.data || []);
      } catch (error) { 
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel?")) {
      try {
        await orderService.cancel(orderId);
        alert("Order cancelled successfully.");
        refreshHistory();
      } catch (e) { 
        const reason = e.response?.data?.message || "Cancel failed. Please try again.";
        alert(reason); 
      }
    }
  };

  const formatPrice = (amt) => Number(amt).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();

  if (loading) {
    return <div className="purchase-history-container"><p>Loading orders...</p></div>;
  }

  if (allHistory.length === 0) {
    return (
      <div className="purchase-history-container">
        <h1>My Orders</h1>
        <div className="empty-state-container">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No orders yet</h2>
          <p className="empty-state-subtext">Looks like you haven't made your first purchase.</p>
          <Link to="/products" className="btn-start-shopping">Start Shopping</Link>
        </div>
      </div>
    );
  }

  const activeOrders = allHistory.filter(o => 
    ['for shipping', 'pending', 'processing'].includes(o.status?.toLowerCase())
  );
  
  const completedOrders = allHistory.filter(o => 
    ['delivered', 'cancelled'].includes(o.status?.toLowerCase())
  );

  return (
    <div className="purchase-history-container">
      <h1>My Orders</h1>
      <p className="history-subtext">Track and manage your purchase history</p>

      {/* ACTIVE ORDERS */}
      <table className="purchase-history-table">
        <thead>
          <tr>
            <th>ORDER ID</th>
            <th>DATE</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {activeOrders.length > 0 ? (
            activeOrders.map(order => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td>{formatDate(order.created_at || order.date)}</td>
                <td>{formatPrice(order.total || order.total_amount)}</td>
                <td><span className={`status-tag status-${order.status?.toLowerCase()}`}>{order.status}</span></td>
                <td>
                  {(order.status || "").toLowerCase() === 'pending' ? (
                    <button className="btn-cancel-order" onClick={() => handleCancelOrder(order.id)}>Cancel</button>
                  ) : (
                    <span style={{ fontSize: "0.9rem", color: "#888", fontStyle: "italic" }}>
                      In Progress
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" style={{textAlign: "center", padding: "30px", color: "#888"}}>No active orders.</td></tr>
          )}
        </tbody>
      </table>
      
      <div className="history-separator"></div>
      
      {/* COMPLETED ORDERS */}
      <h2>Completed History</h2>
      {completedOrders.length > 0 ? (
        <table className="purchase-history-table">
          <thead>
            <tr><th>ORDER ID</th><th>DATE</th><th>TOTAL</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {completedOrders.map(order => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td>{formatDate(order.created_at || order.date)}</td>
                <td>{formatPrice(order.total || order.total_amount)}</td>
                <td><span className={`status-tag status-${order.status?.toLowerCase()}`}>{order.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state-text">No completed history.</p>
      )}
    </div>
  );
}