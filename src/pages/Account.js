import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/Navbar"; // Auth context
import "../styles/account.css";

const SHIPPING_KEY_PREFIX = "shippingInfo_";

// Utility Functions for Local Storage

/**
 * Retrieves the stored shipping information for a given user email.
 * @param {string} email - The unique email of the current user.
 * @returns {object} Stored shipping data { address: string, city: string } or default empty object.
 */

const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : { address: "", city: "" };
};

/**
 * Saves the shipping information for a given user email to local storage.
 * @param {string} email - The unique email of the current user.
 * @param {object} data - Shipping data { address: string, city: string }.
 */

const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

// Account Component
export default function Account() {
  const { currentUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ address: "", city: "" });
  const addressInputRef = useRef(null);

  // Load shipping info & handle input focus
  useEffect(() => {
    if (currentUser) {
      const info = getShippingInfo(currentUser.email);
      setFormData(info);
    }
    if (isEditing && addressInputRef.current) {
      addressInputRef.current.focus();
    }
  }, [currentUser, isEditing]);

  // Redirect if not logged in
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

  // Handlers
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
    if (!address || !city) {
      alert("Please enter both the address and city before saving.");
      return;
    }

    if (currentUser.email) {
      // Save the trimmed, validated data
      saveShippingInfo(currentUser.email, { address, city });
      // Update local state to reflect the saved, trimmed data
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
      {/* Header */}
      <h1>My Account</h1>
      <div className="account-underline"></div>
      <p className="account-subtext">
        Manage your profile, shipping details, and purchase history.
      </p>

      <div className="account-container">
        {/* Personal Information Card */}
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
            <Link
              to="/purchase-history"
              className="btn-main account-history-btn"
            >
              View Purchase History
            </Link>
            <button onClick={logout} className="btn-main logout-btn">
              Log Out
            </button>
          </div>
        </section>

        {/* Shipping Information Card */}
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
                className="btn-main edit-shipping-btn"
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
