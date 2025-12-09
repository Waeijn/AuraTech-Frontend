import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { orderService } from "../../services/orderService";
import { api } from "../../utils/api";

// Skeleton component for a single order row in the table
const OrderReviewRowSkeleton = ({ columns = 7 }) => (
  <tr className="skeleton-row">
    {[...Array(columns)].map((_, index) => (
      <td key={index}>
        <div
          className="skeleton-text"
          style={{
            width: `${Math.random() * (75 - 40) + 40}%`,
            height: "1rem",
            margin: 0,
          }}
        ></div>
      </td>
    ))}
  </tr>
);

// Skeleton component for the summary stats cards
const OrderReviewCardSkeleton = () => (
  <div className="admin-card skeleton-card">
    <div
      className="skeleton-text"
      style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
    ></div>
    <div
      className="skeleton-text"
      style={{ width: "40%", height: "2rem" }}
    ></div>
  </div>
);

/**
 * Displays all customer orders with filtering, searching,
 * status management, and deletion functionality.
 */
export default function OrderReview() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // States to control button spinners on actions
  const [isUpdatingId, setIsUpdatingId] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  /** Fetches all orders from API and stores them in state. */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.data || []);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  /** Applies search and filter logic on all orders. */
  const filteredOrders = orders.filter((order) => {
    const status = order.status || "";
    const userName = order.user?.name || order.userName || "Guest";
    const userEmail = order.user?.email || order.userEmail || "N/A";
    const orderId = order.id.toString();

    const matchesFilter =
      filter === "all" || status.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      orderId.includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  /**
   * UPDATED: Checks if order status can be changed
   * Completed and cancelled orders are locked
   */
  const isStatusLocked = (status) => {
    const s = (status || "").toLowerCase();
    return s === "completed" || s === "cancelled";
  };

  /** Updates order status in the backend and instantly updates UI. */
  const handleStatusChange = async (orderId, newStatus, currentStatus) => {
    //  Prevent changing completed/cancelled orders
    if (isStatusLocked(currentStatus)) {
      alert("Cannot change status of completed or cancelled orders.");
      return;
    }

    try {
      setIsUpdatingId(orderId);

      await api.put(`/orders/${orderId}`, { status: newStatus });

      // Update local state so UI changes instantly
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update status.");
    } finally {
      setIsUpdatingId(null);
    }
  };

  /**
   *  UPDATED: Prevents deletion of completed orders
   */
  const handleDeleteOrder = async (orderId, status) => {
    //  Prevent deleting completed orders
    if ((status || "").toLowerCase() === "completed") {
      alert(
        "Cannot delete completed orders. Please cancel the order first if needed."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        setIsDeletingId(orderId);
        await api.delete(`/orders/${orderId}`);

        // Remove order from UI
        const updatedOrders = orders.filter((order) => order.id !== orderId);
        setOrders(updatedOrders);
        alert("Order deleted successfully.");
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete order.");
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  /** Returns corresponding color based on status. */
  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return "#f59e0b";
      case "processing":
        return "#3b82f6";
      case "completed":
      case "delivered":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Loading State UI with Skeleton
  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page-header">
          <div
            className="skeleton-text"
            style={{ width: "250px", height: "2rem", marginBottom: "8px" }}
          ></div>
          <div
            className="skeleton-text"
            style={{ width: "350px", height: "1rem" }}
          ></div>
        </div>

        <div className="admin-controls">
          <div className="filter-group">
            <label className="skeleton-text" style={{ width: "100px" }}>
              &nbsp;
            </label>
            <div
              className="admin-select skeleton-text"
              style={{ width: "180px", height: "40px" }}
            ></div>
          </div>

          <div className="search-group">
            <div
              className="admin-search-input skeleton-text"
              style={{ width: "300px", height: "40px" }}
            ></div>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table skeleton-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, index) => (
                <OrderReviewRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="admin-grid"
          style={{
            marginTop: "30px",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          <OrderReviewCardSkeleton />
          <OrderReviewCardSkeleton />
          <OrderReviewCardSkeleton />
          <OrderReviewCardSkeleton />
          <OrderReviewCardSkeleton />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Order Review</h1>
        <p>Manage and track all customer orders</p>
      </div>

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
            placeholder="Search Order ID, Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

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
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.map((order) => {
                const userName = order.user?.name || order.userName || "Guest";
                const userEmail = order.user?.email || order.userEmail || "N/A";
                const total = order.total || 0;
                const itemsCount = order.items ? order.items.length : 0;
                const isUpdating = isUpdatingId === order.id;
                const isDeleting = isDeletingId === order.id;
                const locked = isStatusLocked(order.status); // ✅ Check if locked

                return (
                  <tr key={order.id}>
                    <td>#{order.order_number || order.id}</td>
                    <td>{userName}</td>
                    <td>{userEmail}</td>
                    <td className="price-cell">
                      ₱
                      {(total / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{itemsCount} item(s)</td>

                    {/* Status Badge */}
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(order.status),
                        }}
                      >
                        {order.status}
                        {locked && (
                          <span
                            style={{ marginLeft: "5px" }}
                            title="Status locked"
                          ></span>
                        )}
                      </span>
                    </td>

                    {/* Status Change + Delete */}
                    <td>
                      <div
                        className="action-buttons"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {locked ? (
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "#888",
                              fontStyle: "italic",
                              padding: "6px 12px",
                            }}
                          >
                            Status Locked
                          </span>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(
                                order.id,
                                e.target.value,
                                order.status
                              )
                            }
                            className="status-select"
                            disabled={isUpdating || isDeleting}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        )}

                        {/* Delete order */}
                        <button
                          onClick={() =>
                            handleDeleteOrder(order.id, order.status)
                          }
                          className="btn-delete"
                          title={
                            (order.status || "").toLowerCase() === "completed"
                              ? "Cannot delete completed orders"
                              : "Delete Order"
                          }
                          disabled={
                            isDeleting ||
                            isUpdating ||
                            (order.status || "").toLowerCase() === "completed"
                          }
                          style={{
                            minWidth: "40px",
                            opacity:
                              (order.status || "").toLowerCase() === "completed"
                                ? 0.5
                                : 1,
                            cursor:
                              (order.status || "").toLowerCase() === "completed"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {isDeleting ? (
                            <span className="button-spinner"></span>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          )}
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
      <div
        className="admin-grid"
        style={{
          marginTop: "30px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        <div className="admin-card">
          <h3>Total Orders</h3>
          <p>{orders.length}</p>
        </div>

        <div className="admin-card">
          <h3>Pending</h3>
          <p style={{ color: "#f59e0b" }}>
            {
              orders.filter((o) => (o.status || "").toLowerCase() === "pending")
                .length
            }
          </p>
        </div>

        <div className="admin-card">
          <h3>Processing</h3>
          <p style={{ color: "#3b82f6" }}>
            {
              orders.filter(
                (o) => (o.status || "").toLowerCase() === "processing"
              ).length
            }
          </p>
        </div>

        <div className="admin-card">
          <h3>Completed</h3>
          <p style={{ color: "#10b981" }}>
            {
              orders.filter(
                (o) => (o.status || "").toLowerCase() === "completed"
              ).length
            }
          </p>
        </div>

        <div className="admin-card">
          <h3>Cancelled</h3>
          <p style={{ color: "#ef4444" }}>
            {
              orders.filter(
                (o) => (o.status || "").toLowerCase() === "cancelled"
              ).length
            }
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
