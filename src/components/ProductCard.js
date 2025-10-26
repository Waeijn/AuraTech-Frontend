import { useNavigate } from "react-router-dom";
import productsData from "../data/products.json";
import "../styles/product.css";

const INVENTORY_KEY = "temporary_inventory";

/**
 * Utility function to manage and retrieve product inventory from local storage.
 * Initializes inventory for all products if it doesn't exist,
 * and updates stock for any new or previously sold-out items.
 * @returns {object} The current inventory object {productId: stockCount}.
 */
const getInventory = () => {
  let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  const initialStock = {};

  // Initialize the expected stock based on product data
  productsData.forEach((p) => {
    // Default to a high number if stock is not defined in product data
    initialStock[p.id] = Number(p.stock) || 99999;
  });

  // If no inventory exists in local storage, initialize it and return
  if (!inventory) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialStock));
    return initialStock;
  }

  // Check and update inventory to ensure new products or reset stock are accounted for
  let updated = false;
  productsData.forEach((p) => {
    // Add new products to inventory
    if (!(p.id in inventory)) {
      inventory[p.id] = Number(p.stock) || 99999;
      updated = true;
      // Reset stock if the item was sold out but product data shows new stock
    } else if (inventory[p.id] <= 0 && p.stock > 0) {
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
 * ProductCard Component
 * Displays a single product's image, name, price, and stock status.
 * Handles navigation to product details and triggers the global quantity modal for adding to cart.
 * @param {object} product - The product object to display.
 */
export default function ProductCard({ product }) {
  const navigate = useNavigate();

  /**
   * Stops event propagation and attempts to open the global quantity modal.
   * If the modal function is not available on the window object, it logs an error.
   * @param {object} e - The click event.
   */
  const handleAddToCart = (e) => {
    e.stopPropagation();

    // Ensure inventory is initialized before triggering the modal
    getInventory();

    if (window.showQuantityModal) {
      window.showQuantityModal(product);
    } else {
      console.error(
        "Quantity modal not initialized. Ensure the parent component is rendered."
      );
      alert(`Modal not available. Add 1 x ${product.name} to cart.`);
    }
  };

  /** Navigates the user to the individual product detail page. */
  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  // Get the current stock count for the product
  const inventory = getInventory();
  const currentStock = inventory[product.id] || 0;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} />
      </div>

      <h3>{product.name}</h3>
      <p className="product-price">₱{product.price.toLocaleString()}</p>

      {/* Display stock status, applying a class for styling (in-stock or out-of-stock) */}
      <p
        className={`product-stock ${
          currentStock > 0 ? "in-stock" : "out-of-stock"
        }`}
      >
        {currentStock > 0 ? `In Stock: ${currentStock}` : "Out of Stock"}
      </p>

      {/* Action Buttons */}
      <div className="card-buttons">
        <button className="btn-main" onClick={handleViewDetails}>
          View Details
        </button>
        <button
          className="btn-secondary"
          onClick={handleAddToCart}
          // Disable button if stock is zero
          disabled={currentStock === 0}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
