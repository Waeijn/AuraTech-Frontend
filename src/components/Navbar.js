import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const AuthContext = createContext();
const API_BASE_URL = "http://localhost:8082/api";

/**
 * AuthProvider Component
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success) {
            setCurrentUser(data.data.user);
          } else {
            localStorage.removeItem("ACCESS_TOKEN");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // --- FIX: Added missing register function ---
  const register = async (userData) => {
    // This is a placeholder since the actual API call is in Register.js
    console.log("Register triggered via context", userData);
    return { success: true };
  };
  // -------------------------------------------

  const login = (userData) => {
    setCurrentUser(userData);
  };

  const logout = async () => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem("ACCESS_TOKEN");
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register, // This caused the error because it wasn't defined above
        login,
        logout,
        isAdmin: currentUser?.role === "admin",
        loading,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Navbar Component
 */
export default function Navbar() {
  const { currentUser, logout, setCurrentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const searchWrapperRef = useRef(null);

  // --- API Live Search ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/products?search=${searchTerm}`
          );
          const data = await response.json();
          if (data.success) {
            setResults(data.data.slice(0, 5));
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setResults([]);
      setIsMenuOpen(false);
    }
  };

  const handleSelectProduct = (id) => {
    navigate(`/product/${id}`);
    setSearchTerm("");
    setResults([]);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    // 1. Clear Local State IMMEDIATELY
    setCurrentUser(null);

    // 2. Clear token
    logout();

    // 3. Force redirect
    window.location.href = "/";
  };

  if (["/login", "/register"].includes(location.pathname)) return null;

  return (
    <>
      {isAuthPromptOpen && (
        <div className="modal-overlay open">
          <div className="quantity-modal confirmation-modal">
            <h2>Login Required</h2>
            <p>You must be logged in to view your cart.</p>
            <div className="modal-actions">
              <button
                className="btn-main"
                onClick={() => {
                  setIsAuthPromptOpen(false);
                  navigate("/login");
                }}
              >
                Login
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsAuthPromptOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="navbar">
        <div className="navbar__container">
          <div className="navbar__brand">
            <img
              src="/img/logo/LOGO.png"
              alt="Logo"
              className="navbar__logo-img"
            />
            <Link to="/" className="navbar__brand-text">
              AuraTech
            </Link>
          </div>

          <div className="navbar__search-wrapper" ref={searchWrapperRef}>
            <form className="navbar__search" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search products..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">
                Search
              </button>
            </form>

            {results.length > 0 && (
              <ul className="search-results-dropdown">
                {results.map((product) => (
                  <li
                    key={product.id}
                    className="search-item"
                    onClick={() => handleSelectProduct(product.id)}
                  >
                    <img
                      src={product.image || "/img/products/placeholder.png"}
                      alt={product.name}
                      className="search-thumb"
                    />
                    <span className="search-name">{product.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav className={`navbar__links ${isMenuOpen ? "is-open" : ""}`}>
            <Link
              to="/"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/cart"
              className="nav-link"
              onClick={(e) => {
                if (!currentUser) {
                  e.preventDefault();
                  setIsAuthPromptOpen(true);
                }
                setIsMenuOpen(false);
              }}
            >
              Cart
            </Link>

            {!currentUser ? (
              <>
                <Link
                  to="/login"
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="user-dropdown">
                <button
                  className="user-dropdown-toggle"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  Hello, {currentUser.name} ▼
                </button>
                {showDropdown && (
                  <ul className="user-dropdown-menu">
                    <li>
                      <Link
                        to="/purchase-history"
                        onClick={() => setShowDropdown(false)}
                      >
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <button className="logout-btn" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </nav>

          <button
            className="navbar__mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>
    </>
  );
}