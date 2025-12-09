import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import "../styles/product.css";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../components/Navbar";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";

const ProductList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();

  // Main product list state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal and cart states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  });

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await productService.getAll({ per_page: 100 });
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        const mappedProducts = data.map((p) => ({
          ...p,
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          category: p.category?.name || p.category || "Uncategorized",
          image:
            p.images?.[0]?.url || p.image || "/img/products/placeholder.png",
          description: p.description,
          stock: p.stock,
        }));

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Expose global function to open quantity modal (used in other components)
  useEffect(() => {
    window.showQuantityModal = (product) => {
      setModalProduct(product);

      if (!currentUser) {
        setIsAuthPromptOpen(true);
      } else {
        setQuantity(1);
        setIsModalOpen(true);
      }
    };

    return () => {
      delete window.showQuantityModal;
    };
  }, [currentUser]);

  // Get maximum allowed quantity for current modal product
  const getMaxAllowedToAdd = (productId) => {
    if (!modalProduct) return 0;
    return modalProduct.stock;
  };

  // Modal handlers
  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  // Change quantity using +/- buttons
  const handleQuantityChange = (delta) => {
    if (!modalProduct) return;
    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);

    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.min(Math.max(1, newQty), maxAllowed);
    });
  };

  // Change quantity manually from input field
  const handleManualQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!modalProduct) return;

    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);
    let newQty = isNaN(value) || value < 1 ? 1 : value;
    newQty = Math.min(newQty, maxAllowed);
    setQuantity(newQty);
  };

  // Add selected product to cart
  const handleFinalAddToCart = async () => {
    if (!modalProduct || quantity < 1) return;

    try {
      setAddingToCart(true);
      await cartService.add(modalProduct.id, quantity);

      alert(`Added ${quantity} x ${modalProduct.name} to cart!`);
      handleCloseModal();
    } catch (error) {
      alert(error.message || "Error adding to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBackToList = () => setSelectedProduct(null);

  // Handle search term from query params
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search")?.toLowerCase() || "";

  const handleClearSearch = () => {
    navigate(location.pathname);
  };

  // List of categories
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

  // Filter products by category and search term
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (p.category &&
        p.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSearch;
  });

  const maxQtyAllowed = modalProduct ? getMaxAllowedToAdd(modalProduct.id) : 0;

  return (
    <>
      {/* AUTH REQUIRED MODAL */}
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>You must be logged in to add items to your cart.</p>
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

      {/* QUANTITY SELECTION MODAL */}
      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{modalProduct?.name}</p>

          <div className="quantity-controls">
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || addingToCart}
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
              disabled={maxQtyAllowed === 0 || addingToCart}
            />
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(1)}
              disabled={
                quantity >= maxQtyAllowed || maxQtyAllowed === 0 || addingToCart
              }
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
              disabled={
                quantity > maxQtyAllowed || maxQtyAllowed === 0 || addingToCart
              }
            >
              {addingToCart ? "Adding..." : `Add ${quantity} to Cart`}
            </button>
            <button
              className="btn-cancel"
              onClick={handleCloseModal}
              disabled={addingToCart}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* MAIN PRODUCT LIST OR DETAILS VIEW */}
      <div className="product-container">
        {selectedProduct ? (
          <ProductDetails product={selectedProduct} onBack={handleBackToList} />
        ) : (
          <>
            <div className="product-header">
              <h1 className="product-title">Our Products</h1>
              <p className="product-subtitle">
                Explore AuraTech's next-gen gaming gear — engineered for power,
                precision, and performance.
              </p>
              <div className="divider"></div>

              {/* Show search term if present */}
              {searchTerm && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <p className="search-results-msg" style={{ margin: 0 }}>
                    Showing results for: <strong>{searchTerm}</strong>
                  </p>
                  <button
                    onClick={handleClearSearch}
                    style={{
                      background: "none",
                      border: "1px solid var(--color-accent, #00d2d3)",
                      color: "var(--color-accent, #00d2d3)",
                      borderRadius: "20px",
                      padding: "4px 12px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                    }}
                  >
                    Clear ✕
                  </button>
                </div>
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
              {loading ? (
                <div className="page-loader-wrapper">
                  <div className="page-spinner"></div>
                  <span className="page-loader-text">Loading products...</span>
                </div>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={() => setSelectedProduct(product)}
                  />
                ))
              ) : (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  <p>No products found for "{searchTerm}".</p>
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="btn-main"
                      style={{ marginTop: "15px" }}
                    >
                      Clear Search & Show All
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProductList;
