import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { productService } from "../services/productService"; // Import Service

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Featured Products (Refactored) ---
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Use Service Layer: Pass params for pagination
        const result = await productService.getAll({ per_page: 100 });

        if (result.success && Array.isArray(result.data)) {
          // Filter for products where 'featured' is true (or 1)
          const featured = result.data.filter((p) => p.featured == true);
          // If no featured products exist yet, just take the first 3 as a fallback
          setFeaturedProducts(featured.length > 0 ? featured : result.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // --- Handlers ---
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`); // Correct route is usually /product/:id
  };

  const handleShopNowClick = () => {
    navigate("/products");
  };

  // --- DESIGN: EXACTLY THE SAME AS BEFORE ---
  return (
    <section className="home-page">
      {/* 1. HERO SECTION */}
      <div className="hero">
        <h1>Welcome to AuraTech</h1>
        <p>
          Discover cutting-edge gaming gear designed for performance,
          durability, and style. Level up your setup with AuraTech.
        </p>
        <button className="btn-main" onClick={handleShopNowClick}>
          Shop Now
        </button>
      </div>

      {/* 2. HIGHLIGHTS SECTION */}
      <section className="highlights">
        <h2>Why Shop with AuraTech?</h2>
        <div className="highlight-grid">
          <div className="highlight-card">
            <h3> Superior Performance</h3>
            <p>Experience lightning-fast response times and smooth gameplay with hardware built for champions.</p>
          </div>
          <div className="highlight-card">
            <h3> Trusted Quality</h3>
            <p>Built with premium materials and tested for reliability, every AuraTech product stands the test of time.</p>
          </div>
          <div className="highlight-card">
            <h3>Next-Level Design</h3>
            <p>Ergonomic and aesthetic designs that enhance comfort and boost your gaming experience.</p>
          </div>
          <div className="highlight-card">
            <h3> Fast Delivery</h3>
            <p>Get your favorite products delivered quickly and securely, right to your doorstep.</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="featured">
        <h2>Featured Products</h2>
        {loading ? (
          <p>Loading highlights...</p>
        ) : (
          <div className="featured-grid">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="featured-card"
                  onClick={() => handleProductClick(product.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="featured-image-wrapper">
                    <img 
                      src={product.image || "/img/products/placeholder.png"} 
                      alt={product.name} 
                    />
                  </div>
                  <h3>{product.name}</h3>
                  <p className="featured-price">
                    ₱{Number(product.price).toLocaleString()}
                  </p>
                  <p className="featured-desc">{product.description}</p>
                </div>
              ))
            ) : (
              <p>Check out our full catalog in the shop!</p>
            )}
          </div>
        )}
      </section>

      {/* 4. CTA SECTION */}
      <div className="cta">
        <div className="cta-content">
          <h3>Join the AuraTech Community</h3>
          <p>
            Sign up to get exclusive discounts and early access to our next-gen
            gaming gear.
          </p>
          <button className="btn-main" onClick={handleShopNowClick}>
            Explore All Products
          </button>
        </div>
      </div>
    </section>
  );
}