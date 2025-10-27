import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "../styles/cart.css";
import productsData from "../data/products.json";

const SHIPPING_RATE = 0.1; // 10% shipping fee
const INVENTORY_KEY = "temporary_inventory";

// --- Utility Functions for Cart and Inventory Management ---

const getCart = () => JSON.parse(localStorage.getItem("cart")) || [];
const saveCart = (cart) => localStorage.setItem("cart", JSON.stringify(cart));

/**
 * Initializes and retrieves product stock/inventory from local storage.
 * Defaults to product data stock if local storage is empty.
 * @returns {object} The current inventory object {productId: stockCount}.
 */
const getInventory = () => {
  let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  if (!inventory) {
    const initialStock = {};
    productsData.forEach((p) => {
      // Use product stock or a high default if undefined
      initialStock[p.id] = p.stock || 99999;
    });
    inventory = initialStock;
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
  return inventory;
};

/**
 * Merges cart data (quantity, selection) with current stock/inventory data.
 * @returns {Array} List of cart items enriched with 'stock' property.
 */
const getCartItemsWithStock = () => {
  const cart = getCart();
  const inventory = getInventory();
  return cart.map((item) => {
    return {
      ...item,
      stock: inventory[item.id] || 0,
    };
  });
};

// --- Cart Component ---

/**
 * Cart Component
 * Displays selected cart items, allows quantity modification,
 * calculates subtotal/shipping/total for selected items, and handles checkout preparation.
 */
export default function Cart() {
  const [cartItems, setCartItems] = useState(getCartItemsWithStock());
  // State for the item quantity modification modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantityToModify, setQuantityToModify] = useState(1);
  const [modalError, setModalError] = useState("");

  // Effect to refresh cart data when the window regains focus (e.g., after login/modal close)
  useEffect(() => {
    const refreshCart = () => setCartItems(getCartItemsWithStock());
    refreshCart();

    window.addEventListener("focus", refreshCart);
    return () => window.removeEventListener("focus", refreshCart);
  }, []);

  // --- Handlers ---

  /**
   * Toggles the 'isChecked' status of a cart item for checkout selection.
   * Updates local storage and refreshes component state.
   * @param {string} id - The ID of the product to toggle.
   */
  const handleToggleCheckout = (id) => {
    const newCart = cartItems.map((item) =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    );
    saveCart(newCart);
    setCartItems(getCartItemsWithStock());
  };

  /**
   * Sets up and opens the modal for complex quantity editing (e.g., removing multiple).
   * @param {object} item - The cart item to be modified.
   */
  const handleOpenEditModal = (item) => {
    setModalProduct(item);
    setQuantityToModify(1);
    setModalError("");
    setIsModalOpen(true);
  };

  /**
   * Updates an item's quantity by a fixed delta (+1 or -1).
   * Includes boundary checks against minimum quantity (1) and max stock.
   * @param {string} id - The product ID.
   * @param {number} delta - The change in quantity (-1 or 1).
   */
  const handleUpdateItemQuantity = (id, delta) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    let newQuantity = item.quantity + delta;
    const maxStock = item.stock;

    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > maxStock) {
      alert(`Cannot add more than the available stock: ${maxStock}`);
      return;
    }

    const newCart = cartItems.map((cartItem) =>
      cartItem.id === id ? { ...cartItem, quantity: newQuantity } : cartItem
    );

    // Remove item if quantity drops to 0 (though prevented by the check above, this is for safety)
    const finalCart = newCart.filter((item) => item.quantity > 0);
    saveCart(finalCart);
    setCartItems(getCartItemsWithStock());
  };

  /**
   * Handles the modal logic for removing a partial quantity of a product.
   * Validates input and updates the cart state accordingly.
   * @param {object} product - The product being modified.
   * @param {string} operation - Should be "remove" in this context.
   */
  const updateOwnedQuantity = (product, operation) => {
    setModalError("");
    let quantity = parseInt(quantityToModify);

    if (isNaN(quantity) || quantity <= 0) {
      setModalError(`Please enter a valid quantity to ${operation}.`);
      return;
    }

    let newQuantity;
    let actionLabel;

    if (operation === "remove") {
      newQuantity = product.quantity - quantity;
      actionLabel = "Removed";
    } else {
      // Guard clause for other operations not implemented
      return;
    }

    // Validation check: ensure we don't remove more than owned
    if (newQuantity < 0) {
      setModalError(
        `Cannot remove ${quantity}. You only have ${product.quantity}.`
      );
      return;
    }

    // Logic for updating the cart
    if (newQuantity === 0) {
      const finalCart = cartItems.filter((item) => item.id !== product.id);
      saveCart(finalCart);
      setCartItems(getCartItemsWithStock());
      alert(`Removed ALL ${product.name}(s) from cart.`);
    } else {
      const newCart = cartItems.map((item) =>
        item.id === product.id ? { ...item, quantity: newQuantity } : item
      );
      saveCart(newCart);
      setCartItems(getCartItemsWithStock());
      alert(
        `${actionLabel} ${quantity} x ${product.name}. Total in cart: ${newQuantity}`
      );
    }

    // Close and reset modal state upon successful update
    setIsModalOpen(false);
    setModalProduct(null);
  };

  /** Helper function to call the main update function for partial removal. */
  const handleRemovePartial = () => updateOwnedQuantity(modalProduct, "remove");

  /** Removes all units of the modal-selected product from the cart. */
  const handleRemoveAll = () => {
    if (!modalProduct) return;
    const finalCart = cartItems.filter((item) => item.id !== modalProduct.id);
    saveCart(finalCart);
    setCartItems(getCartItemsWithStock());
    alert(`Removed ALL ${modalProduct.name}(s) from cart.`);
    setIsModalOpen(false);
    setModalProduct(null);
  };

  /** Helper function for the modal button to redirect to the product listing. */
  const handleRedirectToCategory = () => {
    window.location.href = `/products`;
  };

  // --- Memoized Calculations for Summary ---

  const {
    checkedItems,
    checkedSubtotal,
    shippingFee,
    total,
    totalCheckedItemsCount,
  } = useMemo(() => {
    const checked = cartItems.filter((item) => item.isChecked);

    const totalCount = checked.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = checked.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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

  // --- CartItem Sub-Component ---

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
          <img
            src={item.image || "/img/products/placeholder.png"}
            alt={item.name}
          />
        </div>

        <div className="item-details">
          <h3>{item.name}</h3>
          <p className="item-price-qty">
            <span className="item-price">₱{item.price.toLocaleString()}</span>
            <span className="item-quantity">
              {" "}
              (In cart: {currentOwnedQty} / Stock: {item.stock})
            </span>
            <span className="item-subtotal">
              {" "}
              Total: ₱
              {(item.price * currentOwnedQty).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>

        {/* Inline Quantity Controls (+/- buttons) */}
        <div className="checkout-qty-controls">
          <button
            className="qty-change-btn minus"
            onClick={() => handleUpdateItemQuantity(item.id, -1)}
            disabled={currentOwnedQty <= 1} // Disable if only one item is left
          >
            -
          </button>
          <span className="qty-value">{currentOwnedQty}</span>
          <button
            className="qty-change-btn plus"
            onClick={() => handleUpdateItemQuantity(item.id, 1)}
            disabled={currentOwnedQty >= item.stock} // Disable if max stock is reached
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

  // --- Main Render ---

  return (
    <section className="cart-page">
      <h1>Your Cart ({totalCheckedItemsCount} items selected)</h1>

      {/* Quantity Modification Modal */}
      {isModalOpen && modalProduct && (
        <div className={`modal-overlay open`}>
          <div className="quantity-modal remove-modal">
            <h2>Manage {modalProduct.name}</h2>
            <p className="modal-message">
              Current quantity in cart: {modalProduct.quantity}
            </p>

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
                    // Ensures input is parsed as an integer or defaults to 0
                    const val = parseInt(e.target.value) || 0;
                    setQuantityToModify(val);
                  }}
                  className="quantity-input"
                />
                <button
                  className="btn-secondary"
                  onClick={handleRemovePartial}
                  disabled={
                    quantityToModify <= 0 ||
                    quantityToModify > modalProduct.quantity
                  }
                >
                  Remove {quantityToModify}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-remove-all" onClick={handleRemoveAll}>
                Remove ALL ({modalProduct.quantity})
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Items and Summary Layout */}
      <div className="cart-container">
        <div className="cart-items">
          <h2>Select Products for Checkout</h2>
          {cartItems.length === 0 ? (
            <div className="cart-placeholder">
              <p>Your cart is empty. Time to buy some gear! 🎮</p>
              <Link to="/products" className="btn-main shop-now-link">
                Go to Products
              </Link>
            </div>
          ) : (
            cartItems.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {/* Order Summary Section */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-calculations">
            {/* Subtotal */}
            <div className="summary-row">
              <p>Items Subtotal:</p>
              <p>
                ₱
                {checkedSubtotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Shipping Fee */}
            <div className="summary-row">
              <p>Shipping (10%):</p>
              <p>
                ₱
                {shippingFee.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Grand Total */}
            <div className="summary-total">
              <h3>Order Total:</h3>
              <h3>
                ₱
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
          </div>

          {/* Checkout Button */}
          <Link
            to="/checkout"
            onClick={() => saveCart(cartItems)}
            className="checkout-link-wrapper"
          >
            <button
              disabled={checkedItems.length === 0}
              className="btn-main checkout-btn"
              title={
                checkedItems.length === 0
                  ? "Select items to proceed"
                  : `Proceed to Checkout (${totalCheckedItemsCount} items)`
              }
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
