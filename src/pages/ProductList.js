import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import "../styles/product.css";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../components/Navbar";
import { productService } from "../services/productService"; // Import Service
import { cartService } from "../services/cartService";       // Import Service

const ProductList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // --- 1. Fetch Products (Using Service) ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use Service: No API URL needed
        const result = await productService.getAll({ per_page: 100 });

        if (result.success) {
          setProducts(result.data);
        } else {
          setError("Failed to load products");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo(0, 0);
  }, []);

  // --- 2. Add to Cart (Using Service) ---
  const handleAddToCartLogic = async (product, qty) => {
    if (!currentUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    try {
      // Use Service: No token handling needed
      const response = await cartService.add(product.id, qty);

      if (response.success) {
        alert(`Added ${qty} x ${product.name} to cart!`);
        handleCloseModal();
      } else {
        alert(response.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Cart Error:", err);
      // Service layer throws errors, so we catch them here
      alert("Error adding item to cart.");
    }
  };

  // --- Modal Handlers ---
  const handleShowQuantityModal = (product) => {
    setModalProduct(product);
    if (!currentUser) {
      setIsAuthPromptOpen(true);
    } else {
      setQuantity(1);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleManualQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    setQuantity(isNaN(val) || val < 1 ? 1 : val);
  };

  const handleFinalAddToCart = () => {
    if (modalProduct && quantity >= 1) {
      handleAddToCartLogic(modalProduct, quantity);
    }
  };

  const handleBackToList = () => setSelectedProduct(null);

  // --- Filtering Logic (Same as before) ---
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search")?.toLowerCase() || "";
  const categories = ["All", ...new Set(products.map(p => p.category_name || p.category))];

  const filteredProducts = products.filter((p) => {
    const categoryName = p.category_name || p.category || "";
    const matchesCategory = selectedCategory === "All" || categoryName === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      categoryName.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  // --- Main Render ---
  if (loading) return <div className="product-container"><p>Loading products...</p></div>;
  if (error) return <div className="product-container"><p className="error-text">{error}</p></div>;

  return (
    <>
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>You must be logged in to add items to your cart.</p>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleLoginRedirect}>Login</button>
            <button className="btn-cancel" onClick={handleCloseAuthPrompt}>Cancel</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{modalProduct?.name}</p>
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
            <input type="number" min="1" value={quantity} onChange={handleManualQuantityChange} className="quantity-input-field" />
            <button className="quantity-btn" onClick={() => handleQuantityChange(1)}>+</button>
          </div>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleFinalAddToCart}>Add to Cart</button>
            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
          </div>
        </div>
      </div>

      <div className="product-container">
        {selectedProduct ? (
          <ProductDetails product={selectedProduct} onBack={handleBackToList} />
        ) : (
          <>
            <div className="product-header">
              <h1 className="product-title">Our Products</h1>
              <p className="product-subtitle">Explore AuraTech&apos;s next-gen gaming gear.</p>
              <div className="divider"></div>
            </div>

            <div className="category-filter">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={() => setSelectedProduct(product)}
                    onAddToCart={() => handleShowQuantityModal(product)}
                  />
                ))
              ) : (
                <p>No products found.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProductList;