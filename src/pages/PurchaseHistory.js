import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; 
import { useAuth } from "../components/Navbar";
import { orderService } from "../services/orderService"; // Import Service
import "../styles/purchase.css";

export default function PurchaseHistory() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Orders (Using Service)
  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      // Service handles token automatically
      const response = await orderService.getAll();

      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  // Cancel Handler (Using Service)
  const handleCancelOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      // Use Service
      const response = await orderService.cancel(orderId);
      
      if (response.success) {
        alert("Order cancelled successfully.");
        fetchOrders(true); 
      } else {
        alert(response.message || "Could not cancel order.");
      }
    } catch (err) {
      alert("Error cancelling order.");
    }
  };

  // Helper to Recalculate Total
  const calculateOrderTotal = (order) => {
    if (!order.items) return 0;
    const subtotal = order.items.reduce((sum, item) => {
        return sum + (Number(item.product_price || item.price) * item.quantity);
    }, 0);
    const shipping = subtotal * 0.10;
    const tax = subtotal * 0.12;
    return subtotal + shipping + tax;
  };

  if (!currentUser) return <div className="purchase-history-container"><p>Please log in.</p></div>;
  if (loading) return <div className="purchase-history-container"><p>Loading history...</p></div>;

  return (
    <div className="purchase-history-container">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="empty-state-text">
            <p>You haven't placed any orders yet.</p>
            <Link to="/products" className="btn-main start-shopping-btn">
                Start Shopping
            </Link>
        </div>
      ) : (
        <>
            <p className="history-subtext">Track and manage your purchase history</p>
            <table className="purchase-history-table">
            <thead>
                <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>₱{calculateOrderTotal(order).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                    <span className={`status-tag ${order.status.toLowerCase()}`}>
                        {order.status}
                    </span>
                    </td>
                    <td>
                    {order.status === 'pending' && (
                        <button 
                        className="btn-cancel-order" 
                        onClick={() => handleCancelOrder(order.id)}
                        >
                        Cancel
                        </button>
                    )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </>
      )}
    </div>
  );
}