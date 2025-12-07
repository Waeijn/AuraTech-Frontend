import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

// API Services
import { authService } from "../services/authService";
import { productService } from "../services/productService";
import { getUser, logout as performLogout } from "../utils/auth";

// --- Authentication Context Setup ---
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Manages user state via API integration.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from utils/auth logic on mount
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

// --- Navbar Component ---

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [products, setProducts] = useState([]); // Loaded from API
  const [results, setResults] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchWrapperRef = useRef(null);

  // --- Handlers ---

  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
    setShowDropdown(false);
  };

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

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setShowDropdown(false);
  };

  // --- Effects ---

  // API Integration: Load products for search index
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await productService.getAll();
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        
        // Normalize for search
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

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Live Filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
    setResults(filtered.slice(0, 10));
  }, [searchTerm, products]);

  // URL Sync
  useEffect(() => {
    if (location.pathname === "/products") {
      if (debouncedSearchTerm.trim() !== "") {
        navigate(`/products?search=${encodeURIComponent(debouncedSearchTerm)}`, { replace: true });
      }
    }
  }, [location.pathname, debouncedSearchTerm, navigate]);

  // Scroll Lock
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  // Click Outside
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

  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <>
      {/* Auth Modal */}
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

      {/* Navbar Structure - Preserved Exactly */}
      <header className="navbar">
        <div className="navbar__container">
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