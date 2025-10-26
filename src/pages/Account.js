// Sprint 3: Member 2 - Redesigned AuraTech Account Page (Polished Layout)

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import "../styles/account.css";

const SHIPPING_KEY_PREFIX = "shippingInfo_";

const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { address: "", city: "" };
};

const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ address: "", city: "" });

  // Ref for UX: Automatically focus the address field when editing starts
  const addressInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const info = getShippingInfo(currentUser.email);
      setFormData(info);
    }

    // Set focus when editing starts
    if (isEditing && addressInputRef.current) {
      addressInputRef.current.focus();
    }
  }, [currentUser, isEditing]);

  if (!currentUser) {
    return (
      <main className="account-page">
        <h1>My Account</h1>
        <p>Please log in to view your account details.</p>
        <Link to="/login" className="btn-main">
          Log In
        </Link>
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
    const address = formData.address.trim();
    const city = formData.city.trim();

    // Client-side Validation: Ensure fields are not empty
    if (!address || !city) {
      alert("Please enter both the address and city before saving.");
      return;
    }

    if (currentUser.email) {
      // Save the trimmed data
      saveShippingInfo(currentUser.email, { address, city });
      // Update local state with trimmed data to reflect what was saved
      setFormData({ address, city });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to the stored information
    const info = getShippingInfo(currentUser.email);
    setFormData(info);
    setIsEditing(false);
  };

  return (
    <main className="account-page">
      <h1>My Account</h1>
      <div className="account-underline"></div>
      <p className="account-subtext">
        Manage your profile, shipping details, and purchase history.
      </p>

      <div className="account-container">
        <section className="account-card">
          <h2>Personal Information</h2>
          <div className="info-block">
            <p>
              <strong>Name:</strong> {currentUser.name}
            </p>
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
          </div>
          <div className="account-actions">
            <Link to="/purchase-history" className="btn-main view-history-btn">
              View Purchase History
            </Link>
            <button onClick={logout} className="btn-main logout-btn">
              Log Out
            </button>
          </div>
        </section>

        <section className="shipping-card">
          <h2>Shipping Information</h2>
          {isEditing ? (
            <div className="shipping-edit-form">
              <label>
                Address
                <input
                  ref={addressInputRef}
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
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
                  placeholder="City"
                />
              </label>

              <div className="form-actions">
                <button className="btn-main" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="shipping-static">
              <p>
                <strong>Address:</strong>{" "}
                {formData.address || <span className="not-set">Not set</span>}
              </p>
              <p>
                <strong>City:</strong>{" "}
                {formData.city || <span className="not-set">Not set</span>}
              </p>
              <button
                className="btn-main edit-shipping-btn" // Changed to btn-main for visual consistency with screenshot
                onClick={() => setIsEditing(true)}
              >
                Edit Shipping Info
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
