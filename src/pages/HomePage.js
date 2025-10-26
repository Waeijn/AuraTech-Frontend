// Sprint 2: Member 3 - Redesigned for visual appeal and brand consistency (AuraTech)

import "../styles/home.css";
import products from "../data/products.json";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const featuredProducts = products.filter((p) => p.featured);

  // Handler to navigate to a product's details page
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Handler to navigate to the main products page
  const handleShopNowClick = () => {
    navigate("/products");
  };

  return (
    // The home-page container uses the main brand background color (F9F9F9)
    <section className="home-page">
      {/* 1. HERO SECTION: High-impact introduction */}
      <div className="hero">
        <h1>Welcome to AuraTech</h1>
        <p>
          Discover cutting-edge gaming gear designed for performance,
          durability, and style. Level up your setup with AuraTech.
        </p>
        {/* Uses btn-main for Primary Accent color (#1D6489) */}
        <button className="btn-main" onClick={handleShopNowClick}>
          Shop Now
        </button>
      </div>

      {/* 2. HIGHLIGHTS SECTION: Value proposition cards */}
      <section className="highlights">
        <h2>Why Shop with AuraTech?</h2>
        <div className="highlight-grid">
          {/* Highlight cards use the subtle background and get an Accent Teal border on hover */}
          <div className="highlight-card">
            <h3> Superior Performance</h3>
            <p>
              Experience lightning-fast response times and smooth gameplay with
              hardware built for champions.
            </p>
          </div>
          <div className="highlight-card">
            <h3> Trusted Quality</h3>
            <p>
              Built with premium materials and tested for reliability, every
              AuraTech product stands the test of time.
            </p>
          </div>
          <div className="highlight-card">
            <h3>Next-Level Design</h3>
            <p>
              Ergonomic and aesthetic designs that enhance comfort and boost
              your gaming experience.
            </p>
          </div>
          <div className="highlight-card">
            <h3> Fast Delivery</h3>
            <p>
              Get your favorite products delivered quickly and securely, right
              to your doorstep.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION: Key products displayed in a clean grid */}
      <section className="featured">
        <h2>Featured Products</h2>
        <div className="featured-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              // Added onClick handler and cursor style for interactivity
              <div
                key={product.id}
                className="featured-card"
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="featured-image-wrapper">
                  <img src={product.image} alt={product.name} />
                </div>
                {/* Price uses the Primary Accent color for emphasis in CSS */}
                <h3>{product.name}</h3>
                <p className="featured-price">
                  ₱{product.price.toLocaleString()}
                </p>
                <p className="featured-desc">{product.description}</p>
              </div>
            ))
          ) : (
            <p>No featured products available.</p>
          )}
        </div>
      </section>

      {/* 4. CTA (Call to Action) SECTION: Uses Dark Text background for contrast */}
      <div className="cta">
        <div className="cta-content">
          <h3>Join the AuraTech Community</h3>
          <p>
            Sign up to get exclusive discounts and early access to our next-gen
            gaming gear.
          </p>
          {/* CTA button uses reversed style (White background, Primary Accent text) for high contrast on the dark banner */}
          <button className="btn-main" onClick={handleShopNowClick}>
            Explore All Products
          </button>
        </div>
      </div>
    </section>
  );
}
