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
  const [loading, setLoading] = useState(true); // <-- NEW LOADING STATE

  // --- 1. Define the Default Admin Account ---
  const DEFAULT_ADMIN = {
    name: "System Admin",
    email: "admin@auratech.com", // This is the email we check against for the 'admin' role
    password: "adminpassword", // Use a simple, temporary password for development
  };

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
      // --- UPDATED ADMIN ROLE CHECK ---
      const isAdmin = user.email === DEFAULT_ADMIN.email; // <--- Check against the constant
      const userWithRole = {
        ...user,
        role: isAdmin ? "admin" : "user",
      };
      // -------------------------------

      setCurrentUser(userWithRole);
      localStorage.setItem("currentUser", JSON.stringify(userWithRole));
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

  useEffect(() => {
    // 1. Load user data from storage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const isAdmin = user.email === DEFAULT_ADMIN.email;
      setCurrentUser({ ...user, role: isAdmin ? "admin" : "user" });
    }

    // 2. Seed the Default Admin Account (keeping your seeding logic)
    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const adminExists = storedUsers.some(
      (u) => u.email === DEFAULT_ADMIN.email
    );

    if (!adminExists) {
      const updatedUsers = [...storedUsers, DEFAULT_ADMIN];
      setUsers(updatedUsers);
      localStorage.setItem("users", JSON.stringify(updatedUsers));
    }

    // 3. Mark loading as complete after ALL checks are done
    setLoading(false); // <-- SET LOADING TO FALSE
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register,
        login,
        logout,
        isAdmin: currentUser?.role === "admin",
        loading, // <-- EXPOSE LOADING STATE
      }}
    >
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
  // DOC: New state for mobile menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // DOC: Handler for toggling the mobile menu state
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
    setShowDropdown(false); // Close user dropdown when opening/closing main menu
  };

  /**
   * Intercepts the click on the Cart link.
   * If not logged in, prevents navigation and opens the auth prompt.
   * @param {object} e - The click event.
   */
  const handleCartClick = (e) => {
    // DOC: Also close mobile menu when navigating
    if (isMenuOpen) setIsMenuOpen(false);
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
      // DOC: Close mobile menu after search
      setIsMenuOpen(false);
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
    // DOC: Close mobile menu after selection
    setIsMenuOpen(false);
  };

  // DOC: Close menu and dropdown on link click to ensure navigation works correctly
  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setShowDropdown(false);
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

  // DOC: Effect to prevent body scroll when the mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

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

      // DOC: Closing mobile menu when clicking outside of the entire navigation area is complex
      // due to the overlay, so we rely on link clicks and toggle button.
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
            <Link
              to="/"
              className="navbar__brand-text"
              onClick={handleLinkClick}
            >
              AuraTech
            </Link>
          </div>

          {/* Search Bar with Live Results Dropdown */}
          {/* DOC: Search bar is hidden by CSS on mobile, shown on desktop */}
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

          {/* Navigation and Auth Links (Mobile Menu Controlled) */}
          <nav className={`navbar__links ${isMenuOpen ? "is-open" : ""}`}>
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              Home
            </Link>
            <Link to="/products" className="nav-link" onClick={handleLinkClick}>
              Products
            </Link>
            <Link to="/cart" className="nav-link" onClick={handleCartClick}>
              Cart
            </Link>

            {!currentUser ? (
              // Links for unauthenticated users
              <>
                <Link
                  to="/login"
                  className="nav-link"
                  onClick={handleLinkClick}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="nav-link"
                  onClick={handleLinkClick}
                >
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
                      <Link to="/account" onClick={handleLinkClick}>
                        My Account
                      </Link>
                    </li>
                    <li>
                      <Link to="/purchase-history" onClick={handleLinkClick}>
                        My Purchase
                      </Link>
                    </li>
                    <li>
                      <button
                        className="logout-btn"
                        onClick={() => {
                          handleLogout();
                          handleLinkClick();
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}

            {/* DOC: Mobile search functionality moved inside the menu for better responsiveness */}
            {isMenuOpen && (
              <div
                className="navbar__search-wrapper mobile-search-wrapper"
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
              </div>
            )}
          </nav>

          {/* DOC: Mobile Menu Toggle button */}
          <button
            className="navbar__mobile-toggle"
            onClick={handleMenuToggle}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>
    </>
  );
}
