import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/product.css";
import { useAuth } from "../components/Navbar";
import { productService } from "../services/productService"; // Import Service
import { cartService } from "../services/cartService";       // Import Service

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 1. Fetch Product Data (Using Service)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // Use Service
        const response = await productService.getById(id);

        if (response.success) {
          setProduct(response.data);
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load product details");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // 2. Add to Cart Logic (Using Service)
  const handleFinalAddToCart = async () => {
    if (!product || quantity < 1) return;

    if (!currentUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    try {
      // Use Service
      const response = await cartService.add(product.id, quantity);

      if (response.success) {
        alert(`Added ${quantity} x ${product.name} to cart!`);
        setIsModalOpen(false);
      } else {
        alert(response.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Cart Error:", err);
      alert("Error adding item to cart.");
    }
  };

  // UI Handlers (Unchanged)
  const handleShowModal = () => {
    if (!currentUser) {
      setIsAuthPromptOpen(true);
    } else {
      setQuantity(1);
      setIsModalOpen(true);
    }
  };
  
  const handleLoginRedirect = () => {
      setIsAuthPromptOpen(false);
      navigate("/login");
  };

  if (loading) return <div className="details-container"><p>Loading details...</p></div>;
  if (error || !product) return (
    <div className="details-container">
      <div className="details-card">
        <p>{error || "Product not found."}</p>
        <button className="btn-main" onClick={() => navigate("/products")}>Back to Products</button>
      </div>
    </div>
  );

  return (
    <div className="details-container">
      {/* Login Prompt Modal */}
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>You must be logged in to add items to your cart.</p>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleLoginRedirect}>Login</button>
            <button className="btn-cancel" onClick={() => setIsAuthPromptOpen(false)}>Stay on Page</button>
          </div>
        </div>
      </div>

      {/* Quantity Modal */}
      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{product.name}</p>
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
            <input type="number" min="1" value={quantity} readOnly className="quantity-input-field" />
            <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleFinalAddToCart}>Add to Cart</button>
            <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </div>

      {/* Main Details */}
      <div className="details-card">
        <div className="details-image-wrapper">
          <img src={product.image || "/img/products/placeholder.png"} alt={product.name} />
        </div>

        <div className="details-info">
          <h2>{product.name}</h2>
          <p className="details-price">₱{Number(product.price).toLocaleString()}</p>
          <p className="details-desc">{product.description}</p>
          
          <p className={`product-stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
            {product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}
          </p>

          <div className="details-buttons">
            <button className="btn-main" onClick={() => navigate("/products")}>Back to Products</button>
            <button className="btn-secondary" onClick={handleShowModal} disabled={product.stock === 0}>
              Add to Cart
            </button>
          </div>

          {product.specifications && (
            <div className="specifications-section">
              <h3>Technical Specifications</h3>
              <p>{JSON.stringify(product.specifications)}</p> 
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;