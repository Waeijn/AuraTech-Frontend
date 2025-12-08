import React, { useState, useEffect } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/checkout.css";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/orderService";

const TAX_RATE = 0.12;
const SHIPPING_FEE = 5000;
const SHIPPING_KEY_PREFIX = "shippingInfo_";

// Utility function to retrieve stored shipping info for current user
const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  // Ensure all 5 fields are included in the retrieval structure
  return stored
    ? JSON.parse(stored)
    : { address: "", city: "", state: "", zip: "", phone: "" };
};

// Utility function to save shipping info for current user (Used in Account.js)
const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Form state: holds all final shipping info and payment method
  const [formData, setFormData] = useState({
    fullname: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    payment_method: "cash_on_delivery",
  });

  // RESTORED: isShippingEditing state for on-the-fly address changes
  const [isShippingEditing, setIsShippingEditing] = useState(false);
  const [addressWarning, setAddressWarning] = useState("");

  // Order state
  const [checkoutItems, setCheckoutItems] = useState([]); // Items selected for checkout
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission loading state
  const [isSubmitted, setIsSubmitted] = useState(false); // Tracks if order has been successfully submitted
  const [receiptData, setReceiptData] = useState(null); // Stores receipt info after order is placed

  // NEW STATE: Tracks if the necessary shipping info is complete
  const [isShippingComplete, setIsShippingComplete] = useState(false);

  // Load stored shipping info and checkout items on component mount
  useEffect(() => {
    let currentShippingComplete = false;

    if (currentUser) {
      const shippingInfo = getShippingInfo(currentUser.email);

      // CRITICAL CHECK: Ensure all 4 required fields (Address, City, State, Phone) are set in storage
      const requiredFields = [
        shippingInfo.address,
        shippingInfo.city,
        shippingInfo.state,
        shippingInfo.phone,
      ];
      const areRequiredFieldsSet = requiredFields.every(
        (field) => field && field.trim() !== ""
      );

      if (areRequiredFieldsSet) {
        // If fields are set, load them into the form state and lock editing
        setFormData((prev) => ({
          ...prev,
          fullname: currentUser.name,
          email: currentUser.email,
          address: shippingInfo.address || "",
          city: shippingInfo.city || "",
          state: shippingInfo.state || "",
          zip: shippingInfo.zip || "",
          phone: shippingInfo.phone || "",
        }));
        currentShippingComplete = true;
      }
    }

    setIsShippingComplete(currentShippingComplete);
    // Initial state: If logged in and complete, editing is OFF. If incomplete, user MUST edit.
    if (currentUser && !currentShippingComplete) {
      // Force editing if user is logged in but missing critical data from storage
      setIsShippingEditing(true);
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

  // Calculate totals: subtotal, tax, shipping, total
  const calculateTotals = () => {
    const subtotal = checkoutItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * TAX_RATE;
    const shipping = SHIPPING_FEE;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const { subtotal, tax, shipping, total } = calculateTotals();

  // Handler for input changes in the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Handler to save TEMPORARY shipping address (does NOT save to permanent storage)
  const handleToggleShippingEdit = () => {
    if (isShippingEditing) {
      // If they click 'Save Address'
      const { address, city, state } = formData;
      if (
        !address.trim() ||
        !city.trim() ||
        !state.trim() ||
        !formData.phone.trim()
      ) {
        setAddressWarning(
          "All shipping fields and Mobile Number must be filled out before saving/placing the order."
        );
        return;
      }
      setAddressWarning("");
      setIsShippingEditing(false);
    } else {
      // If they click 'Edit Address'
      setIsShippingEditing(true);
    }
  };

  // Submit order to backend service
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddressWarning("");

    // Validation: Block if user is in editing mode
    if (isShippingEditing) {
      setAddressWarning(
        "Please click 'Save Address' before placing the order."
      );
      return;
    }

    // Final validation of required fields in case user is not logged in or missed the initial check
    if (
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.phone
    ) {
      setAddressWarning(
        "Shipping address, city, state/province, and phone are required."
      );
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
        items: checkoutItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await orderService.checkout(orderPayload);

      const orderId =
        response.data?.id ||
        response.data?.order_number ||
        `#${Math.floor(Math.random() * 10000)}`;

      localStorage.removeItem("checkout_selection");

      setReceiptData({
        orderId: orderId,
        total: total,
        count: checkoutItems.length,
        email: formData.email,
      });

      setIsSubmitted(true); // Show receipt page
    } catch (error) {
      console.error("Checkout Error:", error);
      const serverMsg =
        error.response?.data?.message || error.response?.data?.error;
      setAddressWarning(
        serverMsg || "Failed to place order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render receipt page after order submission
  if (isSubmitted && receiptData) {
    return (
      <section className="checkout-page thank-you-page">
        <h1>Order Placed!</h1>
        <div className="receipt-box">
          <h3>Purchase Receipt</h3>
          <p className="receipt-message-header">
            Order ID: #{receiptData.orderId}
          </p>
          <p className="receipt-total">Total Charged:</p>
          <p className="receipt-amount">
            ₱
            {receiptData.total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="receipt-message">
            Your order has been placed successfully. A confirmation email will
            be sent to {receiptData.email}.
          </p>
        </div>
        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/")} className="btn-main">
            Return to Home
          </button>
        </div>
      </section>
    );
  }

  // Determines if checkout can proceed (must have fields and not be in edit mode)
  const isAddressSet =
    formData.address && formData.city && formData.state && formData.phone;
  // Fields are read-only if the user is logged in AND not currently editing the address block
  const readOnlyContactFields = !!currentUser;
  const readOnlyAddressFields = !!currentUser && !isShippingEditing;

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-container">
        {/* Shipping Form Section */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>

          {/* CONTACT INFO (Read-only if logged in) */}
          <label>
            Full Name{" "}
            <input
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
              readOnly={readOnlyContactFields}
            />
          </label>
          <label>
            Email{" "}
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              readOnly={readOnlyContactFields}
            />
          </label>
          <label>
            Phone{" "}
            <input
              name="phone"
              placeholder="Mobile Number"
              value={formData.phone}
              onChange={handleChange}
              readOnly={readOnlyContactFields}
            />
          </label>

          {/* ADDRESS FIELDS (Editable if NOT logged in, or if isShippingEditing is TRUE) */}
          <div className="form-row" style={{ display: "flex", gap: "10px" }}>
            <label style={{ flex: 2 }}>
              Address{" "}
              <input
                name="address"
                placeholder="Blk 1 Lot 2"
                value={formData.address}
                onChange={handleChange}
                required
                readOnly={readOnlyAddressFields}
              />
            </label>
            <label style={{ flex: 1 }}>
              City{" "}
              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                required
                readOnly={readOnlyAddressFields}
              />
            </label>
          </div>

          <div className="form-row" style={{ display: "flex", gap: "10px" }}>
            <label style={{ flex: 1 }}>
              State/Province{" "}
              <input
                name="state"
                placeholder="Laguna"
                value={formData.state}
                onChange={handleChange}
                required
                readOnly={readOnlyAddressFields}
              />
            </label>
            <label style={{ flex: 1 }}>
              Zip Code{" "}
              <input
                name="zip"
                placeholder="4025"
                value={formData.zip}
                onChange={handleChange}
                readOnly={readOnlyAddressFields}
              />
            </label>
          </div>

          {/* Button to edit or save shipping address (only visible to logged-in users) */}
          {currentUser && (
            <div className="shipping-edit-controls">
              {isShippingEditing ? (
                <button
                  type="button"
                  className="btn-main btn-save-shipping"
                  onClick={handleToggleShippingEdit}
                >
                  Save Address
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleToggleShippingEdit}
                >
                  Edit Address
                </button>
              )}
            </div>
          )}

          <label style={{ marginTop: "20px" }}>Payment Method</label>
          <select
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="form-input"
          >
            <option value="cash_on_delivery">Cash on Delivery</option>
            <option value="credit_card">Credit / Debit Card</option>
          </select>

          {addressWarning && (
            <p
              className="validation-warning"
              style={{ color: "#ef4444", marginTop: "10px" }}
            >
              {addressWarning}
            </p>
          )}

          <button
            type="submit"
            className="btn-main checkout-btn"
            disabled={
              isSubmitting ||
              isShippingEditing || // Block submission while actively editing
              !isAddressSet
            }
          >
            {isSubmitting ? (
              <div className="form-button-content-wrapper">
                <div className="spinner"></div>
                Processing Order...
              </div>
            ) : (
              `Place Order`
            )}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/cart")}
          >
            Cancel & Return to Cart
          </button>
        </form>

        {/* Order Summary Section */}
        <div className="order-summary">
          <h2>
            Your Order ({checkoutItems.reduce((acc, i) => acc + i.quantity, 0)}{" "}
            Items)
          </h2>

          <div className="summary-list">
            {checkoutItems.map((item) => (
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
              <p>Subtotal:</p>
              <p>
                ₱
                {subtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="summary-row">
              <p>Tax (12%):</p>
              <p>
                ₱{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="summary-row">
              <p>Shipping Fee:</p>
              <p>
                ₱
                {shipping.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div
              className="summary-total"
              style={{
                borderTop: "1px solid #444",
                paddingTop: "10px",
                marginTop: "10px",
              }}
            >
              <h3>Total:</h3>
              <h3>
                ₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
