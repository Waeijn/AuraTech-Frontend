import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

// Mock data source for product search functionality
import productData from "../data/products.json";

// --- Authentication Context Setup ---
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Manages user state (login/logout/register) and persistence
 * via local storage for the entire application.
 */
export function AuthProvider({ children }) {
  // State for all registered users, initialized from local storage
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("users");
    return stored ? JSON.parse(stored) : [];
  });
  // State for the currently logged-in user
  const [currentUser, setCurrentUser] = useState(null);

  /**
   * Registers a new user and saves the updated list to local storage.
   * @param {object} userData - User data { name, email, password }.
   * @returns {object} Status object indicating success or failure.
   */
  const register = ({ name, email, password }) => {
    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    const newUser = { name, email, password };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    return { success: true, message: "Registration successful!" };
  };

  /**
   * Attempts to log in a user by checking credentials against stored users.
   * If successful, sets currentUser and stores it in local storage.
   * @param {object} credentials - User credentials { email, password }.
   * @returns {object} Status object indicating success or failure.
   */
  const login = ({ email, password }) => {
    const stored = JSON.parse(localStorage.getItem("users")) || [];
    const user = stored.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return { success: true, message: "Login successful!" };
    } else {
      return { success: false, message: "Invalid email or password" };
    }
  };

  /**
   * Clears the current user state and removes user data from local storage.
   */
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  // Effect to initialize currentUser state from local storage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook to consume the AuthContext. */
export const useAuth = () => useContext(AuthContext);

// --- Navbar Component ---

/**
 * Navbar Component
 * Renders the primary application header, including navigation links,
 * user authentication status, search functionality, and a cart login prompt.
 */
export default function Navbar() {
  // Context and Router hooks
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for search and UI elements
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [results, setResults] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Ref for handling clicks outside the search dropdown
  const searchWrapperRef = useRef(null);

  // --- Modal Handlers ---

  /** Closes the authentication prompt modal. */
  const handleCloseAuthPrompt = () => setIsAuthPromptOpen(false);

  /** Closes the modal and navigates to the login page. */
  const handleLoginRedirect = () => {
    handleCloseAuthPrompt();
    navigate("/login");
  };

  /**
   * Intercepts the click on the Cart link.
   * If not logged in, prevents navigation and opens the auth prompt.
   * @param {object} e - The click event.
   */
  const handleCartClick = (e) => {
    if (!currentUser) {
      e.preventDefault();
      setIsAuthPromptOpen(true);
    }
  };

  /** Logs the user out and navigates to the home page. */
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /**
   * Handles the search form submission.
   * Navigates the user to the /products page with a search query parameter.
   * @param {object} e - The form submission event.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  /**
   * Handles clicking on a product result in the dropdown.
   * Navigates to the product's detail page and clears the search state.
   * @param {object} product - The selected product object.
   */
  const handleSelectProduct = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm("");
    setResults([]);
  };

  // --- Effects ---

  // Loads product data from the JSON file on initial render
  useEffect(() => {
    setProducts(productData);
  }, []);

  // Debounces the search term state to limit search executions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Performs live filtering of products based on the debounced search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
    // Limit results for the dropdown display
    setResults(filtered.slice(0, 10));
  }, [searchTerm, products]);

  // Updates the URL query parameter if the user is on the /products page
  useEffect(() => {
    if (location.pathname === "/products") {
      if (debouncedSearchTerm.trim() !== "") {
        navigate(
          `/products?search=${encodeURIComponent(debouncedSearchTerm)}`,
          {
            replace: true,
          }
        );
      } else {
        // Clears the search query if the input is empty
        navigate("/products", { replace: true });
      }
    }
  }, [location.pathname, debouncedSearchTerm, navigate]);

  // Global click listener to close the search results and user dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      // Close search results if click is outside the search bar
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setResults([]);
      }
      // Close user dropdown if click is outside the dropdown container
      if (!e.target.closest(".user-dropdown")) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Conditional Rendering ---

  // Hides the Navbar on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <>
      {/* Authentication Required Modal (Displayed when cart is clicked by a guest) */}
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

      {/* Main Header/Navbar Structure */}
      <header className="navbar">
        <div className="navbar__container">
          {/* Brand/Logo Section */}
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

          {/* Search Bar with Live Results Dropdown */}
          <div
            className="navbar__search-wrapper"
            ref={searchWrapperRef}
            position="relative"
          >
            <form className="navbar__search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
              <button type="submit" className="search-btn">
                Search
              </button>
            </form>

            {results.length > 0 && (
              <ul
                className="search-results-dropdown"
                // Prevent closing the dropdown when clicking inside it
                onMouseDown={(e) => e.preventDefault()}
              >
                {results.map((product) => (
                  <li
                    key={product.id}
                    className="search-item"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="search-thumb"
                    />
                    <span className="search-name">{product.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navigation and Auth Links */}
          <nav className="navbar__links">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/products" className="nav-link">
              Products
            </Link>
            <Link to="/cart" className="nav-link" onClick={handleCartClick}>
              Cart
            </Link>

            {!currentUser ? (
              // Links for unauthenticated users
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </>
            ) : (
              // Dropdown menu for authenticated users
              <div className="user-dropdown">
                <button
                  className="user-dropdown-toggle"
                  onClick={() => setShowDropdown((prev) => !prev)}
                >
                  Hello, {currentUser.name}{" "}
                  <span style={{ fontSize: "0.8rem" }}>▼</span>
                </button>

                {showDropdown && (
                  <ul className="user-dropdown-menu">
                    <li>
                      <Link
                        to="/account"
                        onClick={() => setShowDropdown(false)}
                      >
                        My Account
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/purchase-history"
                        onClick={() => setShowDropdown(false)}
                      >
                        My Purchase
                      </Link>
                    </li>
                    <li>
                      <button
                        className="logout-btn"
                        onClick={() => {
                          handleLogout();
                          setShowDropdown(false);
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
