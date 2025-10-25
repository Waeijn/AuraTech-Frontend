// Sprint 1: Member 2
// Task: Implement basic Navbar structure for navigation.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

import productData from "../data/products.json";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("users");
    return stored ? JSON.parse(stored) : [];
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Register user
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

  // Login user
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

  // Load current user on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Logout user
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [results, setResults] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const searchWrapperRef = useRef(null);

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
  useEffect(() => {
    setProducts(productData);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Live filter
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }
    const q = searchTerm.toLowerCase();
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q));
    setResults(filtered.slice(0, 10));
  }, [searchTerm, products]);

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
        navigate("/products", { replace: true });
      }
    }
  }, [location.pathname, debouncedSearchTerm, navigate]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setResults([]);
      }
      if (!e.target.closest(".user-dropdown")) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide Navbar on Login/Register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  const handleSelectProduct = (product) => {
    navigate(`/product/${product.id}`);
    setSearchTerm("");
    setResults([]);
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
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </>
            ) : (
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
