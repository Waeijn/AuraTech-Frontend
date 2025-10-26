// Sprint 4: Member 4 - Redesigned Purchase History Page

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/purchase.css";
import productsData from "../data/products.json";

const PURCHASE_HISTORY_KEY = "purchaseHistory";
const INVENTORY_KEY = "temporary_inventory";

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

const saveInventory = (inventory) => {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
};

const restockItems = (items) => {
  const currentInventory = getInventory();

  items.forEach((item) => {
    const itemId = item.id;
    const returnedQty = item.quantity;

    currentInventory[itemId] = (currentInventory[itemId] || 0) + returnedQty;
  });

  saveInventory(currentInventory);
  console.log("Stock successfully returned to temporary local inventory.");
};

// Helper to fetch history specific to the user
const getPurchaseHistory = (userEmail) => {
  const allHistory =
    JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];
  return allHistory.filter((order) => order.userEmail === userEmail);
};

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
              <td>
                <ul className="item-list">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}x {item.name}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="order-total">
                ₱
                {order.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td>
                <span
                  className={`status-tag status-${order.status
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  {order.status}
                </span>
              </td>
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

export default function PurchaseHistory() {
  const { currentUser } = useAuth();
  const [allHistory, setAllHistory] = useState([]);

  const refreshHistory = useCallback(() => {
    if (currentUser && currentUser.email) {
      setAllHistory(getPurchaseHistory(currentUser.email));
    } else {
      setAllHistory([]);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

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
    refreshHistory();
  };

  const handleCancelOrder = (orderId, orderItems) => {
    // FIX: Using console log instead of window.confirm for compliance
    console.log(
      `Attempting to cancel Order ID: ${orderId}. This action should be confirmed via a custom modal.`
    );

    const history =
      JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];

    const updatedHistory = history.map((order) => {
      if (order.orderId === orderId && order.status === "For Shipping") {
        order.status = "Cancelled";
        restockItems(orderItems);
        console.log(
          `Order ${orderId} has been CANCELLED and items have been restocked.`
        );
      }
      return order;
    });

    localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(updatedHistory));
    refreshHistory();
  };

  const handleConfirmDelivery = (orderId) => {
    // FIX: Using console log instead of window.confirm for compliance
    console.log(
      `Confirming Order ID: ${orderId} received. This action should be confirmed via a custom modal.`
    );

    updateOrderStatus(orderId, "Delivered");
    console.log(`Order ${orderId} status changed to 'Delivered'.`);
  };

  if (!currentUser) {
    return (
      <div className="purchase-history-container">
        <h1>My Purchase History</h1>
        <p>Please log in to view your past orders.</p>
      </div>
    );
  }

  // Filter orders into two groups
  const activeOrders = allHistory.filter(
    (order) => order.status === "For Shipping"
  );

  const completedHistory = allHistory.filter(
    (order) => order.status === "Delivered" || order.status === "Cancelled"
  );

  return (
    <div className="purchase-history-container">
      <h1>My Orders</h1>
      <p className="history-subtext">
        This tracks the current status of your active and past orders.
      </p>

      <OrderTable
        title="Active Orders (Awaiting Delivery)"
        orders={activeOrders}
        handleCancelOrder={handleCancelOrder}
        handleConfirmDelivery={handleConfirmDelivery}
        showActions={true}
      />

      <div className="history-separator"></div>

      <OrderTable
        title="Completed History"
        orders={completedHistory}
        handleCancelOrder={() => {}}
        handleConfirmDelivery={() => {}}
        showActions={false}
      />
    </div>
  );
}
