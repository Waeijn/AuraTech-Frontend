import { useNavigate } from "react-router-dom";
import "../styles/product.css";

/**
 * ProductCard Component
 * Displays product info. Stock is now managed by the backend, 
 * so local inventory checks have been removed.
 */
export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();

    // The modal function is defined globally in ProductList.js
    if (window.showQuantityModal) {
      window.showQuantityModal(product);
    } else {
      console.error("Quantity modal not initialized.");
    }
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  // API Integration: Stock comes directly from the product object
  const currentStock = product.stock || 0;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img 
          src={product.image || product.images?.[0]?.url || "/img/products/placeholder.png"} 
          alt={product.name}
          onError={(e) => { e.target.src = "/img/products/placeholder.png" }}
        />
      </div>

      <h3>{product.name}</h3>
      {/* Display raw price as requested (preserves 34.99 or 3499 formatting from DB) */}
      <p className="product-price">₱{product.price.toLocaleString()}</p>

      <p
        className={`product-stock ${
          currentStock > 0 ? "in-stock" : "out-of-stock"
        }`}
      >
        {currentStock > 0 ? `In Stock: ${currentStock}` : "Out of Stock"}
      </p>

      <div className="card-buttons">
        <button className="btn-main" onClick={handleViewDetails}>
          View Details
        </button>
        <button
          className="btn-secondary"
          onClick={handleAddToCart}
          disabled={currentStock === 0}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}