// Sprint 4: Member 4
// Task: Implement functional Cart page with state, selection, and complex quantity controls.

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "react-router-dom";
import "../styles/cart.css";
import productsData from "../data/products.json"; 

const SHIPPING_RATE = 0.10; 
const INVENTORY_KEY = 'temporary_inventory';

const getInventory = () => {
    let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
    if (!inventory) {
        const initialStock = {};
        productsData.forEach(p => { initialStock[p.id] = p.stock || 99999; });
        inventory = initialStock;
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    }
    return inventory;
};

const getCartItemsWithStock = () => {
    const cart = getCart();
    const inventory = getInventory(); 
    return cart.map(item => {
        return {
            ...item,
            stock: inventory[item.id] || 0,
        };
    });
};


const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
const saveCart = (cart) => localStorage.setItem('cart', JSON.stringify(cart));


export default function Cart() {
  const [cartItems, setCartItems] = useState(getCartItemsWithStock());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  
  const [quantityToModify, setQuantityToModify] = useState(1); 
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    const refreshCart = () => setCartItems(getCartItemsWithStock());
    refreshCart();
    
    window.addEventListener('focus', refreshCart);
    return () => window.removeEventListener('focus', refreshCart);
  }, []); 

  const handleToggleCheckout = (id) => {
    const newCart = cartItems.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    saveCart(newCart);
    setCartItems(getCartItemsWithStock()); 
  };
  
  const handleOpenEditModal = (item) => {
    setModalProduct(item);
    setQuantityToModify(1); 
    setModalError('');
    setIsModalOpen(true);
  };
  
  const handleUpdateItemQuantity = (id, delta) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    let newQuantity = item.quantity + delta;
    const maxStock = item.stock;

    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > maxStock) {
        alert(`Cannot add more than the available stock: ${maxStock}`);
        return;
    }

    const newCart = cartItems.map(cartItem => 
      cartItem.id === id 
        ? { ...cartItem, quantity: newQuantity } 
        : cartItem
    );
    
    const finalCart = newCart.filter(item => item.quantity > 0);
    saveCart(finalCart);
    setCartItems(getCartItemsWithStock()); 
  };


  const updateOwnedQuantity = (product, operation) => {
    setModalError('');
    let quantity = parseInt(quantityToModify);

    if (isNaN(quantity) || quantity <= 0) {
      setModalError(`Please enter a valid quantity to ${operation}.`);
      return;
    }
    
    let newQuantity;
    let actionLabel;

    if (operation === 'remove') {
        newQuantity = product.quantity - quantity;
        actionLabel = 'Removed';
    } else {
        return; 
    }

    if (newQuantity < 0) {
      setModalError(`Cannot remove ${quantity}. You only have ${product.quantity}.`);
      return;
    }

    if (newQuantity === 0) {
        const finalCart = cartItems.filter(item => item.id !== product.id);
        saveCart(finalCart);
        setCartItems(getCartItemsWithStock());
        alert(`Removed ALL ${product.name}(s) from cart.`);
    } else {
        const newCart = cartItems.map(item => 
            item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
        saveCart(newCart);
        setCartItems(getCartItemsWithStock());
        alert(`${actionLabel} ${quantity} x ${product.name}. Total in cart: ${newQuantity}`);
    }

    setIsModalOpen(false);
    setModalProduct(null);
  };
  
  const handleRemovePartial = () => updateOwnedQuantity(modalProduct, 'remove');
  
  const handleRemoveAll = () => {
    if (!modalProduct) return;
    const finalCart = cartItems.filter(item => item.id !== modalProduct.id);
    saveCart(finalCart);
    setCartItems(getCartItemsWithStock());
    alert(`Removed ALL ${modalProduct.name}(s) from cart.`);
    setIsModalOpen(false);
    setModalProduct(null);
  };

  const handleRedirectToCategory = () => {
    window.location.href = `/products`; 
  };

  const { checkedItems, checkedSubtotal, shippingFee, total, totalCheckedItemsCount } = useMemo(() => {
    const checked = cartItems.filter(item => item.isChecked);
    
    const totalCount = checked.reduce((sum, item) => sum + item.quantity, 0); 
    
    const subtotal = checked.reduce((sum, item) => 
      sum + (item.price * item.quantity)
    , 0);
      
    const shipping = subtotal * SHIPPING_RATE;
    const grandTotal = subtotal + shipping;

    return {
      checkedItems: checked,
      checkedSubtotal: subtotal,
      shippingFee: shipping,
      total: grandTotal,
      totalCheckedItemsCount: totalCount, 
    };
  }, [cartItems]);

  
  const CartItem = ({ item }) => {
    const currentOwnedQty = item.quantity; 
    
    return (
      <div className="cart-item">
        <input 
          type="checkbox"
          checked={item.isChecked}
          onChange={() => handleToggleCheckout(item.id)}
          className="item-checkbox"
          title="Select for checkout"
        />
        
        <div className="item-image">
          <img src={item.image || "/img/products/placeholder.png"} alt={item.name} />
        </div>
        
        <div className="item-details">
          <h3>{item.name}</h3>
          <p className="item-price-qty">
              <span className="item-price">₱{item.price.toLocaleString()}</span> 
              <span className="item-quantity"> (In cart: {currentOwnedQty} / Stock: {item.stock})</span> 
              <span className="item-subtotal"> Total: ₱{(item.price * currentOwnedQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>

        <div className="checkout-qty-controls">
            <button 
                className="qty-change-btn minus" 
                onClick={() => handleUpdateItemQuantity(item.id, -1)} 
                disabled={currentOwnedQty <= 1}
            >
                -
            </button>
            <span className="qty-value">{currentOwnedQty}</span>
            <button 
                className="qty-change-btn plus" 
                onClick={() => handleUpdateItemQuantity(item.id, 1)}
                disabled={currentOwnedQty >= item.stock} 
            >
                +
            </button>
        </div>
        
        <button 
          onClick={() => handleOpenEditModal(item)}
          className="edit-item-btn"
        >
          Edit
        </button>
      </div>
    );
  };

  return (
    <section className="cart-page">
      <h1>Your Cart ({totalCheckedItemsCount} items selected)</h1>
      
      {isModalOpen && modalProduct && (
        <div className={`modal-overlay open`}>
          <div className="quantity-modal remove-modal">
            <h2>Manage {modalProduct.name}</h2>
            <p className="modal-message">Current quantity in cart: {modalProduct.quantity}</p>
            
            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modification-section add-section">
                <button 
                    className="btn-main full-width" 
                    onClick={handleRedirectToCategory}
                >
                    View All Products
                </button>
            </div>

            <div className="modification-section remove-section">
                <h3>Remove from Cart:</h3>
                <div className="quantity-controls">
                    <input
                        type="number"
                        min="1"
                        max={modalProduct.quantity}
                        value={quantityToModify}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setQuantityToModify(val);
                        }}
                        className="quantity-input"
                    />
                    <button 
                        className="btn-secondary" 
                        onClick={handleRemovePartial}
                        disabled={quantityToModify <= 0 || quantityToModify > modalProduct.quantity}
                    >
                        Remove {quantityToModify}
                    </button>
                </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-remove-all" 
                onClick={handleRemoveAll}
              >
                Remove ALL ({modalProduct.quantity})
              </button>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Done/Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="cart-container">
        
        <div className="cart-items">
          <h2>Select Products for Checkout</h2>
          {cartItems.length === 0 ? (
            <div className="cart-placeholder">
              <p>Your cart is empty. Time to buy some gear!</p>
              <Link to="/products" className="btn-main shop-now-link">Go to Products</Link>
            </div>
          ) : (
            cartItems.map(item => <CartItem key={item.id} item={item} />)
          )}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-calculations">
            <div className="summary-row">
              <p>Items Subtotal:</p>
              <p>₱{checkedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="summary-row">
              <p>Shipping (10%):</p>
              <p>₱{shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div className="summary-total">
              <h3>Order Total:</h3>
              <h3>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
            
          <Link to="/checkout" onClick={() => saveCart(cartItems)} className="checkout-link-wrapper">
            <button 
              disabled={checkedItems.length === 0} 
              className="btn-main checkout-btn"
              title={checkedItems.length === 0 ? "Select items to proceed" : `Proceed to Checkout (${totalCheckedItemsCount} items)`}
            >
              Proceed to Checkout ({totalCheckedItemsCount} items)
            </button>
          </Link>

          <p className="member-note">
            Calculations are based on checked items (10% shipping fee).
          </p>
        </div>
      </div>
    </section>
  );
}