import { useNavigate } from "react-router-dom";
import "../styles/product.css";

/**
 * - Displays product info and stock from backend
 * - Triggers global quantity modal for adding to cart
 */
export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // Open quantity modal (initialized globally in ProductList.js)
  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (window.showQuantityModal) {
      window.showQuantityModal(product);
    } else {
      console.error("Quantity modal not initialized.");
    }
  };

  // Redirect user to product details page
  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  // Backend-provided stock value
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
      {/* Price uses backend raw value and formats with commas */}
      <p className="product-price">₱{product.price.toLocaleString()}</p>

      {/* Live stock indicator from backend */}
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
