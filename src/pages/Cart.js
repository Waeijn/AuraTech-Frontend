import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/cart.css";
import { cartService } from "../services/cartService";

// 👇 FIX: Match Checkout and Backend (₱5,000.00)
const TAX_RATE = 0.12; 
const SHIPPING_FEE = 5000; 

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantityToModify, setQuantityToModify] = useState(1);

  // API Call: Fetch Cart
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.get();
      
      let apiItems = [];
      if (response.data && Array.isArray(response.data)) {
          apiItems = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
          apiItems = response.data.items;
      } else if (Array.isArray(response)) {
          apiItems = response;
      }

      setCartItems((prevItems) => {
        return apiItems.map(item => {
           const product = item.product || {};
           const existing = prevItems.find(p => p.id === product.id);
           
           return {
             id: product.id,
             cartItemId: item.id,
             name: product.name || "Unknown Product",
             price: parseFloat(product.price) || 0,
             image: product.images?.[0]?.url || product.image || "/img/products/placeholder.png",
             quantity: item.quantity,
             stock: product.stock || 0,
             isChecked: existing ? existing.isChecked : true 
           };
        });
      });
    } catch (error) {
      console.error("Cart fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
     localStorage.setItem("checkout_selection", JSON.stringify(cartItems.filter(i => i.isChecked)));
  }, [cartItems]);

  const handleToggleCheckout = (id) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
  };

  const handleOpenEditModal = (item) => {
    setModalProduct(item);
    setQuantityToModify(1);
    setIsModalOpen(true);
  };

  const handleUpdateItemQuantity = async (id, delta) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    let newQuantity = item.quantity + delta;
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > item.stock) {
       alert(`Max stock: ${item.stock}`); return;
    }

    try {
      await cartService.update(item.cartItemId, newQuantity);
      fetchCart();
    } catch (e) { alert("Update failed"); }
  };

  const handleRemoveAll = async () => {
    if (!modalProduct) return;
    try {
      await cartService.remove(modalProduct.cartItemId);
      setIsModalOpen(false);
      setModalProduct(null);
      fetchCart();
    } catch (e) { alert("Remove failed"); }
  };

  // CALCULATION LOGIC
  const { checkedItems, checkedSubtotal, taxAmount, shippingFee, total, totalCheckedItemsCount } = useMemo(() => {
    const checked = cartItems.filter((item) => item.isChecked);
    const totalCount = checked.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = checked.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Logic: Tax is 12%, Shipping is fixed 5000
    const tax = subtotal * TAX_RATE;
    const shipping = checked.length > 0 ? SHIPPING_FEE : 0;
    
    return { 
        checkedItems: checked, 
        checkedSubtotal: subtotal, 
        taxAmount: tax,
        shippingFee: shipping, 
        total: subtotal + tax + shipping, 
        totalCheckedItemsCount: totalCount 
    };
  }, [cartItems]);

  const CartItem = ({ item }) => (
      <div className="cart-item">
        <input type="checkbox" checked={item.isChecked} onChange={() => handleToggleCheckout(item.id)} className="item-checkbox" />
        <div className="item-image"><img src={item.image} alt={item.name} /></div>
        <div className="item-details">
          <h3>{item.name}</h3>
          <p className="item-price-qty">
            <span className="item-price">₱{item.price.toLocaleString()}</span>
            <span className="item-quantity"> (Qty: {item.quantity})</span>
          </p>
        </div>
        <div className="checkout-qty-controls">
          <button onClick={() => handleUpdateItemQuantity(item.id, -1)} disabled={item.quantity <= 1}>-</button>
          <span className="qty-value">{item.quantity}</span>
          <button onClick={() => handleUpdateItemQuantity(item.id, 1)} disabled={item.quantity >= item.stock}>+</button>
        </div>
        <button onClick={() => handleOpenEditModal(item)} className="edit-item-btn">Edit</button>
      </div>
  );

  if (loading && cartItems.length === 0) {
    return (
      <div className="cart-page" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <section className="cart-page">
         <div style={{
             display: "flex",
             flexDirection: "column",
             alignItems: "center",
             justifyContent: "center",
             minHeight: "50vh",
             textAlign: "center",
             gap: "1.5rem"
         }}>
            <div style={{ fontSize: "5rem", opacity: "0.2" }}>🛒</div>
            <h2 style={{ fontSize: "2rem", color: "#333", margin: 0 }}>Your Cart is Empty</h2>
            <p style={{ color: "#666", maxWidth: "400px", margin: 0 }}>
                Looks like you haven't added any items to the cart yet. 
                Explore our products to find the best gaming gear.
            </p>
            
            <Link to="/products" style={{ 
                backgroundColor: "var(--color-accent, #00d2d3)",
                color: "#fff",
                padding: "8px 20px",        
                fontSize: "0.95rem",        
                marginTop: "10px", 
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                display: "inline-block"
            }}>
                Start Shopping
            </Link>
         </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1>Your Cart ({totalCheckedItemsCount} items selected)</h1>
      {isModalOpen && modalProduct && (
        <div className="modal-overlay open">
          <div className="quantity-modal remove-modal">
            <h2>Manage {modalProduct.name}</h2>
            <div className="modal-actions">
              <button className="btn-remove-all" onClick={handleRemoveAll}>Remove from Cart</button>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-container">
        <div className="cart-items">
            {cartItems.map((item) => <CartItem key={item.id} item={item} />)}
        </div>
        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row"><p>Items Subtotal:</p><p>₱{checkedSubtotal.toLocaleString()}</p></div>
          <div className="summary-row"><p>Tax (12%):</p><p>₱{taxAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</p></div>
          
          {/* This will now show ₱5,000.00 */}
          <div className="summary-row"><p>Shipping:</p><p>₱{shippingFee.toLocaleString()}</p></div>
          
          <div className="summary-total"><h3>Order Total:</h3><h3>₱{total.toLocaleString(undefined, {maximumFractionDigits:2})}</h3></div>
          <Link to="/checkout"><button disabled={checkedItems.length === 0} className="btn-main checkout-btn">Proceed to Checkout</button></Link>
        </div>
      </div>
    </section>
  );
}