// Sprint 4: Member 4
// Task: Implement Checkout form, display receipt, and deduct stock from local storage.

import React, { useState, useEffect } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/checkout.css";
import productsData from "../data/products.json";
import { useNavigate } from "react-router-dom";

const SHIPPING_RATE = 0.1;
const INVENTORY_KEY = "temporary_inventory";
const PURCHASE_HISTORY_KEY = "purchaseHistory";
const SHIPPING_KEY_PREFIX = "shippingInfo_";

const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { address: "", city: "" };
};

const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

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

const calculateCheckoutTotals = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const checkedItems = cartItems.filter((item) => item.isChecked);

  const totalCount = checkedItems.reduce((sum, item) => sum + item.quantity, 0);
  const checkedSubtotal = checkedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingFee = checkedSubtotal * SHIPPING_RATE;
  const total = checkedSubtotal + shippingFee;

  return { checkedItems, checkedSubtotal, shippingFee, total, totalCount };
};

const deductStockAndSave = (purchasedItems) => {
  const currentInventory = getInventory();
  purchasedItems.forEach((item) => {
    const itemId = item.id;
    const purchasedQty = item.quantity;
    const currentStock = currentInventory[itemId] || 0;
    currentInventory[itemId] = Math.max(0, currentStock - purchasedQty);
  });
  saveInventory(currentInventory);
};

