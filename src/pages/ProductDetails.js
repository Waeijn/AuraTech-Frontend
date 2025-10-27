import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productsData from "../data/products.json";
import "../styles/product.css";
import { useAuth } from "../components/Navbar";

const INVENTORY_KEY = "temporary_inventory";

// --- Utility Functions for Inventory and Cart Checks ---

/**
 * Initializes and retrieves product stock/inventory from local storage.
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
 * Calculates the maximum quantity of a product a user can add to the cart
 * by considering both total stock and current cart quantity.
 * @param {string} productId - The ID of the product.
 * @returns {number} The maximum quantity allowed to add.
 */
const getMaxAllowedToAdd = (productId) => {
  const inventory = getInventory();
  const currentStock = inventory[productId] || 0;
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === productId);
  const currentCartQty = existingItem ? existingItem.quantity : 0;
  // Stock minus what's already in the cart
  return currentStock - currentCartQty;
};

/**
 * Core logic to update the cart in local storage with the selected quantity.
 * Includes necessary stock and boundary checks.
 * @param {object} product - The product object being added.
 * @param {number} quantity - The quantity to add.
 */
const handleAddToCartLogic = (product, quantity) => {
  const inventory = getInventory();
  const currentStock = inventory[product.id] || 0;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === product.id);

  const currentCartQuantity = existingItem ? existingItem.quantity : 0;
  // Check against total stock capacity
  if (currentCartQuantity + quantity > currentStock) {
    alert(
      `Cannot add ${quantity}: Cart already contains ${currentCartQuantity}. Only ${currentStock} total are available.`
    );
    return;
  }

  // Update cart
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      isChecked: true, // Default to checked upon adding
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`Added ${quantity} x ${product.name} to cart!`);
};

// --- ProductDetails Component ---

/**
 * ProductDetails Component
 * Displays comprehensive details for a single product, including stock,
 * specifications, and an Add to Cart button that triggers a quantity modal.
 * @param {object} propProduct - Optional product object passed via props (for embedded use).
 * @param {function} onBack - Optional function to handle back action.
 */
const ProductDetails = ({ product: propProduct, onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Find product by ID from data or use propProduct
  const product =
    propProduct || productsData.find((p) => String(p.id) === String(id));

  // Get current stock status
  const inventory = getInventory();
  const currentStock = product ? inventory[product.id] || 0 : 0;

  // State for quantity modal and its input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // State for the authentication required prompt modal
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // --- Effects ---

  // Scrolls the window to the top on component render/mount
  useEffect(() => {
    window.scrollTo(0, 0);
  });

  // Exposes a global function to trigger the quantity modal for use by other components (e.g., ProductCard)
  useEffect(() => {
    if (product && !propProduct) {
      window.showQuantityModal = (p = product) => {
        setModalProduct(p);
        if (!currentUser) {
          setIsAuthPromptOpen(true); // Show auth prompt if not logged in
        } else {
          setQuantity(1); // Reset quantity and open the main modal
          setIsModalOpen(true);
        }
      };
    }
    // Cleanup function to remove the global function when the component unmounts
    return () => {
      delete window.showQuantityModal;
    };
  }, [product, propProduct, currentUser]);

  // --- Modal Handlers ---

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  /** Closes auth prompt and redirects to login page. */
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  /**
   * Updates the quantity in the modal via +/- buttons.
   * Enforces min (1) and max (stock minus current cart quantity) boundaries.
   */
  const handleQuantityChange = (delta) => {
    if (!modalProduct) return;
    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);

    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.min(Math.max(1, newQty), maxAllowed);
    });
  };

  /**
   * Updates quantity in the modal via manual input.
   * Enforces min (1) and max (stock minus current cart quantity) boundaries.
   */
  const handleManualQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!modalProduct) return;

    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);

    let newQty = isNaN(value) || value < 1 ? 1 : value;

    newQty = Math.min(newQty, maxAllowed);

    setQuantity(newQty);
  };

  /** Final action to call the core cart logic and close the modal. */
  const handleFinalAddToCart = () => {
    if (!modalProduct || quantity < 1) return;

    handleAddToCartLogic(modalProduct, quantity);
    handleCloseModal();
  };

  /** Primary handler for the 'Add to Cart' button on the main details page. */
  const handleShowModal = () => {
    setModalProduct(product);
    if (!currentUser) {
      setIsAuthPromptOpen(true); // Show login requirement
    } else {
      setQuantity(1);
      setIsModalOpen(true); // Open quantity selection modal
    }
  };

  const maxQtyAllowed = modalProduct ? getMaxAllowedToAdd(modalProduct.id) : 0;

  // --- Error State ---

  if (!product) {
    return (
      <div className="details-container">
        <div className="details-card">
          <p>Product not found.</p>
          <button className="btn-main" onClick={() => navigate("/products")}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // --- JSX Helpers ---

  /** Renders the technical specifications list if available. */
  const renderSpecifications = (specs) => {
    if (!specs || Object.keys(specs).length === 0) return null;

    const keys = Object.keys(specs);

    return (
      <div className="specifications-section">
        <h3>Technical Specifications</h3>
        <ul className="spec-list">
          {keys.map((key) => (
            <li key={key} className="spec-item">
              <span className="spec-key">{key}:</span>
              <span className="spec-value">{specs[key]}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <div className="details-container">
      {/* 1. Login Required Modal (Displayed if user is a guest) */}
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>
            You must be logged in to add items to your cart. Do you want to
            login now or stay on this page?
          </p>

          <div className="modal-actions">
            <button className="btn-main" onClick={handleLoginRedirect}>
              Login
            </button>
            <button className="btn-cancel" onClick={handleCloseAuthPrompt}>
              Stay on Page
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quantity Selection Modal (Displayed if user is logged in) */}
      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{modalProduct?.name}</p>

          <div className="quantity-controls">
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={maxQtyAllowed}
              value={quantity}
              onChange={handleManualQuantityChange}
              className="quantity-input-field"
              disabled={maxQtyAllowed === 0}
            />
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= maxQtyAllowed || maxQtyAllowed === 0}
            >
              +
            </button>
          </div>

          <p className="modal-stock-info">
            Max available to add: {maxQtyAllowed}
          </p>

          <div className="modal-actions">
            <button
              className="btn-main"
              onClick={handleFinalAddToCart}
              disabled={quantity > maxQtyAllowed || maxQtyAllowed === 0}
            >
              Add {quantity} to Cart
            </button>
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Product Details View */}
      <div className="details-card">
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-info">
          <h2>{product.name}</h2>
          <p className="details-price">₱{product.price.toLocaleString()}</p>
          <p className="details-desc">{product.description}</p>
          {/* Stock status display */}
          <p
            className={`product-stock ${
              currentStock > 0 ? "in-stock" : "out-of-stock"
            }`}
          >
            {currentStock > 0 ? `In Stock: ${currentStock}` : "Out of Stock"}
          </p>

          <div className="details-buttons">
            <button
              className="btn-main"
              // Use onBack prop if available, otherwise navigate to products list
              onClick={onBack || (() => navigate("/products"))}
            >
              Back to Products
            </button>
            <button
              className="btn-secondary"
              onClick={handleShowModal}
              disabled={currentStock === 0}
            >
              Add to Cart
            </button>
          </div>

          {/* Technical Specifications Section */}
          {renderSpecifications(product.specifications)}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
