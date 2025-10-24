// Sprint 2: Member 3
// Task: Display Product Details Page

import React from "react";
import "../styles/product.css";

const ProductDetails = ({ product, onBack }) => {
  if (!product) return null;

  return (
    <div className="details-container">
      <div className="details-card">
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="details-info">
          <h2>{product.name}</h2>
          <p className="details-price">₱{product.price.toLocaleString()}</p>
          <p className="details-desc">{product.description}</p>

          <div className="details-buttons">
            <button className="btn-main" onClick={onBack}>
              Back to Products
            </button>
            <button className="btn-secondary">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
