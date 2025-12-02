import { useNavigate } from "react-router-dom";
import "../styles/product.css";

/**
 * ProductCard Component
 * Displays a single product's image, name, price, and stock status.
 * Now receives real API data via props.
 */
export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  // Stock logic comes directly from the API product object now
  const stock = product.stock || 0;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img 
          src={product.image || "/img/products/placeholder.png"} 
          alt={product.name} 
        />
      </div>

      <h3>{product.name}</h3>
      <p className="product-price">₱{Number(product.price).toLocaleString()}</p>

      <p className={`product-stock ${stock > 0 ? "in-stock" : "out-of-stock"}`}>
        {stock > 0 ? `In Stock: ${stock}` : "Out of Stock"}
      </p>

      <div className="card-buttons">
        <button className="btn-main" onClick={handleViewDetails}>
          View Details
        </button>
        <button
          className="btn-secondary"
          onClick={handleAddToCartClick}
          disabled={stock === 0}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}