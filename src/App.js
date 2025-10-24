// Sprint 5: Member 5
// Task: Integrate routes created across sprints and ensure pages render.
// Member 5 will update routing when new pages are added. Keep routes simple and safe.

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./components/Navbar";

import HomePage from "./pages/HomePage";
import ProductList from "./pages/ProductList";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
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
