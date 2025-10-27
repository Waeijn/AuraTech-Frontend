import "../styles/footer.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./Navbar"; // Assuming 'Navbar' exports the Auth context hook
import React, { useState } from "react";

/**
 * Footer Component
 * Renders the main application footer with navigation links and handles
 * authentication prompts for protected routes like the Cart.
 */
export default function Footer() {
  // --- State and Context Hooks ---
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // --- Handlers for Authentication Prompt Modal ---

  /** Closes the authentication prompt modal. */
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  /**
   * Redirects the user to the login page after closing the prompt.
   */
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  /**
   * Intercepts the click on the Cart link.
   * If no user is logged in, prevents navigation and opens the auth prompt.
   * @param {object} e - The click event.
   */
  const handleCartClick = (e) => {
    if (!currentUser) {
      e.preventDefault();
      setIsAuthPromptOpen(true);
    }
  };

  return (
    <>
      {/* Authentication Required Modal: 
        Displays when an unauthenticated user attempts to access the cart.
      */}
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

      {/* Main Footer Structure */}
      <footer className="footer">
        <div className="footer__inner">
          {/* Brand and Tagline Section */}
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/img/logo/LOGO.png" alt="AuraTech Logo" />
              <h3>AuraTech</h3>
            </div>
            <p>Gaming Gear — Built for Performance</p>
          </div>

          {/* Navigation Links Section */}
          <div className="footer__links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            {/* Cart link uses the handler to enforce login */}
            <Link to="/cart" onClick={handleCartClick}>
              Cart
            </Link>
          </div>

          {/* Copyright Section */}
          <div className="footer__copy">
            <p>© {new Date().getFullYear()} AuraTech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