const savePurchaseToHistory = (orderData, userEmail) => {
  const history = JSON.parse(localStorage.getItem(PURCHASE_HISTORY_KEY)) || [];

  const newOrder = {
    orderId: `AT-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString("en-CA"),
    userEmail: userEmail,
    items: orderData.checkedItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    total: orderData.total,
    totalItemsCount: orderData.totalCount,
    status: "For Shipping",
  };

  history.unshift(newOrder);
  localStorage.setItem(PURCHASE_HISTORY_KEY, JSON.stringify(history));
  return newOrder.orderId;
};

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isShippingEditing, setIsShippingEditing] = useState(false);
  const [addressWarning, setAddressWarning] = useState("");

  const initialFormData = {
    fullname: currentUser?.name || "",
    email: currentUser?.email || "",
    address: "",
    city: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptData, setReceiptData] = useState({
    total: 0,
    totalCount: 0,
    email: "",
    orderId: "",
  });

  useEffect(() => {
    if (currentUser) {
      const shippingInfo = getShippingInfo(currentUser.email);
      setFormData((prev) => ({
        ...prev,
        fullname: currentUser.name,
        email: currentUser.email,
        address: shippingInfo.address || "",
        city: shippingInfo.city || "",
      }));
      setIsShippingEditing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { checkedItems, checkedSubtotal, shippingFee, total, totalCount } =
    calculateCheckoutTotals();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveShipping = () => {
    if (currentUser && currentUser.email) {
      const { address, city } = formData;
      saveShippingInfo(currentUser.email, { address, city });
    }
    setIsShippingEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAddressWarning("");

    if (isShippingEditing) {
      setAddressWarning(
        "Please save or cancel your address edits before placing the order."
      );
      return;
    }

    if (!formData.address || !formData.city) {
      setAddressWarning("Shipping address and city are required.");
      return;
    }

    const finalOrder = calculateCheckoutTotals();
    if (finalOrder.checkedItems.length === 0) {
      setAddressWarning("No items selected for checkout.");
      return;
    }

    deductStockAndSave(finalOrder.checkedItems);
    const userEmail = currentUser ? currentUser.email : formData.email;
    const orderId = savePurchaseToHistory(finalOrder, userEmail);

    setReceiptData({
      total: finalOrder.total,
      totalCount: finalOrder.totalCount,
      email: userEmail,
      orderId: orderId,
    });

    const finalCart = (JSON.parse(localStorage.getItem("cart")) || []).filter(
      (item) => !item.isChecked
    );
    localStorage.setItem("cart", JSON.stringify(finalCart));

    setIsSubmitted(true);
  };

  const isAddressSet = formData.address && formData.city;
  const isButtonDisabled = isShippingEditing || !isAddressSet;

  if (isSubmitted) {
    return (
      <section className="checkout-page thank-you-page">
        <h1>Order Placed!</h1>
        <div className="receipt-box">
          <h3>Purchase Receipt</h3>
          <p className="receipt-message-header">
            Order ID: {receiptData.orderId}
          </p>
          <p className="receipt-total">Total Charged:</p>
          <p className="receipt-amount">
            ₱
            {receiptData.total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="receipt-message">
            Your order for {receiptData.totalCount} items has been placed
            successfully.
          </p>
          <p>
            A confirmation email will be sent to{" "}
            {receiptData.email || "your email"}.
          </p>
        </div>
        <div style={{ marginTop: "30px" }}>
          <a href="/" className="btn-main">
            Return to Home
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-container">
        {/* LEFT SIDE: SHIPPING FORM */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>

          <label>
            Full Name
            <input
              name="fullname"
              placeholder="John Doe"
              value={formData.fullname}
              onChange={handleChange}
              required
              readOnly={!!currentUser}
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly={!!currentUser}
            />
          </label>

          <label>
            Address
            <input
              name="address"
              placeholder="Shipping address"
              value={formData.address}
              onChange={handleChange}
              required
              readOnly={!!currentUser && !isShippingEditing}
            />
          </label>

          <label>
            City
            <input
              name="city"
              placeholder="e.g., Manila"
              value={formData.city}
              onChange={handleChange}
              required
              readOnly={!!currentUser && !isShippingEditing}
            />
          </label>

          {currentUser && (
            <div className="shipping-edit-controls">
              {isShippingEditing ? (
                <>
                  <button
                    type="button"
                    className="btn-main btn-save-shipping"
                    onClick={handleSaveShipping}
                    disabled={!formData.address || !formData.city}
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setIsShippingEditing(false)}
                  >
                    Cancel Edit
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsShippingEditing(true)}
                >
                  Edit Address
                </button>
              )}
            </div>
          )}

          {/* Validation Message (when user interacts) */}
          {addressWarning && (
            <p className="validation-warning">{addressWarning}</p>
          )}

          {/* Static Helper Message (when no address yet) */}
          {!formData.address && !formData.city && (
            <p className="helper-message">
              Please fill in your shipping address and city before placing your
              order.
            </p>
          )}

          <button
            type="submit"
            className="btn-main checkout-btn"
            disabled={isButtonDisabled}
            title={
              !isAddressSet
                ? "Please enter shipping details"
                : "Ready to place order"
            }
          >
            Place Order (₱
            {total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            )
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/cart")}
          >
            Cancel & Return to Cart
          </button>

          {/* If no items selected */}
          {checkedItems.length === 0 && (
            <div className="cart-placeholder">
              <h3>No items selected for checkout</h3>
              <a href="/cart" className="btn-main shop-now-link">
                Go to Cart
              </a>
            </div>
          )}
        </form>

        {/* RIGHT SIDE: ORDER SUMMARY */}
        <div className="order-summary">
          <h2>Your Order ({totalCount} Items)</h2>
          <div className="summary-list">
            {checkedItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img
                  src={item.image || "/img/products/placeholder.png"}
                  alt={item.name}
                />
                <div className="summary-item-details">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                </div>
                <p className="summary-item-price">
                  ₱{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="summary-calculations-wrapper">
            <div className="summary-row">
              <p>Items Subtotal:</p>
              <p>₱{checkedSubtotal.toLocaleString()}</p>
            </div>
            <div className="summary-row">
              <p>Shipping (10%):</p>
              <p>₱{shippingFee.toLocaleString()}</p>
            </div>
            <div className="summary-total">
              <h3>Total:</h3>
              <h3>₱{total.toLocaleString()}</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
