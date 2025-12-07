import React, { useState, useEffect } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/checkout.css";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService"; 

const TAX_RATE = 0.12; 
const SHIPPING_FEE = 5000; 
const SHIPPING_KEY_PREFIX = "shippingInfo_";

// --- Utility Functions ---

const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { address: "", city: "", state: "", zip: "" };
};

const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    fullname: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "", 
    address: "",
    city: "",
    state: "", 
    zip: "",   
    payment_method: "cash_on_delivery"
  });

  const [isShippingEditing, setIsShippingEditing] = useState(false);
  const [addressWarning, setAddressWarning] = useState("");
  
  // Order State
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // 1. Load Data on Mount
  useEffect(() => {
    if (currentUser) {
      const shippingInfo = getShippingInfo(currentUser.email);
      setFormData((prev) => ({
        ...prev,
        fullname: currentUser.name,
        email: currentUser.email,
        address: shippingInfo.address || "",
        city: shippingInfo.city || "",
        state: shippingInfo.state || "",
        zip: shippingInfo.zip || ""
      }));
    }

    const storedSelection = localStorage.getItem("checkout_selection");
    if (storedSelection) {
      try {
        const items = JSON.parse(storedSelection);
        setCheckoutItems(items);
      } catch (e) {
        console.error("Failed to parse checkout items");
      }
    }

    window.scrollTo(0, 0);
  }, [currentUser]);

  // 2. Calculate Totals (Matches Backend Logic 1:1)
  const calculateTotals = () => {
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const shipping = SHIPPING_FEE; 
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const { subtotal, tax, shipping, total } = calculateTotals();

  // 3. Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveShipping = () => {
    if (currentUser?.email) {
      saveShippingInfo(currentUser.email, { 
        address: formData.address, 
        city: formData.city,
        state: formData.state,
        zip: formData.zip
      });
    }
    setIsShippingEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddressWarning("");

    if (isShippingEditing) {
      setAddressWarning("Please save your address edits first.");
      return;
    }
    
    if (!formData.address || !formData.city || !formData.state) {
      setAddressWarning("Shipping address, city, and state are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        shipping_name: formData.fullname,
        shipping_email: formData.email,
        shipping_phone: formData.phone || "0000000000",
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_state: formData.state,
        shipping_zip: formData.zip || "0000",
        shipping_country: "Philippines",
        payment_method: formData.payment_method,
        items: checkoutItems.map(item => ({ id: item.id, quantity: item.quantity }))
      };

      const response = await orderService.checkout(orderPayload);
      
      const orderId = response.data?.id || response.data?.order_number || `#${Math.floor(Math.random() * 10000)}`;

      localStorage.removeItem("checkout_selection");

      setReceiptData({
        orderId: orderId,
        total: total,
        count: checkoutItems.length,
        email: formData.email
      });

      setIsSubmitted(true);

    } catch (error) {
      console.error("Checkout Error:", error);
      const serverMsg = error.response?.data?.message || error.response?.data?.error;
      setAddressWarning(serverMsg || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Receipt ---
  if (isSubmitted && receiptData) {
    return (
      <section className="checkout-page thank-you-page">
        <h1>Order Placed!</h1>
        <div className="receipt-box">
          <h3>Purchase Receipt</h3>
          <p className="receipt-message-header">Order ID: #{receiptData.orderId}</p>
          <p className="receipt-total">Total Charged:</p>
          <p className="receipt-amount">
            ₱{receiptData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="receipt-message">
            Your order has been placed successfully. A confirmation email will be sent to {receiptData.email}.
          </p>
        </div>
        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/")} className="btn-main">Return to Home</button>
        </div>
      </section>
    );
  }

  // --- Render Checkout Form ---
  const isAddressSet = formData.address && formData.city && formData.state;

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-container">
        
        {/* LEFT: Shipping Form */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>

          <label>Full Name <input name="fullname" value={formData.fullname} onChange={handleChange} required /></label>
          <label>Email <input name="email" type="email" value={formData.email} onChange={handleChange} required /></label>
          <label>Phone <input name="phone" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} /></label>

          <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 2 }}>Address <input name="address" placeholder="Blk 1 Lot 2" value={formData.address} onChange={handleChange} required readOnly={!isShippingEditing && !!currentUser} /></label>
            <label style={{ flex: 1 }}>City <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required readOnly={!isShippingEditing && !!currentUser} /></label>
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1 }}>State/Province <input name="state" placeholder="Laguna" value={formData.state} onChange={handleChange} required readOnly={!isShippingEditing && !!currentUser} /></label>
            <label style={{ flex: 1 }}>Zip Code <input name="zip" placeholder="4025" value={formData.zip} onChange={handleChange} readOnly={!isShippingEditing && !!currentUser} /></label>
          </div>

          {currentUser && (
            <div className="shipping-edit-controls">
              {isShippingEditing ? (
                <button type="button" className="btn-main btn-save-shipping" onClick={handleSaveShipping}>Save Address</button>
              ) : (
                <button type="button" className="btn-secondary" onClick={() => setIsShippingEditing(true)}>Edit Address</button>
              )}
            </div>
          )}

          <label style={{ marginTop: "20px" }}>Payment Method</label>
          <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="form-input">
            <option value="cash_on_delivery">Cash on Delivery</option>
            <option value="credit_card">Credit Card (Simulation)</option>
          </select>

          {addressWarning && <p className="validation-warning" style={{color: "#ef4444", marginTop: "10px"}}>{addressWarning}</p>}

          <button type="submit" className="btn-main checkout-btn" disabled={isSubmitting || (currentUser && isShippingEditing) || !isAddressSet}>
            {isSubmitting ? "Processing..." : `Place Order`}
          </button>

          <button type="button" className="cancel-btn" onClick={() => navigate("/cart")}>Cancel & Return to Cart</button>
        </form>

        {/* RIGHT: Order Summary */}
        <div className="order-summary">
          <h2>Your Order ({checkoutItems.reduce((acc, i) => acc + i.quantity, 0)} Items)</h2>
          
          <div className="summary-list">
            {checkoutItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img src={item.image || "/img/products/placeholder.png"} alt={item.name} />
                <div className="summary-item-details">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                </div>
                <p className="summary-item-price">₱{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="summary-calculations-wrapper">
            <div className="summary-row">
              <p>Subtotal:</p>
              <p>₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="summary-row">
              <p>Tax (12%):</p>
              <p>₱{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="summary-row">
              <p>Shipping Fee:</p>
              <p>₱{shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="summary-total" style={{ borderTop: "1px solid #444", paddingTop: "10px", marginTop: "10px" }}>
              <h3>Total:</h3>
              <h3>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}