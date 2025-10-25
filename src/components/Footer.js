// Sprint 1: Member 2
// Task: Basic Footer structure for site layout.
// NOTE to Member 2: Footer styling controlled by Member 5.

import "../styles/footer.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./Navbar";
import React, { useState } from "react";

export default function Footer() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // Handlers for Auth Prompt Modal
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  const handleCartClick = (e) => {
    if (!currentUser) {
      e.preventDefault();
      setIsAuthPromptOpen(true);
    }
  };

  return (
    <>
      {isAuthPromptOpen && (
        <div className={`modal-overlay open`}>
          <div className="quantity-modal confirmation-modal">
            <h2>Login Required</h2>
            <p>
              You must be logged in to view your cart. Do you want to login now
              or stay on this page?
            </p>

            <div className="modal-actions">
              <button className="btn-main" onClick={handleLoginRedirect}>
                Login
              </button>
              <button className="btn-cancel" onClick={handleCloseAuthPrompt}>
                Stay on Page
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer__inner">
          {/* Left: Brand / Logo / Tagline */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/img/logo/LOGO.png" alt="AuraTech Logo" />
              <h3>AuraTech</h3>
            </div>
            <p>Gaming Gear — Built for Performance</p>
          </div>

          {/* Center: Navigation Links */}
          <div className="footer__links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/cart" onClick={handleCartClick}>
              Cart
            </Link>
          </div>

          {/* Bottom: Copyright */}
          <div className="footer__copy">
            <p>© {new Date().getFullYear()} AuraTech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
