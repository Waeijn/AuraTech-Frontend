import "../styles/footer.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./Navbar";
import React, { useState } from "react";

/**
 * Displays footer navigation and verifies authentication for protected routes (e.g., Cart).
 */
export default function Footer() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // Close login prompt modal
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  // Redirect user to login after closing modal
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  // Prevent cart access when user is not logged in
  const handleCartClick = (e) => {
    if (!currentUser) {
      e.preventDefault();
      setIsAuthPromptOpen(true);
    }
  };

  return (
    <>
      {/* Login prompt displayed when an unauthenticated user tries to open the cart */}
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

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/img/logo/LOGO.png" alt="AuraTech Logo" />
              <h3>AuraTech</h3>
            </div>
            <p>Gaming Gear — Built for Performance</p>
          </div>

          {/* Navigation */}
          <div className="footer__links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            {/* Cart requires authentication */}
            <Link to="/cart" onClick={handleCartClick}>
              Cart
            </Link>
          </div>

          {/* Copyright */}
          <div className="footer__copy">
            <p>© {new Date().getFullYear()} AuraTech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
