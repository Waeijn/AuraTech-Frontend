import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// Imports Navbar and authentication utilities from the Navbar component file
import Navbar, { AuthProvider, useAuth } from "./components/Navbar";

// Import all page components
import HomePage from "./pages/HomePage";
import ProductList from "./pages/ProductList";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Footer from "./components/Footer";
import PurchaseHistory from "./pages/PurchaseHistory";

/**
 * ProtectedRoute Component
 * A wrapper that checks if a user is authenticated. If not, it redirects
 * them to the /login page, preserving the user's intended destination.
 * @param {object} element - The component to render if the user is logged in.
 */
const ProtectedRoute = ({ element: Element }) => {
  const { currentUser } = useAuth();
  // If authenticated, render the requested component; otherwise, redirect to login
  return currentUser ? <Element /> : <Navigate to="/login" replace />;
};

/**
 * AppContent Component
 * Contains the main layout (Navbar, Routes, Footer) that needs access
 * to router hooks (like useLocation).
 */
function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* Navbar handles its own visibility based on the route */}
      <Navbar />

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes: Require Authentication (Cart, Checkout, Account, History) */}
          <Route path="/cart" element={<ProtectedRoute element={Cart} />} />
          <Route
            path="/checkout"
            element={<ProtectedRoute element={Checkout} />}
          />
          <Route
            path="/account"
            element={<ProtectedRoute element={Account} />}
          />
          <Route
            path="/purchase-history"
            element={<ProtectedRoute element={PurchaseHistory} />}
          />

          {/* Fallback Route: Redirects non-matching paths to the home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Conditionally render Footer only if NOT on login or register pages */}
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Footer />
      )}
    </>
  );
}

/**
 * App Component
 * The root component of the application. Wraps the main content with the
 * AuthProvider context to make authentication state globally available.
 */
export default function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
