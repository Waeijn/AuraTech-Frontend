// Sprint 3: Member 2 - Profile placeholder page

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import "../styles/account.css";

const SHIPPING_KEY_PREFIX = 'shippingInfo_';

// Helper to get shipping info from localStorage
const getShippingInfo = (email) => {
    const key = SHIPPING_KEY_PREFIX + email;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : { address: "", city: "" };
};

// Helper to save shipping info to localStorage
const saveShippingInfo = (email, data) => {
    const key = SHIPPING_KEY_PREFIX + email;
    localStorage.setItem(key, JSON.stringify(data));
};

export default function Account() {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ address: "", city: "" });

  useEffect(() => {
    if (currentUser) {
      const info = getShippingInfo(currentUser.email);
      setFormData(info);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <main className="account-page">
        <h1>My Account</h1>
        <p>Please log in to view your account details.</p>
      </main>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (currentUser.email) {
      saveShippingInfo(currentUser.email, formData);
    }
    setIsEditing(false);
  };

  return (
    <main className="account-page">
      <h1>My Account</h1>
      <p>Welcome, you can view and manage your account information here.</p>

      <section className="account-details">
        <h2>Personal Information</h2>
        <p>Name: <strong>{currentUser.name}</strong></p>
        <p>Email: <strong>{currentUser.email}</strong></p>
        
        <Link to="/purchase-history" className="btn-main account-history-btn">
          View Purchase History
        </Link>
      </section>

      <section className="account-details shipping-details">
        <h2>Shipping Information</h2>
        {isEditing ? (
          <div className="shipping-edit-form">
            <label>
              Address
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                placeholder="Shipping Address"
              />
            </label>
            <label>
              City
              <input
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="form-input"
                placeholder="City"
              />
            </label>
            <div className="form-actions">
              <button className="btn-main" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Address: <strong>{formData.address || "Not set"}</strong></p>
            <p>City: <strong>{formData.city || "Not set"}</strong></p>
            <button className="btn-secondary" onClick={() => setIsEditing(true)}>
              Edit Shipping Info
            </button>
          </div>
        )}
      </section>
    </main>
  );
}