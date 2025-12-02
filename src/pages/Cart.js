import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { useAuth } from "../components/Navbar";

const API_BASE_URL = "http://localhost:8082/api";
const SHIPPING_RATE = 0.1; // 10%
const TAX_RATE = 0.12;     // 12%

export default function Cart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Cart Data
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const items = data.data.items.map(item => ({
          ...item,
          isChecked: true 
        }));
        setCartItems(items);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]); 

  // 2. Update Quantity
  const handleUpdateItemQuantity = async (cartItemId, newQty) => {
    if (newQty < 1) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      });
      await fetchCart();
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Remove Item
  const handleRemoveItem = async (cartItemId) => {
    if(!window.confirm("Remove this item?")) return;
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      await fetchCart();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleToggleCheckout = (id) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  // --- Calculations with TAX ---
  const { checkedSubtotal, shippingFee, taxFee, total, totalCheckedItemsCount } = useMemo(() => {
    const checked = cartItems.filter((item) => item.isChecked);
    const totalCount = checked.reduce((sum, item) => sum + item.quantity, 0);
    
    const subtotal = checked.reduce((sum, item) => {
        const price = Number(item.product?.price) || 0;
        return sum + (price * item.quantity);
    }, 0);

    const shipping = subtotal * SHIPPING_RATE;
    const tax = subtotal * TAX_RATE; // Calculate 12% Tax
    
    return {
      checkedSubtotal: subtotal,
      shippingFee: shipping,
      taxFee: tax,
      total: subtotal + shipping + tax,
      totalCheckedItemsCount: totalCount,
    };
  }, [cartItems]);

  if (loading) return <div className="cart-page"><h2>Loading Cart...</h2></div>;

  return (
    <section className="cart-page">
      <h1>Your Cart ({cartItems.length} items)</h1>

      <div className="cart-container">
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="cart-placeholder">
              <p>Your cart is empty.</p>
              <Link to="/products" className="btn-main shop-now-link">Go to Products</Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <input type="checkbox" checked={item.isChecked} onChange={() => handleToggleCheckout(item.id)} className="item-checkbox" />
                <div className="item-image">
                  <img src={item.product.image || "/img/products/placeholder.png"} alt={item.product.name} />
                </div>
                <div className="item-details">
                  <h3>{item.product.name}</h3>
                  <p className="item-price-qty">₱{Number(item.product.price).toLocaleString()} x {item.quantity}</p>
                </div>
                <div className="checkout-qty-controls">
                  <button className="qty-change-btn" disabled={isUpdating} onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}>-</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-change-btn" disabled={isUpdating} onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="edit-item-btn" onClick={() => handleRemoveItem(item.id)}>Remove</button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <p>Subtotal:</p>
              <p>₱{checkedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="summary-row">
              <p>Shipping (10%):</p>
              <p>₱{shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            {/* Added Tax Row */}
            <div className="summary-row">
              <p>VAT (12%):</p>
              <p>₱{taxFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="summary-total">
              <h3>Total:</h3>
              <h3>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <button className="btn-main checkout-btn" disabled={totalCheckedItemsCount === 0} onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </section>
  );
}