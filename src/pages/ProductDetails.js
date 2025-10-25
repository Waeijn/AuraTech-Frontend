// Sprint 2: Member 3
// Task: Display Product Details Page
// Sprint 4: Member 4 - Integrated Functional Add to Cart button logic via Quantity Modal.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productsData from "../data/products.json";
import "../styles/product.css";
import { useAuth } from "../components/Navbar";

const INVENTORY_KEY = 'temporary_inventory';

const getInventory = () => {
    let inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
    if (!inventory) {
        const initialStock = {};
        productsData.forEach(p => {
            initialStock[p.id] = p.stock || 99999;
        });
        inventory = initialStock;
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
}

const handleAddToCartLogic = (product, quantity) => {
    const inventory = getInventory();
    const currentStock = inventory[product.id] || 0;
    
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingItem = cart.find((item) => item.id === product.id);

    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    if (currentCartQuantity + quantity > currentStock) {
        alert(`Cannot add ${quantity}: Cart already contains ${currentCartQuantity}. Only ${currentStock} total are available.`);
        return;
    }
    
    if (quantity > currentStock) {
        alert(`Cannot add ${quantity}: Only ${currentStock} are available in stock.`);
        return;
    }
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity, 
            isChecked: true
        });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log(`Added ${quantity} x ${product.name} from Details Page!`);
    alert(`Added ${quantity} x ${product.name} to cart!`);
};


const ProductDetails = ({ product: propProduct, onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const product = propProduct || productsData.find((p) => String(p.id) === String(id));

  const inventory = getInventory();
  const currentStock = product ? inventory[product.id] || 0 : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  useEffect(() => {
    if (product && !propProduct) {
        window.showQuantityModal = (p = product) => {
            setModalProduct(p);
            if (!currentUser) {
                setIsAuthPromptOpen(true); 
            } else {
                setQuantity(1);
                setIsModalOpen(true); 
            }
        };
    }
    return () => {
        delete window.showQuantityModal;
    };
  }, [product, propProduct, currentUser]); 

  const handleCloseModal = () => setIsModalOpen(false);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);
  
  const handleLoginRedirect = () => {
      handleCloseAuthPrompt();
      navigate('/login');
  }
  
  const handleQuantityChange = (delta) => {
    if (!modalProduct) return;
    const maxAllowed = getMaxAllowedToAdd(modalProduct.id);

    setQuantity(prev => {
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

  const handleShowModal = () => {
    setModalProduct(product);
    if (!currentUser) {
        setIsAuthPromptOpen(true);
    } else {
        setQuantity(1);
        setIsModalOpen(true);
    }
  };

  const maxQtyAllowed = modalProduct ? getMaxAllowedToAdd(modalProduct.id) : 0;

  if (!product) {
    return (
      <div className="details-container">
        <div className="details-card">
          <p>Product not found.</p>
          <button className="btn-main" onClick={() => navigate("/products")}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="details-container">
      <div className={`modal-overlay ${isAuthPromptOpen ? 'open' : ''}`}>
        <div className="quantity-modal confirmation-modal">
          <h2>Login Required</h2>
          <p>You must be logged in to add items to your cart. Do you want to login now or stay on this page?</p>
          
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

      <div className={`modal-overlay ${isModalOpen ? 'open' : ''}`}>
        <div className="quantity-modal">
          <h2>Select Quantity</h2>
          <p>{modalProduct?.name}</p>
          
          <div className="quantity-controls">
            <button className="quantity-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
            <input
                type="number"
                min="1"
                max={maxQtyAllowed}
                value={quantity}
                onChange={handleManualQuantityChange}
                className="quantity-input-field"
                disabled={maxQtyAllowed === 0}
            />
            <button className="quantity-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQtyAllowed || maxQtyAllowed === 0}>+</button>
          </div>
          
          <div className="modal-actions">
            <button className="btn-main" onClick={handleFinalAddToCart} disabled={quantity > maxQtyAllowed || maxQtyAllowed === 0}>Add {quantity} to Cart</button>
            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
          </div>
        </div>
      </div>

      <div className="details-card">
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-info">
          <h2>{product.name}</h2>
          <p className="details-price">₱{product.price.toLocaleString()}</p>
          <p className="details-desc">{product.description}</p>
          <p className="product-stock">{currentStock > 0 ? `In Stock: ${currentStock}` : 'Out of Stock'}</p>

          <div className="details-buttons">
            <button className="btn-main" onClick={onBack || (() => navigate("/products"))}>
              Back to Products
            </button>
            <button 
              className="btn-secondary"
              onClick={handleShowModal}
              disabled={currentStock === 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;