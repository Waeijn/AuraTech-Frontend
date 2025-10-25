// Sprint 2: Member 3
// Task: Render a product listing using data from /src/data/products.json
// Sprint 4: Member 4 - Implemented functional Add to Cart logic via a Quantity Modal.

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import productsData from "../data/products.json";
import "../styles/product.css";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../components/Navbar";

const INVENTORY_KEY = "temporary_inventory";

const getInventory = () => {
  let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
  const initialStock = {};

  productsData.forEach((p) => {
    initialStock[p.id] = Number(p.stock) || 99999;
  });

  if (!inventory) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialStock));
    return initialStock;
  }

  let updated = false;
  productsData.forEach((p) => {
    if (!(p.id in inventory)) {
      inventory[p.id] = Number(p.stock) || 99999;
      updated = true;
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

const getMaxAllowedToAdd = (productId) => {
  const inventory = getInventory();
  const currentStock = inventory[productId] || 0;
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === productId);
  const currentCartQty = existingItem ? existingItem.quantity : 0;
  return currentStock - currentCartQty;
};

const handleAddToCartLogic = (product, quantity) => {
  const inventory = getInventory();
  const currentStock = inventory[product.id] || 0;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingItem = cart.find((item) => item.id === product.id);

  const currentCartQuantity = existingItem ? existingItem.quantity : 0;
  const requestedQuantity = quantity;

  if (requestedQuantity > currentStock) {
    alert(`Cannot add ${requestedQuantity}: Only ${currentStock} are available in stock.`);
    return;
  }

  if (currentCartQuantity + requestedQuantity > currentStock) {
    alert(`Cannot add ${requestedQuantity}: You already have ${currentCartQuantity} in your cart. Only ${currentStock} total are available.`);
    return;
  }

  if (existingItem) {
    existingItem.quantity += requestedQuantity;
  } else {
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
  console.log(`Added ${requestedQuantity} x ${product.name} to cart!`);
};

const ProductList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

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

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  const handleQuantityChange = (delta) => {
    if (!modalProduct) return;
    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);

    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.min(Math.max(1, newQty), maxAllowed);
    });
  };

  const handleManualQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!modalProduct) return;

    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);
    let newQty = isNaN(value) || value < 1 ? 1 : value;
    newQty = Math.min(newQty, maxAllowed);
    setQuantity(newQty);
  };

  const handleFinalAddToCart = () => {
    if (!modalProduct || quantity < 1) return;
    handleAddToCartLogic(modalProduct, quantity);
    handleCloseModal();
  };

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search")?.toLowerCase() || "";

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

  const filteredProducts = productsData.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  const handleBackToList = () => setSelectedProduct(null);
  const maxQtyAllowed = modalProduct ? getMaxAllowedToAdd(modalProduct.id) : 0;

  return (
    <div className="product-container">
      <div className={`modal-overlay ${isAuthPromptOpen ? "open" : ""}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>
            You must be logged in to add items to your cart. Do you want to login now or stay on this page?
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

      <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{modalProduct?.name}</p>

          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
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

          <div className="modal-actions">
            <button className="btn-main" onClick={handleFinalAddToCart} disabled={quantity > maxQtyAllowed || maxQtyAllowed === 0}>
              Add {quantity} to Cart
            </button>
            <button className="btn-cancel" onClick={handleCloseModal}>
              Cancel
            </button>
          </div>
        </div>
      </div>

      {selectedProduct ? (
        <ProductDetails product={selectedProduct} onBack={handleBackToList} />
      ) : (
        <>
          <div className="product-header">
            <h1 className="product-title">Our Products</h1>
            <p className="product-subtitle">
              Explore AuraTech’s next-gen gaming gear — engineered for power, precision, and performance.
            </p>
            <div className="divider"></div>
            {searchTerm && (
              <p className="search-results-msg">
                Showing results for: <strong>{searchTerm}</strong>
              </p>
            )}
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
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <p>No products found for your search.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductList;
