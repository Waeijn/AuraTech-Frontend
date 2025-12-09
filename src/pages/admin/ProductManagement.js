// src/pages/admin/ProductManagement.js

import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { productService } from "../../services/productService";
import { categoryService } from "../../services/categoryService";

// Skeleton component for a single product row
const ProductRowSkeleton = ({ columns = 9 }) => (
  <tr className="skeleton-row">
    {[...Array(columns)].map((_, index) => (
      <td key={index}>
        <div
          className="skeleton-text"
          style={{
            width: `${Math.random() * (90 - 40) + 40}%`,
            height: "1rem",
            margin: 0,
          }}
        ></div>
      </td>
    ))}
  </tr>
);

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Modal states
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    featured: false,
    specifications: {},
    images: [],
  });

  // Spec/Image inputs
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fetch products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  /** Fetches the entire product list and stops the loading state. */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await productService.getAll({ per_page: 100 });
      if (result.success) setProducts(result.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Fetches the list of all categories. */
  const fetchCategories = async () => {
    try {
      const result = await categoryService.getAll();
      if (result.success) setCategories(result.data);
    } catch (err) {
      console.error("Fetch categories error:", err);
    }
  };

  /** Helper function to retrieve the category name using its ID. */
  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === parseInt(catId));
    return cat ? cat.name : "N/A";
  };

  /** Filters and sorts the product list based on current filters and sorting preferences. */
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || product.category_id == categoryFilter;

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
          return a.stock - b.stock;
        case "stock-high":
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

  /** Returns the appropriate stock status text and color based on stock count. */
  const getStockStatus = (stock) => {
    if (stock === 0) return { text: "Out of Stock", color: "#ef4444" };
    if (stock <= 5) return { text: "Low Stock", color: "#f59e0b" };
    if (stock <= 10) return { text: "Medium Stock", color: "#3b82f6" };
    return { text: "In Stock", color: "#10b981" };
  };

  /** Resets form data and opens the 'Add Product' modal. */
  const openAddModal = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      stock: "",
      category_id: "",
      featured: false,
      specifications: {},
      images: [],
    });
    setIsAddModalOpen(true);
  };

  /** Populates form data with the selected product's details and opens the edit modal. */
  const openEditModal = (product) => {
    let parsedSpecs = {};
    if (typeof product.specifications === "string") {
      try {
        parsedSpecs = JSON.parse(product.specifications);
      } catch (e) {
        console.error("Error parsing specs", e);
        parsedSpecs = {};
      }
    } else {
      parsedSpecs = product.specifications || {};
    }

    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      featured: product.featured || false,
      specifications: parsedSpecs,
      images: product.images || [],
    });
    setEditingProduct(product);
  };

  /** Updates the local formData state based on form input changes. */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /** Adds a new specification key-value pair to the formData state. */
  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey]: specValue,
        },
      }));
      setSpecKey("");
      setSpecValue("");
    }
  };

  /** Removes a specification entry from the formData state by key. */
  const removeSpec = (key) => {
    const newSpecs = { ...formData.specifications };
    delete newSpecs[key];
    setFormData((prev) => ({ ...prev, specifications: newSpecs }));
  };

  /** Adds a new image URL to the formData state. */
  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          {
            url: imageUrl,
            is_primary: prev.images.length === 0,
          },
        ],
      }));
      setImageUrl("");
    }
  };

  /** Removes an image from the formData state by index. */
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  /** Sets a specific image as the primary image by index. */
  const setPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }));
  };

  /** Submits the new product data to the API and refreshes the product list. */
  const handleAddProduct = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const priceValue = parseFloat(formData.price);

      const productData = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description,
        price: priceValue,
        stock: parseInt(formData.stock) || 0,
        category_id: parseInt(formData.category_id),
        featured: formData.featured,
        specifications:
          Object.keys(formData.specifications).length > 0
            ? formData.specifications
            : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      };

      const response = await productService.create(productData);

      if (response.success) {
        alert("Product added successfully!");
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      alert("Error adding product: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Submits the updated product data to the API and refreshes the product list. */
  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const priceValue = parseFloat(formData.price);

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: priceValue,
        stock: parseInt(formData.stock),
        category_id: parseInt(formData.category_id),
        featured: formData.featured,
        specifications: formData.specifications,
        images: formData.images,
      };

      const response = await productService.update(
        editingProduct.id,
        productData
      );

      if (response.success) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (err) {
      alert("Error updating product: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Deletes the selected product after user confirmation and refreshes the product list. */
  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await productService.delete(product.id);
        alert("Product deleted successfully!");
        fetchProducts();
      } catch (err) {
        alert("Error deleting product: " + (err.message || "Unknown error"));
      }
    }
  };

  /** Calculates summary statistics for the product list. */
  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.stock > 10).length,
    lowStock: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
  };

  // Skeleton Loader for Table View
  const ProductTableSkeleton = () => (
    <table className="admin-table skeleton-table">
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
        <ProductRowSkeleton />
        <ProductRowSkeleton />
        <ProductRowSkeleton />
        <ProductRowSkeleton />
        <ProductRowSkeleton />
        <ProductRowSkeleton />
      </tbody>
    </table>
  );

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
            className={`admin-select ${loading ? "skeleton-text" : ""}`}
            disabled={loading}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`admin-select ${loading ? "skeleton-text" : ""}`}
            disabled={loading}
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
            className={`admin-search-input ${loading ? "skeleton-text" : ""}`}
            disabled={loading}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        {loading ? (
          <ProductTableSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
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
                const status = getStockStatus(product.stock);
                const itemValue = product.price * product.stock;
                const primaryImage =
                  product.images?.find((img) => img.is_primary) ||
                  product.images?.[0];

                return (
                  <tr key={product.id}>
                    <td>#{product.id}</td>
                    <td>
                      <img
                        src={primaryImage?.url || "/img/products/default.png"}
                        alt={product.name}
                        className="product-thumbnail"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td className="product-name-cell">{product.name}</td>
                    <td>
                      <span className="category-tag">
                        {getCategoryName(product.category_id)}
                      </span>
                    </td>
                    <td className="price-cell">
                      ₱
                      {product.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="stock-cell">{product.stock}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: status.color }}
                      >
                        {status.text}
                      </span>
                    </td>
                    <td className="price-cell">
                      ₱
                      {itemValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
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
        )}
      </div>

      {/* Summary Stats */}
      <div className="admin-grid" style={{ marginTop: "30px" }}>
        {loading ? (
          <>
            <div className="admin-card skeleton-card">
              <div
                className="skeleton-text"
                style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "40%", height: "2rem" }}
              ></div>
            </div>
            <div className="admin-card skeleton-card">
              <div
                className="skeleton-text"
                style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "40%", height: "2rem" }}
              ></div>
            </div>
            <div className="admin-card skeleton-card">
              <div
                className="skeleton-text"
                style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "40%", height: "2rem" }}
              ></div>
            </div>
            <div className="admin-card skeleton-card">
              <div
                className="skeleton-text"
                style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "40%", height: "2rem" }}
              ></div>
            </div>
            <div className="admin-card skeleton-card">
              <div
                className="skeleton-text"
                style={{ width: "60%", height: "1.2rem", marginBottom: "10px" }}
              ></div>
              <div
                className="skeleton-text"
                style={{ width: "40%", height: "2rem" }}
              ></div>
            </div>
          </>
        ) : (
          <>
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
                ₱
                {stats.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </>
        )}
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
            style={{ maxWidth: "600px" }}
          >
            <h2>{viewingProduct.name}</h2>
            <div className="modal-product-info">
              {viewingProduct.images && viewingProduct.images.length > 0 ? (
                <img
                  src={
                    viewingProduct.images.find((img) => img.is_primary)?.url ||
                    viewingProduct.images[0]?.url
                  }
                  alt={viewingProduct.name}
                  style={{ maxWidth: "100%", marginBottom: "15px" }}
                />
              ) : (
                <p>No image available</p>
              )}
              <div className="product-info-text">
                <p>
                  <strong>ID:</strong> #{viewingProduct.id}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {getCategoryName(viewingProduct.category_id)}
                </p>
                <p>
                  <strong>Price:</strong> ₱
                  {viewingProduct.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p>
                  <strong>Stock:</strong> {viewingProduct.stock} units
                </p>
                <p>
                  <strong>Featured:</strong>{" "}
                  {viewingProduct.featured ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {viewingProduct.description || "No description"}
                </p>

                {/* Handle Spec Display Safely */}
                {(() => {
                  let specs = viewingProduct.specifications;
                  if (typeof specs === "string") {
                    try {
                      specs = JSON.parse(specs);
                    } catch {
                      specs = {};
                    }
                  }
                  if (specs && Object.keys(specs).length > 0) {
                    return (
                      <div style={{ marginTop: "15px" }}>
                        <strong>Specifications:</strong>
                        <ul style={{ marginTop: "8px", fontSize: "0.9rem" }}>
                          {Object.entries(specs).map(([key, value]) => (
                            <li key={key}>
                              <strong>{key}:</strong> {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })()}

                {viewingProduct.images && viewingProduct.images.length > 1 && (
                  <div style={{ marginTop: "15px" }}>
                    <strong>Additional Images:</strong>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {viewingProduct.images.map((img, index) => (
                        <img
                          key={index}
                          src={img.url}
                          alt={`${viewingProduct.name} ${index + 1}`}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            border: img.is_primary ? "2px solid green" : "none",
                          }}
                        />
                      ))}
                    </div>
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
            style={{ maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}
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
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated if empty"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
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
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  className="form-textarea"
                  rows="3"
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

            {/* Specifications Section */}
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>Specifications</h3>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <input
                  type="text"
                  placeholder="Spec Name (e.g., Processor)"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Spec Value (e.g., Intel i9)"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addSpecification}
                  className="btn-add"
                >
                  Add
                </button>
              </div>

              {Object.keys(formData.specifications).length > 0 && (
                <ul
                  style={{ listStyle: "none", padding: 0, marginTop: "10px" }}
                >
                  {Object.entries(formData.specifications).map(
                    ([key, value]) => (
                      <li
                        key={key}
                        style={{
                          padding: "8px",
                          background: "white",
                          marginBottom: "5px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                      >
                        <span>
                          <strong>{key}:</strong> {value}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSpec(key)}
                          className="btn-delete-small"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                        >
                          Remove
                        </button>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {/* Images Section */}
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                background: "#f9f9f9",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>Product Images</h3>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <input
                  type="text"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={addImage} className="btn-add">
                  Add Image
                </button>
              </div>

              {formData.images.length > 0 && (
                <ul
                  style={{ listStyle: "none", padding: 0, marginTop: "10px" }}
                >
                  {formData.images.map((img, index) => (
                    <li
                      key={index}
                      style={{
                        padding: "8px",
                        background: "white",
                        marginBottom: "5px",
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        borderRadius: "4px",
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`Product ${index + 1}`}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                        onError={(e) =>
                          (e.target.src = "/img/products/default.png")
                        }
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: "12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {img.url}
                      </span>
                      {img.is_primary && (
                        <span style={{ color: "green", fontSize: "12px" }}>
                          ⭐ Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="btn-small"
                        disabled={img.is_primary}
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Set Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn-delete-small"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "25px" }}>
              <button
                className="btn-main"
                onClick={
                  isAddModalOpen ? handleAddProduct : handleUpdateProduct
                }
                disabled={isSubmitting}
              >
                {/* IMPLEMENT BUTTON SPINNER */}
                {isSubmitting ? (
                  <div className="button-content-wrapper">
                    <span className="button-spinner"></span>
                    {isAddModalOpen ? "Adding..." : "Updating..."}
                  </div>
                ) : isAddModalOpen ? (
                  "Add Product"
                ) : (
                  "Update Product"
                )}
              </button>
              <button
                className="btn-cancel"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                disabled={isSubmitting}
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
