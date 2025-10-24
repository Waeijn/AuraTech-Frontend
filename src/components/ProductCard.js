// Sprint 2: Member 3
// Task: Display individual product cards for Featured and ProductList components

import { useNavigate } from "react-router-dom";
import "../styles/product.css";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // ✅ Add to Cart (store in localStorage for now)
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
  };

  const handleViewDetails = () => {
    navigate(`/products?search=${encodeURIComponent(product.name.toLowerCase())}`);
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} />
      </div>

      <h3>{product.name}</h3>
      <p className="product-price">₱{product.price.toLocaleString()}</p>

      <p
        className={`product-stock ${
          (product.stock ?? 15) > 0 ? "in-stock" : "out-of-stock"
        }`}
      >
        {(product.stock ?? 15) > 0
          ? `In Stock: ${product.stock ?? 15}`
          : "Out of Stock"}
      </p>

      <div className="card-buttons">
        <button className="btn-main" onClick={handleViewDetails}>
          View Details
        </button>
        <button className="btn-secondary" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
