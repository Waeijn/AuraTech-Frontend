// Sprint 5: Member 5
// Task: Integrate routes created across sprints and ensure pages render.
// Member 5 will update routing when new pages are added. Keep routes simple and safe.

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar, { AuthProvider, useAuth } from "./components/Navbar";

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

const ProtectedRoute = ({ element: Element }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Element /> : <Navigate to="/login" replace />;
};

function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* Navbar hidden in Navbar component when on login/register */}
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Protected Routes: Require login for Cart and Checkout */}
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

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {location.pathname !== "/login" && location.pathname !== "/register" && (
        <Footer />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
