import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/purchase.css";
import productsData from "../data/products.json";

const PURCHASE_HISTORY_KEY = "purchaseHistory";
const INVENTORY_KEY = "temporary_inventory";

// --- Utility Functions for Inventory and History Management ---

/**
 * Initializes and retrieves product stock/inventory from local storage.
 * @returns {object} The current inventory object {productId: stockCount}.
 */
const getInventory = () => {
  let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  if (!inventory) {
    const initialStock = {};
    productsData.forEach((p) => {
      initialStock[p.id] = p.stock || 99999;
    });
    inventory = initialStock;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
  return inventory;
};

/**
 * Saves the updated inventory object back to local storage.
 * @param {object} inventory - The inventory object to save.
 */
const saveInventory = (inventory) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
};

/**
 * Restocks items by adding their quantity back to the temporary inventory.
 * Used when an order is cancelled.
 * @param {Array} items - List of items with their IDs and quantities to restock.
 */
const restockItems = (items) => {
  const currentInventory = getInventory();

  items.forEach((item) => {
    const itemId = item.id;
    const returnedQty = item.quantity;
    // Safely add returned quantity to the current stock
    currentInventory[itemId] = (currentInventory[itemId] || 0) + returnedQty;
  });

  saveInventory(currentInventory);
  console.log("Stock successfully returned to temporary local inventory.");
};

/**
 * Fetches the purchase history filtered specifically for the logged-in user.
 * @param {string} userEmail - The email of the current user.
 * @returns {Array} List of orders belonging to the user.
 */
const getPurchaseHistory = (userEmail) => {
  const allHistory =
    JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];
  return allHistory.filter((order) => order.userEmail === userEmail);
};

// --- OrderTable Sub-Component ---

/**
 * OrderTable Component
 * Renders a stylized table of orders for a specific category (e.g., Active or Completed).
 */
const OrderTable = ({
  title,
  orders,
  handleCancelOrder,
  handleConfirmDelivery,
  showActions = true,
}) => {
  if (orders.length === 0) {
    return (
      <section className="purchase-section">
        <h2>
          {title} ({orders.length})
        </h2>
        <p>No orders found in this category.</p>
      </section>
    );
  }

  return (
    <section className="purchase-section">
      <h2>
        {title} ({orders.length})
      </h2>
      <table className="purchase-history-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.orderId}>
              <td>{order.orderId}</td>
              <td>{order.date}</td>
              {/* Display list of items in the order */}
              <td>
                <ul className="item-list">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </td>
              {/* Display formatted total price */}
              <td className="order-total">
                ₱
                {order.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              {/* Display stylized status tag */}
              <td>
                <span
                  className={`status-tag status-${order.status
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  {order.status}
                </span>
              </td>
              {/* Conditional Actions column */}
              {showActions && (
                <td>
                  {order.status === "For Shipping" && (
                    <div className="action-buttons">
                      <button
                        className="btn-action-primary"
                        onClick={() => handleConfirmDelivery(order.orderId)}
                      >
                        Received
                      </button>
                      <button
                        className="btn-cancel-order"
                        onClick={() =>
                          handleCancelOrder(order.orderId, order.items)
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

// --- PurchaseHistory Component ---

/**
 * PurchaseHistory Component
 * Main page for displaying a user's active and completed orders,
 * including actions like confirming delivery and cancelling orders.
 */
export default function PurchaseHistory() {
  const { currentUser } = useAuth();
  const [allHistory, setAllHistory] = useState([]);

  /** Memoized function to fetch and set history data for the current user. */
  const refreshHistory = useCallback(() => {
    if (currentUser && currentUser.email) {
      setAllHistory(getPurchaseHistory(currentUser.email));
    } else {
      setAllHistory([]);
    }
  }, [currentUser]);

  // Load history on mount and whenever the refresh function changes
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // --- Handlers ---

  /**
   * Updates the status of a specific order in local storage.
   * @param {string} orderId - The ID of the order to update.
   * @param {string} newStatus - The new status value (e.g., "Delivered").
   */
  const updateOrderStatus = (orderId, newStatus) => {
    const history =
      JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];

    const updatedHistory = history.map((order) => {
      if (order.orderId === orderId) {
        order.status = newStatus;
      }
      return order;
    });

    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(updatedHistory));
    refreshHistory(); // Refresh component state
  };

  /**
   * Handles the cancellation of an order.
   * Changes the status to "Cancelled" and calls restockItems.
   * @param {string} orderId - The ID of the order to cancel.
   * @param {Array} orderItems - The list of items to restock.
   */
  const handleCancelOrder = (orderId, orderItems) => {
    // Log message serves as a placeholder for a custom confirmation modal
    console.log(
      `Attempting to cancel Order ID: ${orderId}. This action should be confirmed via a custom modal.`
    );

    const history =
      JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];

    const updatedHistory = history.map((order) => {
      if (order.orderId === orderId && order.status === "For Shipping") {
        order.status = "Cancelled";
        restockItems(orderItems); // Return items to inventory
        console.log(
          `Order ${orderId} has been CANCELLED and items have been restocked.`
        );
      }
      return order;
    });

    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(updatedHistory));
    refreshHistory();
  };

  /**
   * Handles confirming delivery of an order, changing its status to "Delivered".
   * @param {string} orderId - The ID of the order.
   */
  const handleConfirmDelivery = (orderId) => {
    // Log message serves as a placeholder for a custom confirmation modal
    console.log(
      `Confirming Order ID: ${orderId} received. This action should be confirmed via a custom modal.`
    );
    updateOrderStatus(orderId, "Delivered");
    console.log(`Order ${orderId} status changed to 'Delivered'.`);
  };

  // --- Conditional Render: Not Logged In ---
  if (!currentUser) {
    return (
      <div className="purchase-history-container">
        <h1>My Purchase History</h1>
        <p>Please log in to view your past orders.</p>
      </div>
    );
  }

  // --- Filter Orders for Display ---
  const activeOrders = allHistory.filter(
    (order) => order.status === "For Shipping"
  );

  const completedHistory = allHistory.filter(
    (order) => order.status === "Delivered" || order.status === "Cancelled"
  );

  // --- Main Render ---
  return (
    <div className="purchase-history-container">
      <h1>My Orders</h1>
      <p className="history-subtext">
        This tracks the current status of your active and past orders.
      </p>

      {/* Active Orders Table */}
      <OrderTable
        title="Active Orders (Awaiting Delivery)"
        orders={activeOrders}
        handleCancelOrder={handleCancelOrder}
        handleConfirmDelivery={handleConfirmDelivery}
        showActions={true}
      />

      <div className="history-separator"></div>

      {/* Completed History Table */}
      <OrderTable
        title="Completed History"
        orders={completedHistory}
        // No actions needed for delivered or cancelled items
        handleCancelOrder={() => {}}
        handleConfirmDelivery={() => {}}
        showActions={false}
      />
    </div>
  );
}
