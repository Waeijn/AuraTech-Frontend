// src/pages/admin/ProductManagement.js

import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import productsData from "../../data/products.json";

const INVENTORY_KEY = "temporary_inventory";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Modal states
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: "",
    featured: false,
  });

  // Load products and inventory
  useEffect(() => {
    setProducts(productsData);
    const storedInventory =
      JSON.parse(localStorage.getItem(INVENTORY_KEY)) || {};

    const initialInventory = { ...storedInventory };
    productsData.forEach((product) => {
      if (!(product.id in initialInventory)) {
        initialInventory[product.id] = product.stock || 0;
      }
    });

    setInventory(initialInventory);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(initialInventory));
  }, []);

  // Get unique categories
  const categories = ["all", ...new Set(productsData.map((p) => p.category))];

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "stock-low":
          return (inventory[a.id] || 0) - (inventory[b.id] || 0);
        case "stock-high":
          return (inventory[b.id] || 0) - (inventory[a.id] || 0);
        default:
          return 0;
      }
    });

  // Update stock
  const handleStockUpdate = (productId, newStock) => {
    const stockValue = parseInt(newStock) || 0;
    const updatedInventory = {
      ...inventory,
      [productId]: stockValue,
    };
    setInventory(updatedInventory);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(updatedInventory));
  };

  // Get stock status
  const getStockStatus = (productId) => {
    const stock = inventory[productId] || 0;
    if (stock === 0) return { text: "Out of Stock", color: "#ef4444" };
    if (stock <= 5) return { text: "Low Stock", color: "#f59e0b" };
    if (stock <= 10) return { text: "Medium Stock", color: "#3b82f6" };
    return { text: "In Stock", color: "#10b981" };
  };

  // Open add product modal
  const openAddModal = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: categories[1] || "",
      image: "",
      featured: false,
    });
    setIsAddModalOpen(true);
  };

  // Open edit product modal
  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: inventory[product.id] || product.stock,
      category: product.category,
      image: product.image,
      featured: product.featured || false,
    });
    setEditingProduct(product);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add new product
  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    const newProduct = {
      id: Math.max(...products.map((p) => p.id), 0) + 1,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      image: formData.image || "/img/products/default.png",
      featured: formData.featured,
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);

    // Update inventory
    const updatedInventory = {
      ...inventory,
      [newProduct.id]: newProduct.stock,
    };
    setInventory(updatedInventory);
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(updatedInventory));

    alert("Product added successfully!");
    setIsAddModalOpen(false);

    // TODO: Replace with API call
    // await productsAPI.create(newProduct);
  };

  // Update existing product
  const handleUpdateProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedProducts = products.map((p) =>
      p.id === editingProduct.id
        ? {
            ...p,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            image: formData.image,
            featured: formData.featured,
          }
        : p
    );
    setProducts(updatedProducts);

    // Update inventory
    handleStockUpdate(editingProduct.id, formData.stock);

    alert("Product updated successfully!");
    setEditingProduct(null);

    // TODO: Replace with API call
    // await productsAPI.update(editingProduct.id, formData);
  };

  // Delete product
  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      const updatedProducts = products.filter((p) => p.id !== product.id);
      setProducts(updatedProducts);

      // Remove from inventory
      const updatedInventory = { ...inventory };
      delete updatedInventory[product.id];
      setInventory(updatedInventory);
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(updatedInventory));

      alert("Product deleted successfully!");

      // TODO: Replace with API call
      // await productsAPI.delete(product.id);
    }
  };

  // Calculate stats
  const stats = {
    total: products.length,
    inStock: products.filter((p) => (inventory[p.id] || 0) > 10).length,
    lowStock: products.filter((p) => {
      const stock = inventory[p.id] || 0;
      return stock > 0 && stock <= 10;
    }).length,
    outOfStock: products.filter((p) => (inventory[p.id] || 0) === 0).length,
    totalValue: products.reduce(
      (sum, p) => sum + p.price * (inventory[p.id] || 0),
      0
    ),
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Product Management</h1>
          <p>Manage inventory, pricing, and product details</p>
        </div>
        <button className="btn-add-product" onClick={openAddModal}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Controls */}
      <div className="admin-controls">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="admin-select"
          >
            <option value="name">Name (A-Z)</option>
            <option value="price-low">Price (Low to High)</option>
            <option value="price-high">Price (High to Low)</option>
            <option value="stock-low">Stock (Low to High)</option>
            <option value="stock-high">Stock (High to Low)</option>
          </select>
        </div>

        <div className="search-group">
          <label>&nbsp;</label>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const currentStock = inventory[product.id] ?? product.stock;
              const status = getStockStatus(product.id);
              const itemValue = product.price * currentStock;

              return (
                <tr key={product.id}>
                  <td>#{product.id}</td>
                  <td>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-thumbnail"
                    />
                  </td>
                  <td className="product-name-cell">{product.name}</td>
                  <td>
                    <span className="category-tag">{product.category}</span>
                  </td>
                  <td className="price-cell">
                    ₱{product.price.toLocaleString()}
                  </td>
                  <td>
                    <div className="stock-control-wrapper">
                      <button
                        onClick={() =>
                          handleStockUpdate(product.id, currentStock - 1)
                        }
                        className="stock-btn stock-btn-minus"
                        disabled={currentStock <= 0}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={currentStock}
                        onChange={(e) =>
                          handleStockUpdate(product.id, e.target.value)
                        }
                        className="stock-input"
                        min="0"
                      />
                      <button
                        onClick={() =>
                          handleStockUpdate(product.id, currentStock + 1)
                        }
                        className="stock-btn stock-btn-plus"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text}
                    </span>
                  </td>
                  <td className="price-cell">₱{itemValue.toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-view"
                        title="View Details"
                        onClick={() => setViewingProduct(product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="btn-action btn-edit"
                        title="Edit Product"
                        onClick={() => openEditModal(product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="btn-delete"
                        title="Delete Product"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="admin-grid" style={{ marginTop: "30px" }}>
        <div className="admin-card">
          <h3>Total Products</h3>
          <p>{stats.total}</p>
        </div>
        <div className="admin-card">
          <h3>In Stock</h3>
          <p style={{ color: "#10b981" }}>{stats.inStock}</p>
        </div>
        <div className="admin-card">
          <h3>Low Stock</h3>
          <p style={{ color: "#f59e0b" }}>{stats.lowStock}</p>
        </div>
        <div className="admin-card">
          <h3>Out of Stock</h3>
          <p style={{ color: "#ef4444" }}>{stats.outOfStock}</p>
        </div>
        <div className="admin-card">
          <h3>Total Inventory Value</h3>
          <p style={{ color: "#7b1fa2" }}>
            ₱{stats.totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* View Product Details Modal */}
      {viewingProduct && (
        <div
          className="modal-overlay open"
          onClick={() => setViewingProduct(null)}
        >
          <div
            className="admin-modal product-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{viewingProduct.name}</h2>
            <div className="modal-product-info">
              <img src={viewingProduct.image} alt={viewingProduct.name} />
              <div className="product-info-text">
                <p>
                  <strong>ID:</strong> #{viewingProduct.id}
                </p>
                <p>
                  <strong>Category:</strong> {viewingProduct.category}
                </p>
                <p>
                  <strong>Price:</strong> ₱
                  {viewingProduct.price.toLocaleString()}
                </p>
                <p>
                  <strong>Stock:</strong> {inventory[viewingProduct.id] || 0}{" "}
                  units
                </p>
                <p>
                  <strong>Description:</strong> {viewingProduct.description}
                </p>
                {viewingProduct.specifications && (
                  <div style={{ marginTop: "15px" }}>
                    <strong>Specifications:</strong>
                    <ul style={{ marginTop: "8px", fontSize: "0.9rem" }}>
                      {Object.entries(viewingProduct.specifications).map(
                        ([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <button
              className="btn-main"
              onClick={() => setViewingProduct(null)}
              style={{ marginTop: "20px", width: "100%" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div
          className="modal-overlay open"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
        >
          <div
            className="admin-modal product-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{isAddModalOpen ? "Add New Product" : "Edit Product"}</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select category</option>
                  {categories
                    .filter((c) => c !== "all")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price (₱) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="form-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <div className="form-group form-group-full">
                <label>Image URL</label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="/img/products/product.png"
                  className="form-input"
                />
              </div>

              <div className="form-group form-group-full">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  className="form-textarea"
                  rows="4"
                />
              </div>

              <div className="form-group form-group-full">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                  />
                  Featured Product
                </label>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "25px" }}>
              <button
                className="btn-main"
                onClick={
                  isAddModalOpen ? handleAddProduct : handleUpdateProduct
                }
              >
                {isAddModalOpen ? "Add Product" : "Update Product"}
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
