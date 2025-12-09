import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/Navbar";
import "../styles/account.css";

const SHIPPING_KEY_PREFIX = "shippingInfo_";

// Utility Functions for Local Storage

/**
 * Retrieves the stored shipping information for a given user email.
 * UPDATED: Includes state, zip, and phone.
 */
const getShippingInfo = (email) => {
  const key = SHIPPING_KEY_PREFIX + email;
  const stored = localStorage.getItem(key);
  // NEW: Added phone to default structure
  return stored
    ? JSON.parse(stored)
    : { address: "", city: "", state: "", zip: "", phone: "" };
};

/**
 * Saves the shipping information for a given user email to local storage.
 */
const saveShippingInfo = (email, data) => {
  const key = SHIPPING_KEY_PREFIX + email;
  localStorage.setItem(key, JSON.stringify(data));
};

// Account Component
export default function Account() {
  const { currentUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state added

  // UPDATED: formData includes phone field
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "", // NEW: Phone field added
  });

  const addressInputRef = useRef(null);

  // Load shipping info & handle input focus
  useEffect(() => {
    // Start loading simulation
    setLoading(true);

    if (currentUser) {
      const info = getShippingInfo(currentUser.email);
      // Ensure local state includes all five fields
      setFormData({
        address: info.address || "",
        city: info.city || "",
        state: info.state || "",
        zip: info.zip || "",
        phone: info.phone || "",
      });
    }

    // Delay setting loading to false slightly to show the skeleton
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    if (isEditing && addressInputRef.current) {
      addressInputRef.current.focus();
    }

    return () => clearTimeout(timer);
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
    const { address, city, state, zip, phone } = formData;

    // UPDATED VALIDATION
    if (!address.trim() || !city.trim() || !state.trim()) {
      alert("Address, City, and State/Province are required.");
      return;
    }

    if (currentUser.email) {
      // Save all five fields
      saveShippingInfo(currentUser.email, {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
      });
      // Update local state
      setFormData({
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    const info = getShippingInfo(currentUser.email);
    setFormData(info);
    setIsEditing(false);
  };

  // Skeleton component for the Personal Info Card
  const AccountCardSkeleton = () => (
    <section className="account-card skeleton-card">
      <h2>
        <div
          className="skeleton-text"
          style={{ width: "60%", height: "1.5rem" }}
        ></div>
      </h2>
      <div className="info-block">
        <p>
          <div
            className="skeleton-text"
            style={{ width: "75%", height: "1rem" }}
          ></div>
        </p>
        <p>
          <div
            className="skeleton-text"
            style={{ width: "65%", height: "1rem", marginBottom: "30px" }}
          ></div>
        </p>
      </div>
      <div className="account-actions">
        <div
          className="skeleton-text"
          style={{
            width: "180px",
            height: "40px",
            borderRadius: "var(--radius)",
          }}
        ></div>
        <div
          className="skeleton-text"
          style={{
            width: "100px",
            height: "40px",
            borderRadius: "var(--radius)",
          }}
        ></div>
      </div>
    </section>
  );

  // Skeleton component for the Shipping Card
  const ShippingCardSkeleton = () => (
    <section className="shipping-card skeleton-card">
      <h2>
        <div
          className="skeleton-text"
          style={{ width: "60%", height: "1.5rem" }}
        ></div>
      </h2>
      <div className="shipping-static">
        <p>
          <div
            className="skeleton-text"
            style={{ width: "70%", height: "1rem" }}
          ></div>
        </p>
        <p>
          <div
            className="skeleton-text"
            style={{ width: "50%", height: "1rem" }}
          ></div>
        </p>
        <p>
          <div
            className="skeleton-text"
            style={{ width: "65%", height: "1rem" }}
          ></div>
        </p>
        <p>
          <div
            className="skeleton-text"
            style={{ width: "45%", height: "1rem" }}
          ></div>
        </p>
        <p>
          <div
            className="skeleton-text"
            style={{ width: "55%", height: "1rem", marginBottom: "30px" }}
          ></div>
        </p>
      </div>
      <div className="account-actions">
        <div
          className="skeleton-text"
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "var(--radius)",
          }}
        ></div>
      </div>
    </section>
  );

  // Loading State UI
  if (loading) {
    return (
      <main className="account-page">
        <div
          className="skeleton-text"
          style={{
            width: "250px",
            height: "2.5rem",
            margin: "0 auto 10px auto",
          }}
        ></div>
        <div
          className="account-underline skeleton-text"
          style={{ width: "180px", height: "5px", margin: "0 auto 30px auto" }}
        ></div>
        <div
          className="skeleton-text"
          style={{ width: "400px", height: "1rem", margin: "0 auto 50px auto" }}
        ></div>

        <div className="account-container">
          <AccountCardSkeleton />
          <ShippingCardSkeleton />
        </div>
      </main>
    );
  }

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
            <Link to="/purchase-history" className="btn-main">
              View Purchase History
            </Link>
            <button onClick={logout} className="logout-btn">
              {" "}
              Log Out
            </button>
          </div>
        </section>

        {/* Shipping Information Card */}
        <section className="shipping-card">
          <h2>Shipping Information</h2>
          {isEditing ? (
            <div className="shipping-edit-form">
              {/* NEW FIELD: Phone */}
              <label>
                Mobile Number
                <input
                  name="phone"
                  type="tel" // Use tel for phone numbers
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                />
              </label>

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
              <label>
                State/Province
                <input
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State/Province"
                />
              </label>
              <label>
                ZIP Code
                <input
                  name="zip"
                  type="text"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="ZIP Code"
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
                <strong>Mobile:</strong>{" "}
                {formData.phone || <span className="not-set">Not set</span>}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {formData.address || <span className="not-set">Not set</span>}
              </p>
              <p>
                <strong>City:</strong>{" "}
                {formData.city || <span className="not-set">Not set</span>}
              </p>
              <p>
                <strong>State/Province:</strong>{" "}
                {formData.state || <span className="not-set">Not set</span>}
              </p>
              <p>
                <strong>ZIP Code:</strong>{" "}
                {formData.zip || <span className="not-set">Not set</span>}
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
