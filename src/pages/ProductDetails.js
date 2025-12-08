// src/pages/ProductDetails.js

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/product.css";
import { useAuth } from "../components/Navbar";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // 1. Fetch Product Data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || id === "undefined") {
        console.error("Invalid product ID:", id);
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await productService.getById(id);

        if (response && response.success && response.data) {
          setProduct(response.data);

          const primaryImg = response.data.images?.find(
            (img) => img.is_primary
          );
          setSelectedImage(
            primaryImg?.url ||
              response.data.images?.[0]?.url ||
              "/img/products/placeholder.png"
          );
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Could not load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  // 2. Add to Cart Logic
  const handleFinalAddToCart = async () => {
    if (!product || quantity < 1) return;

    if (!currentUser) {
      setIsAuthPromptOpen(true);
      return;
    }

    try {
      const response = await cartService.add(product.id, quantity);

      if (response && response.success) {
        alert(`Added ${quantity} x ${product.name} to cart!`);
        setIsModalOpen(false);
        setQuantity(1); // Reset quantity
      } else {
        alert(response?.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error("Cart Error:", err);
      alert(err.message || "Error adding item to cart.");
    }
  };

  // UI Handlers
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

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  // Loading State
  if (loading) {
    return (
      <div className="details-container">
        <div className="details-card">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !product) {
    return (
      <div className="details-container">
        <div className="details-card">
          <p style={{ color: "#ef4444", marginBottom: "20px" }}>
            {error || "Product not found."}
          </p>
          <button className="btn-main" onClick={() => navigate("/products")}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="details-container">
      {/* Login Prompt Modal */}
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>You must be logged in to add items to your cart.</p>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleLoginRedirect}>
              Login
            </button>
            <button
              className="btn-cancel"
              onClick={() => setIsAuthPromptOpen(false)}
            >
              Stay on Page
            </button>
          </div>
        </div>
      </div>

      {/* Quantity Modal */}
      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{product.name}</p>
          <div className="quantity-controls">
            <button
              className="quantity-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setQuantity(Math.min(Math.max(1, val), product.stock));
              }}
              className="quantity-input-field"
            />
            <button
              className="quantity-btn"
              onClick={() => setQuantity(Math.min(quantity + 1, product.stock))}
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Max available: {product.stock}
          </p>
          <div className="modal-actions">
            <button className="btn-main" onClick={handleFinalAddToCart}>
              Add to Cart
            </button>
            <button
              className="btn-cancel"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Main Details */}
      <div className="details-card">
        {/* Image Section with Gallery */}
        <div className="details-image-wrapper">
          <img
            src={selectedImage}
            alt={product.name}
            className="main-product-image"
            onError={(e) => {
              e.target.src = "/img/products/placeholder.png";
            }}
          />

          {/* Image Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="image-thumbnails">
              {product.images.map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${
                    selectedImage === img.url ? "active" : ""
                  }`}
                  onClick={() => handleImageClick(img.url)}
                  onError={(e) => {
                    e.target.src = "/img/products/placeholder.png";
                  }}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    cursor: "pointer",
                    border:
                      selectedImage === img.url
                        ? "2px solid #00bcd4"
                        : "1px solid #ddd",
                    borderRadius: "8px",
                    marginRight: "10px",
                    marginTop: "10px",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="details-info">
          <h2>{product.name}</h2>

          {/* Category */}
          {product.category && (
            <p
              className="product-category"
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "10px",
              }}
            >
              {/* LOGIC FIX: Handle safely if category is object or name */}
              Category: {product.category.name || product.category || "General"}
            </p>
          )}

          {/* Price - LOGIC FIX: Removed '/ 100' */}
          <p className="details-price">
            ₱
            {(product.price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>

          {/* Description */}
          <p className="details-desc">
            {product.description || "No description available."}
          </p>

          {/* Stock Status */}
          <p
            className={`product-stock ${
              product.stock > 0 ? "in-stock" : "out-of-stock"
            }`}
          >
            {product.stock > 0 ? `In Stock: ${product.stock}` : "Out of Stock"}
          </p>

          {/* Featured Badge */}
          {product.featured && (
            <span
              style={{
                display: "inline-block",
                background: "#ffc107",
                color: "#000",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "15px",
              }}
            >
              ⭐ Featured Product
            </span>
          )}

          {/* Action Buttons */}
          <div className="details-buttons">
            <button
              className="btn-main"
              onClick={() => navigate("/products")}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 4px 12px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Back to Products
            </button>

            <button
              className="btn-secondary"
              onClick={handleShowModal}
              disabled={product.stock === 0}
              style={{
                background:
                  product.stock === 0
                    ? "#cccccc"
                    : "linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: product.stock === 0 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                opacity: product.stock === 0 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (product.stock > 0) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 4px 12px rgba(0, 188, 212, 0.4)";
                  e.target.style.background =
                    "linear-gradient(135deg, #00acc1 0%, #0097a7 100%)";
                }
              }}
              onMouseLeave={(e) => {
                if (product.stock > 0) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background =
                    "linear-gradient(135deg, #00bcd4 0%, #00acc1 100%)";
                }
              }}
            >
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>

          {/* Specifications */}
          {product.specifications &&
            Object.keys(product.specifications).length > 0 && (
              <div
                className="specifications-section"
                style={{ marginTop: "30px" }}
              >
                <h3 style={{ marginBottom: "15px", fontSize: "20px" }}>
                  Technical Specifications
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <tbody>
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <tr
                          key={key}
                          style={{
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 8px",
                              fontWeight: "600",
                              width: "40%",
                              color: "#333",
                            }}
                          >
                            {key}
                          </td>
                          <td
                            style={{
                              padding: "12px 8px",
                              color: "#666",
                            }}
                          >
                            {value}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;