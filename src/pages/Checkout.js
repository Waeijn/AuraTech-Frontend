import React, { useState, useEffect } from "react";
import { useAuth } from "../components/Navbar";
import "../styles/checkout.css";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:8082/api";

export default function Checkout() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State (Added 'tax' to totals)
  const [cartItems, setCartItems] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, shipping: 0, tax: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null);

  const [formData, setFormData] = useState({
    fullname: currentUser?.name || "",
    email: currentUser?.email || "",
    address: "",
    city: "",
    phone: "",
    zip: "",
    payment_method: "cash_on_delivery"
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({ ...prev, fullname: currentUser.name, email: currentUser.email }));
    }

    const fetchCheckoutData = async () => {
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        const response = await fetch(`${API_BASE_URL}/cart`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success) {
          const items = data.data.items;
          setCartItems(items);
          
          // --- CALCULATION LOGIC (With Tax) ---
          const sub = items.reduce((sum, item) => {
             const price = Number(item.product.price) || 0; 
             const qty = Number(item.quantity) || 1;
             return sum + (price * qty);
          }, 0);

          const ship = sub * 0.10; 
          const tax = sub * 0.12; // 12% Tax
          
          setTotals({
            subtotal: sub,
            shipping: ship,
            tax: tax,
            total: sub + ship + tax
          });
        }
      } catch (error) {
        console.error("Error loading checkout:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckoutData();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      
      const payload = {
        shipping_name: formData.fullname,
        shipping_email: formData.email,
        shipping_address: formData.address,
        shipping_city: formData.city,
        shipping_phone: formData.phone,
        shipping_zip: formData.zip,
        shipping_country: "Philippines",
        shipping_state: "Metro Manila", 
        payment_method: formData.payment_method
      };

      const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrderReceipt(data.data);
        setIsSubmitted(true);
      } else {
        alert(data.message || "Checkout failed. Please check your details.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Server error during checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSubmitted && orderReceipt) {
    // Show Frontend Total to match display
    const totalVal = totals.total; 
    
    return (
      <section className="checkout-page thank-you-page">
        <h1>Order Placed!</h1>
        <div className="receipt-box">
          <h3>Purchase Receipt</h3>
          <p>Order ID: <strong>{orderReceipt.order_number}</strong></p>
          <p>Total Paid: <strong>₱{totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></p>
          <p>Your order has been placed successfully.</p>
        </div>
        <button className="btn-main" onClick={() => navigate("/")}>Return Home</button>
      </section>
    );
  }

  if (loading) return <div className="checkout-page"><p>Loading checkout...</p></div>;

  return (
    <section className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Information</h2>
          <label>Full Name <input name="fullname" value={formData.fullname} onChange={handleChange} required readOnly={!!currentUser} /></label>
          <label>Email <input name="email" value={formData.email} onChange={handleChange} required readOnly={!!currentUser} /></label>
          <label>Address <input name="address" value={formData.address} onChange={handleChange} required placeholder="Street Address" /></label>
          <div className="form-row">
            <label>City <input name="city" value={formData.city} onChange={handleChange} required placeholder="City" /></label>
            <label>Zip Code <input name="zip" value={formData.zip} onChange={handleChange} required placeholder="Zip Code" /></label>
          </div>
          <label>Phone Number <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="0912 345 6789" /></label>

          <h2 style={{marginTop: '20px'}}>Payment Method</h2>
          <div className="payment-options">
            <label className="radio-label">
                <input type="radio" name="payment_method" value="cash_on_delivery" checked={formData.payment_method === 'cash_on_delivery'} onChange={handleChange} />
                Cash on Delivery (COD)
            </label>
            <label className="radio-label">
                <input type="radio" name="payment_method" value="ewallet" checked={formData.payment_method === 'ewallet'} onChange={handleChange} />
                E-Wallet (GCash/Maya)
            </label>
          </div>
          
          <button type="submit" className="btn-main checkout-btn" disabled={isProcessing || cartItems.length === 0}>
            {isProcessing ? "Processing..." : `Place Order`}
          </button>
        </form>

        <div className="order-summary">
          <h2>Your Order ({cartItems.length} items)</h2>
          <div className="summary-list">
            {cartItems.map(item => (
                <div key={item.id} className="summary-item">
                <span>{item.product.name} <small>(x{item.quantity})</small></span>
                <span>₱{(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                </div>
            ))}
          </div>

          <hr className="summary-divider" />
          <div className="summary-row"><span>Subtotal:</span><span>₱{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="summary-row"><span>Shipping Fee (10%):</span><span>₱{totals.shipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <div className="summary-row"><span>VAT (12%):</span><span>₱{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
          <hr className="summary-divider" />
          <div className="summary-total"><h3>Total:</h3><h3>₱{totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3></div>
        </div>
      </div>
    </section>
  );
}