import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar, { AuthProvider, useAuth } from "./components/Navbar";

// Public and User Pages
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

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import OrderReview from "./pages/admin/OrderReview";
import ProductManagement from "./pages/admin/ProductManagement";
import UserManagement from "./pages/admin/UserManagement";

/**
 * ProtectedRoute - Requires user authentication
 */
const ProtectedRoute = ({ element: Element }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Element /> : <Navigate to="/login" replace />;
};

/**
 * AdminRoute - Requires user to have admin role
 */
const AdminRoute = ({ element: Element }) => {
  const { currentUser } = useAuth();
  if (currentUser && currentUser.role === "admin") {
    return <Element />;
  }
  return <Navigate to="/" replace />;
};

/**
 * AppContent - Main application routing and layout
 */
function AppContent() {
  const location = useLocation();
  const { currentUser, loading } = useAuth();

  // Show loading screen while authentication initializes
  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <h2>Loading Application...</h2>
      </div>
    );
  }

  // Determine if current route is admin-related
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdminUser = currentUser?.role === "admin";

  // Admin layout: No Navbar/Footer, admin pages handle their own layout
  if (isAdminRoute && isAdminUser) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminRoute element={Dashboard} />} />
        <Route
          path="/admin/orders"
          element={<AdminRoute element={OrderReview} />}
        />
        <Route
          path="/admin/products"
          element={<AdminRoute element={ProductManagement} />}
        />
        <Route
          path="/admin/users"
          element={<AdminRoute element={UserManagement} />}
        />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Standard layout: Navbar + Content + Footer
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
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

          {/* Admin Routes - Accessible from customer layout */}
          <Route path="/admin" element={<AdminRoute element={Dashboard} />} />
          <Route
            path="/admin/orders"
            element={<AdminRoute element={OrderReview} />}
          />
          <Route
            path="/admin/products"
            element={<AdminRoute element={ProductManagement} />}
          />
          <Route
            path="/admin/users"
            element={<AdminRoute element={UserManagement} />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Hide Footer on login/register pages */}
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Footer />
      )}
    </>
  );
}

/**
 * App - Root component with AuthProvider
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
