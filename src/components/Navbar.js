import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

// API & Auth Utilities
import { authService } from "../services/authService";
import { productService } from "../services/productService";
import { getUser, logout as performLogout } from "../utils/auth";

const AuthContext = createContext();

// Global authentication manager using API + local storage.

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from local storage at startup
  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true, message: "Registration successful!" };
    } catch (error) {
      return { success: false, message: error.message || "Registration failed" };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const user = response.data.user;
      setCurrentUser(user);
      return { success: true, message: "Login successful!" };
    } catch (error) {
      return { success: false, message: error.message || "Invalid credentials" };
    }
  };

  // Clears both API session and local storage
  const logout = () => {
    authService.logout(); // API call
    performLogout();      // Clear local storage
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register,
        login,
        logout,
        isAdmin: currentUser?.role === "admin" || currentUser?.is_admin === 1,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Handles navigation, search, authentication prompts,
 * dropdowns, mobile menu, and live search suggestions.
 */
export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [products, setProducts] = useState([]); // Search index
  const [results, setResults] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchWrapperRef = useRef(null);
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  // Mobile menu toggle
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
    setShowDropdown(false);
  };

  // Requires login to access cart
  const handleCartClick = (e) => {
    if (isMenuOpen) setIsMenuOpen(false);
    if (!currentUser) {
      e.preventDefault();
      setIsAuthPromptOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Navigate to search results page
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      setIsMenuOpen(false);
    }
  };

  const handleSelectProduct = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm("");
    setResults([]);
    setIsMenuOpen(false);
  };

  // Close menus on link click
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setShowDropdown(false);
  };

  // Load products for live search
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await productService.getAll();
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        const normalized = data.map(p => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || p.image || "/img/products/placeholder.png"
        }));

        setProducts(normalized);
      } catch (error) {
        console.error("Search index error:", error);
      }
    };

    fetchSearchData();
  }, []);

  // Search input debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Live search result filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
    setResults(filtered.slice(0, 10));
  }, [searchTerm, products]);

  // Sync search with URL when on /products
  useEffect(() => {
    if (location.pathname === "/products") {
      if (debouncedSearchTerm.trim() !== "") {
        navigate(`/products?search=${encodeURIComponent(debouncedSearchTerm)}`, { replace: true });
      }
    }
  }, [location.pathname, debouncedSearchTerm, navigate]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  // Close dropdowns & search when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setResults([]);
      }
      if (!e.target.closest(".user-dropdown")) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide navbar on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <>
      {/* Authentication Prompt */}
      {isAuthPromptOpen && (
        <div className={`modal-overlay open`}>
          <div className="quantity-modal confirmation-modal">
            <h2>Login Required</h2>
            <p>You must be logged in to view your cart.</p>
            <div className="modal-actions">
              <button className="btn-main" onClick={handleLoginRedirect}>Login</button>
              <button className="btn-cancel" onClick={handleCloseAuthPrompt}>Stay on Page</button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar__container">
          {/* Brand */}
          <div className="navbar__brand">
            <img src="/img/logo/LOGO.png" alt="Logo" className="navbar__logo-img" />
            <Link to="/" className="navbar__brand-text" onClick={handleLinkClick}>AuraTech</Link>
          </div>

          <div className="navbar__search-wrapper" ref={searchWrapperRef} position="relative">
            <form className="navbar__search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">Search</button>
            </form>

            {results.length > 0 && (
              <ul className="search-results-dropdown" onMouseDown={(e) => e.preventDefault()}>
                {results.map((product) => (
                  <li key={product.id} className="search-item" onClick={() => handleSelectProduct(product)}>
                    <img src={product.image} alt={product.name} className="search-thumb" />
                    <span className="search-name">{product.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav className={`navbar__links ${isMenuOpen ? "is-open" : ""}`}>
            <Link to="/" className="nav-link" onClick={handleLinkClick}>Home</Link>
            <Link to="/products" className="nav-link" onClick={handleLinkClick}>Products</Link>
            <Link to="/cart" className="nav-link" onClick={handleCartClick}>Cart</Link>

            {!currentUser ? (
              <>
                <Link to="/login" className="nav-link" onClick={handleLinkClick}>Login</Link>
                <Link to="/register" className="nav-link" onClick={handleLinkClick}>Register</Link>
              </>
            ) : (
              <div className="user-dropdown">
                <button className="user-dropdown-toggle" onClick={() => setShowDropdown((prev) => !prev)}>
                  Hello, {currentUser.name} <span style={{ fontSize: "0.8rem" }}>▼</span>
                </button>

                {showDropdown && (
                  <ul className="user-dropdown-menu">
                    <li><Link to="/account" onClick={handleLinkClick}>My Account</Link></li>
                    <li><Link to="/purchase-history" onClick={handleLinkClick}>My Purchase</Link></li>
                    <li><button className="logout-btn" onClick={() => { handleLogout(); handleLinkClick(); }}>Logout</button></li>
                  </ul>
                )}
              </div>
            )}

            {/* Mobile Search */}
            {isMenuOpen && (
              <div className="navbar__search-wrapper mobile-search-wrapper" position="relative">
                <form className="navbar__search" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="search-btn">Search</button>
                </form>
              </div>
            )}
          </nav>

          <button className="navbar__mobile-toggle" onClick={handleMenuToggle}>
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>
    </>
  );
}
