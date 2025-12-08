import { Routes, Route, Navigate, Outlet } from "react-router-dom"; // Added Outlet
import Navbar, { AuthProvider, useAuth } from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute"; 
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ProductList from "./pages/ProductList";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PurchaseHistory from "./pages/PurchaseHistory";
import Account from "./pages/Account";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import OrderReview from "./pages/admin/OrderReview";
import ProductManagement from "./pages/admin/ProductManagement";
import UserManagement from "./pages/admin/UserManagement";

// --- Layout Component for Users (Navbar + Footer) ---
const UserLayout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet /> {/* This renders the child page (Home, Products, etc.) */}
      </main>
      <Footer />
    </>
  );
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div style={{padding: "50px", textAlign: "center"}}>Loading...</div>;
  }

  return (
    <Routes>
      {/* --- ADMIN ROUTES (No Navbar/Footer) --- */}
      {/* These are defined FIRST so they take priority */}
      <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><OrderReview /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute adminOnly={true}><ProductManagement /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><UserManagement /></ProtectedRoute>} />
      
      {/* Redirect /admin/* to /admin dashboard to prevent 404s inside admin area */}
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />


      {/* --- USER ROUTES (Wrapped in UserLayout) --- */}
      <Route element={<UserLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected User Routes */}
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/purchase-history" element={<ProtectedRoute><PurchaseHistory /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        
        {/* Catch-all: Redirect unknown User URLs to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-root"><AppContent /></div>
    </AuthProvider>
  );
}