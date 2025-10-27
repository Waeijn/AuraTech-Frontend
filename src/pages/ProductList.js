import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductDetails from "./ProductDetails"; // Assuming this is the component from the previous file
import productsData from "../data/products.json";
import "../styles/product.css";
import ProductCard from "../components/ProductCard"; // Assuming this is the card component
import { useAuth } from "../components/Navbar";

const INVENTORY_KEY = "temporary_inventory";

// --- Utility Functions for Inventory and Cart Checks ---

/**
 * Initializes and retrieves product stock/inventory from local storage.
 * @returns {object} The current inventory object {productId: stockCount}.
 */
const getInventory = () => {
  let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  const initialStock = {};

  // Initialize stock for all products from data
  productsData.forEach((p) => {
    initialStock[p.id] = Number(p.stock) || 99999;
  });

  if (!inventory) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialStock));
    return initialStock;
  }

  // Update logic to handle new products or stock resets
  let updated = false;
  productsData.forEach((p) => {
    if (!(p.id in inventory)) {
      inventory[p.id] = Number(p.stock) || 99999;
      updated = true;
    } else if (inventory[p.id] <= 0 && p.stock > 0) {
      // Reset stock if the item was sold out but product data shows new stock
      inventory[p.id] = Number(p.stock);
      updated = true;
    }
  });

  if (updated) {
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
  const requestedQuantity = quantity;

  // Check if requested quantity exceeds total stock
  if (requestedQuantity > currentStock) {
    alert(
      `Cannot add ${requestedQuantity}: Only ${currentStock} are available in stock.`
    );
    return;
  }

  // Check if adding the requested quantity exceeds available stock
  if (currentCartQuantity + requestedQuantity > currentStock) {
    alert(
      `Cannot add ${requestedQuantity}: You already have ${currentCartQuantity} in your cart. Only ${currentStock} total are available.`
    );
    return;
  }

  // Update cart with new quantity
  if (existingItem) {
    existingItem.quantity += requestedQuantity;
  } else {
    // Add new item to cart
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: requestedQuantity,
      isChecked: true,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`Added ${requestedQuantity} x ${product.name} to cart!`);
};

// --- ProductList Component ---

/**
 * ProductList Component
 * Renders the product catalog, handling category filtering, search queries,
 * and managing the Add to Cart quantity modal flow.
 */
const ProductList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State for filtering and view toggling
  const [selectedProduct, setSelectedProduct] = useState(null); // Used to switch to ProductDetails view
  const [selectedCategory, setSelectedCategory] = useState("All");

  // State for the Quantity Modal (Add to Cart flow)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false); // Login required modal
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // --- Effects ---

  // Ensures the page is scrolled to the top whenever the component state changes (e.g., view switch)
  useEffect(() => {
    window.scrollTo(0, 0);
  });

  // Exposes a global function to trigger the quantity modal for use by child components (ProductCard)
  useEffect(() => {
    window.showQuantityModal = (product) => {
      setModalProduct(product);
      if (!currentUser) {
        setIsAuthPromptOpen(true); // Show login prompt if not authenticated
      } else {
        setQuantity(1); // Reset quantity and open the main modal
        setIsModalOpen(true);
      }
    };
    // Cleanup function
    return () => {
      delete window.showQuantityModal;
    };
  }, [currentUser]);

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

  /** Final action to confirm quantity, call cart logic, and close the modal. */
  const handleFinalAddToCart = () => {
    if (!modalProduct || quantity < 1) return;
    handleAddToCartLogic(modalProduct, quantity);
    handleCloseModal();
  };

  /** Switches the view back from ProductDetails to the main product list. */
  const handleBackToList = () => setSelectedProduct(null);

  // --- Data and Filtering Logic ---

  // Get search term from URL query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search")?.toLowerCase() || "";

  // Defined list of all product categories
  const categories = [
    "All",
    "Gaming Laptops",
    "Smartphones",
    "Smartwatches",
    "Audio",
    "Mouse & Keyboards",
    "Monitors",
    "Cameras",
    "Gaming Chairs",
    "Game Consoles",
    "Microphones",
    "Stands & Mounts",
    "PC Components",
    "Accessories",
  ];

  // Filter products based on selected category and search term
  const filteredProducts = productsData.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const maxQtyAllowed = modalProduct ? getMaxAllowedToAdd(modalProduct.id) : 0;

  // --- Main Render ---

  return (
    <>
      {/* 1. Login Required Modal */}
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

      {/* 2. Quantity Selection Modal */}
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

      {/* Main Content Area */}
      <div className="product-container">
        {selectedProduct ? (
          // View 1: Display single product details
          <ProductDetails product={selectedProduct} onBack={handleBackToList} />
        ) : (
          // View 2: Display product list and filters
          <>
            <div className="product-header">
              <h1 className="product-title">Our Products</h1>
              <p className="product-subtitle">
                Explore AuraTech’s next-gen gaming gear — engineered for power,
                precision, and performance.
              </p>
              <div className="divider"></div>
              {searchTerm && (
                <p className="search-results-msg">
                  Showing results for: <strong>{searchTerm}</strong>
                </p>
              )}
            </div>

            {/* Category Filter Buttons */}
            <div className="category-filter">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${
                    selectedCategory === cat ? "active" : ""
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    // Clicking the card navigates to the details view
                    onViewDetails={() => setSelectedProduct(product)}
                  />
                ))
              ) : (
                <p>No products found for your search.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProductList;
