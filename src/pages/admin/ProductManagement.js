import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";

const API_BASE_URL = "http://localhost:8082/api";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", stock: "", category_id: ""
  });

  // Fetch Products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?per_page=100`);
      const data = await response.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Delete Product
  const handleDelete = async (id) => {
    if(!window.confirm("Delete this product?")) return;
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      await fetch(`${API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // Add Product (Simplified)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert("Product added!");
        setIsModalOpen(false);
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay open">
          <div className="admin-modal">
            <h2>Add Product</h2>
            <form onSubmit={handleSubmit}>
              <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="form-input" />
              <input placeholder="Price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="form-input" />
              <input placeholder="Stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required className="form-input" />
              <input placeholder="Category ID (e.g. 1)" type="number" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} required className="form-input" />
              
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