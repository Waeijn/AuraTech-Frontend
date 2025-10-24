// Sprint 2: Member 3
// Task: Render a product listing using data from /src/data/products.json

import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import productsData from "../data/products.json";
import "../styles/product.css";

const ProductList = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search")?.toLowerCase() || "";

  const categories = [
    "All",
    "Gaming Laptops",
    "Keyboards",
    "Audio",
    "Monitors",
    "Cameras",
    "Accessories",
    "PC Components",
  ];

  const filteredProducts = productsData.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSearch;
  });

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
  };

  const handleBackToList = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="product-container">
      {selectedProduct ? (
        <ProductDetails product={selectedProduct} onBack={handleBackToList} />
      ) : (
        <>
          <div className="product-header">
            <h1 className="product-title">Our Products</h1>
            <p className="product-subtitle">
              Explore AuraTech’s next-gen gaming gear — engineered for power,
              precision, and performance.
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
                className={`category-btn ${
                  selectedCategory === cat ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {filteredProducts && filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img src={product.image} alt={product.name} />
                  </div>

                  <h3>{product.name}</h3>
                  <p className="product-price">
                    ₱{product.price.toLocaleString()}
                  </p>

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
                    <button
                      className="btn-main"
                      onClick={() => handleViewDetails(product)}
                    >
                      View Details
                    </button>
                    <button className="btn-secondary">Add to Cart</button>
                  </div>
                </div>
              ))
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