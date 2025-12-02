import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { productService } from "../../services/productService"; // Import Service

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", stock: "", category_id: ""
  });

  // Fetch Products (Refactored to use Service)
  const fetchProducts = async () => {
    try {
      // Use Service: Pass params for pagination/all items
      const result = await productService.getAll({ per_page: 100 });
      if (result.success) setProducts(result.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Delete Product (Refactored to use Service)
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this product?")) return;
    try {
      // Use Service: Token handled automatically
      await productService.delete(id);
      fetchProducts();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Add Product (Refactored to use Service)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use Service
      const response = await productService.create(formData);
      
      if (response.success) {
        alert("Product added!");
        setIsModalOpen(false);
        // Optional: Clear form here if you want
        // setFormData({ name: "", description: "", price: "", stock: "", category_id: "" });
        fetchProducts();
      } else {
        alert("Failed to add product");
      }
    } catch (err) {
      alert("Error adding product");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <h1>Product Management</h1>
        <button className="btn-add-product" onClick={() => setIsModalOpen(true)}>Add Product</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>{p.name}</td>
                <td>₱{Number(p.price).toLocaleString()}</td>
                <td>{p.stock}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal (Design Preserved) */}
      {isModalOpen && (
        <div className="modal-overlay open">
          <div className="admin-modal">
            <h2>Add Product</h2>
            <form onSubmit={handleSubmit}>
              <input 
                placeholder="Name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                className="form-input" 
              />
              <input 
                placeholder="Price" 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                required 
                className="form-input" 
              />
              <input 
                placeholder="Stock" 
                type="number" 
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: e.target.value})} 
                required 
                className="form-input" 
              />
              <input 
                placeholder="Category ID (e.g. 1)" 
                type="number" 
                value={formData.category_id} 
                onChange={e => setFormData({...formData, category_id: e.target.value})} 
                required 
                className="form-input" 
              />
              
              <div className="modal-actions">
                <button type="submit" className="btn-main">Save</button>
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}