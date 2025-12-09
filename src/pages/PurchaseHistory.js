import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import "../styles/purchase.css";
import { orderService } from "../services/orderService";

// Skeleton component for a single order row
const OrderItemSkeleton = () => (
  <tr className="order-item-skeleton" style={{ pointerEvents: "none" }}>
    <td>
      <div
        className="skeleton-text"
        style={{ width: "80%", height: "1rem" }}
      ></div>
    </td>
    <td>
      <div
        className="skeleton-text"
        style={{ width: "60%", height: "1rem" }}
      ></div>
    </td>
    <td>
      <div
        className="skeleton-text"
        style={{ width: "50%", height: "1rem" }}
      ></div>
    </td>
    <td>
      <div
        className="skeleton-text"
        style={{ width: "40%", height: "1rem" }}
      ></div>
    </td>
    <td>
      <div
        className="skeleton-text"
        style={{ width: "60%", height: "1rem" }}
      ></div>
    </td>
  </tr>
);

export default function PurchaseHistory() {
  const { currentUser } = useAuth();

  // State
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define status categories - IMPROVED STATUS HANDLING
  const ACTIVE_STATUSES = [
    "for shipping",
    "pending",
    "processing",
    "confirmed",
    "preparing",
    "shipped",
  ];
  const COMPLETED_STATUSES = [
    "delivered",
    "cancelled",
    "completed",
    "refunded",
  ];

  // Fetch Purchase History
  const refreshHistory = useCallback(async () => {
    if (currentUser) {
      try {
        setLoading(true);
        const response = await orderService.getAll();
        const orders = response.data || [];
        setAllHistory(orders);

        const allStatuses = orders
          .map((o) => o.status?.toLowerCase()?.trim())
          .filter(Boolean);
        const uniqueStatuses = [...new Set(allStatuses)];
        const uncategorized = uniqueStatuses.filter(
          (status) =>
            !ACTIVE_STATUSES.includes(status) &&
            !COMPLETED_STATUSES.includes(status)
        );

        if (uncategorized.length > 0) {
          console.warn("⚠️ Uncategorized order statuses found:", uncategorized);
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Cancel Order
  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await orderService.cancel(orderId);
        alert("Order cancelled successfully.");
        refreshHistory();
      } catch (e) {
        const reason =
          e.response?.data?.message || "Cancel failed. Please try again.";
        alert(reason);
      }
    }
  };

  // Helper to normalize status
  const normalizeStatus = (status) => {
    return status?.toLowerCase()?.trim() || "";
  };

  // Helper functions
  const formatPrice = (amt) =>
    Number(amt).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString()
      : new Date().toLocaleDateString();

  // Loading State - SKELETON LOADER
  if (loading) {
    return (
      <div className="purchase-history-container">
        <div
          className="skeleton-text"
          style={{
            width: "350px",
            height: "2.8rem",
            marginBottom: "5px",
            borderRadius: "8px",
          }}
        ></div>
        <div
          className="skeleton-text"
          style={{
            width: "50%",
            height: "1rem",
            marginBottom: "40px",
          }}
        ></div>

        <table className="purchase-history-table skeleton-table">
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
            <OrderItemSkeleton />
            <OrderItemSkeleton />
            <OrderItemSkeleton />
            <OrderItemSkeleton />
          </tbody>
        </table>
      </div>
    );
  }

  // Empty State: No Orders
  if (allHistory.length === 0) {
    return (
      <div className="purchase-history-container">
        <h1>My Orders</h1>
        <div className="empty-state-container">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No orders yet</h2>
          <p className="empty-state-subtext">
            Looks like you haven't made your first purchase.
          </p>
          <Link to="/products" className="btn-start-shopping">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Split Orders by Status
  const activeOrders = allHistory.filter((o) =>
    ACTIVE_STATUSES.includes(normalizeStatus(o.status))
  );

  const completedOrders = allHistory.filter((o) =>
    COMPLETED_STATUSES.includes(normalizeStatus(o.status))
  );

  // Catch any orders with unexpected statuses
  const uncategorizedOrders = allHistory.filter((o) => {
    const status = normalizeStatus(o.status);
    return (
      status &&
      !ACTIVE_STATUSES.includes(status) &&
      !COMPLETED_STATUSES.includes(status)
    );
  });

  // Render
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
            activeOrders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order ID">
                  <strong>#{order.id}</strong>
                </td>
                <td data-label="Date">
                  {formatDate(order.created_at || order.date)}
                </td>
                <td data-label="Total">
                  {formatPrice(order.total || order.total_amount)}
                </td>
                <td data-label="Status">
                  <span
                    className={`status-tag status-${normalizeStatus(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td data-label="Actions">
                  {normalizeStatus(order.status) === "pending" ? (
                    <button
                      className="btn-cancel-order"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color: "#888",
                        fontStyle: "italic",
                      }}
                    >
                      In Progress
                    </span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="5"
                style={{ textAlign: "center", padding: "30px", color: "#888" }}
              >
                No active orders.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="history-separator"></div>

      {/* COMPLETED ORDERS */}
      <h2>Completed History</h2>
      {completedOrders.length > 0 ? (
        <table className="purchase-history-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {completedOrders.map((order) => (
              <tr key={order.id}>
                <td data-label="Order ID">
                  <strong>#{order.id}</strong>
                </td>
                <td data-label="Date">
                  {formatDate(order.created_at || order.date)}
                </td>
                <td data-label="Total">
                  {formatPrice(order.total || order.total_amount)}
                </td>
                <td data-label="Status">
                  <span
                    className={`status-tag status-${normalizeStatus(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state-text">No completed history.</p>
      )}

      {/* UNCATEGORIZED ORDERS - For debugging */}
      {uncategorizedOrders.length > 0 && (
        <>
          <div className="history-separator"></div>
          <h2>Other Orders</h2>
          <table className="purchase-history-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {uncategorizedOrders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order ID">
                    <strong>#{order.id}</strong>
                  </td>
                  <td data-label="Date">
                    {formatDate(order.created_at || order.date)}
                  </td>
                  <td data-label="Total">
                    {formatPrice(order.total || order.total_amount)}
                  </td>
                  <td data-label="Status">
                    <span
                      className={`status-tag status-${normalizeStatus(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
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
