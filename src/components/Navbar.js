import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService"; // Import Service
import "../styles/navbar.css";

const AuthContext = createContext();

/**
 * AuthProvider Component
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Add useNavigate here for smoother redirects

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Fast Client-Side Check: Do we even have a token?
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return; // Stop here if no token, prevents unnecessary API call
      }

      // 2. Server-Side Verify: Is the token valid?
      try {
        const response = await authService.me();
        if (response.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        // Token is invalid/expired. Clear it.
        console.warn("Session expired or invalid.");
        localStorage.removeItem('token');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const login = (user, token) => {
    setCurrentUser(user);
  };

  // --- FIX: SMOOTH LOGOUT ---
  const logout = async () => {
    // 1. Start loading state IMMEDIATELY to hide UI
    setLoading(true); 
    try {
      // 2. Wait for backend to invalidate token
      await authService.logout(); 
    } catch (err) {
      console.warn("Logout API call failed, but clearing local session anyway.", err);
    } finally {
      // 3. Clear local state and stop loading
      setCurrentUser(null);
      setLoading(false);
      // 4. Navigate away (using replace to prevent back-button return)
      navigate("/login", { replace: true });
    }
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
  const { currentUser, logout } = useAuth(); // Removed setCurrentUser as it's not needed here
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  const searchWrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setResults([]);
      }
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Simple Fetch-based Search (Can be refactored to productService later)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        try {
          const response = await fetch(
            `http://localhost:8082/api/products?search=${searchTerm}`
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
    // The logout function in context now handles loading and navigation
    setShowDropdown(false);
    await logout(); 
  };

  if (["/login", "/register"].includes(location.pathname)) return null;

  return (
    <>
      {isAuthPromptOpen && (
        <div className="modal-overlay open" style={{zIndex: 2000}}>
          <div className="quantity-modal confirmation-modal">
            <h2>Login Required</h2>
            <p>You must be logged in to access this page.</p>
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
            <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/products" className="nav-link" onClick={() => setIsMenuOpen(false)}>Products</Link>
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
                <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="nav-link" onClick={() => setIsMenuOpen(false)}>Register</Link>
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
                      <Link to={currentUser.role === 'admin' || currentUser.is_admin === 1 ? "/admin" : "/purchase-history"} onClick={() => setShowDropdown(false)}>
                        {currentUser.role === 'admin' || currentUser.is_admin === 1 ? "Dashboard" : "My Orders"}
                      </Link>
                    </li>
                    <li>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </nav>

          <button className="navbar__mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>
    </>
  );
}