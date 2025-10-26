import "../styles/home.css";
import products from "../data/products.json";
import { useNavigate } from "react-router-dom";

/**
 * HomePage Component
 * Renders the main landing page, featuring a hero section, value propositions,
 * and a grid of featured products.
 */
export default function HomePage() {
  const navigate = useNavigate();

  // Filter the product list to show only items marked as featured
  const featuredProducts = products.filter((p) => p.featured);

  // --- Handlers ---

  /**
   * Navigates to the details page of the clicked product.
   * @param {string} productId - The ID of the product.
   */
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  /** Navigates to the main product listing page. */
  const handleShopNowClick = () => {
    navigate("/products");
  };

  return (
    <section className="home-page">
      {/* 1. HERO SECTION: High-impact brand introduction */}
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

      {/* 2. HIGHLIGHTS SECTION: Value proposition cards */}
      <section className="highlights">
        <h2>Why Shop with AuraTech?</h2>
        <div className="highlight-grid">
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

      {/* 3. FEATURED PRODUCTS SECTION: Displays key products */}
      <section className="featured">
        <h2>Featured Products</h2>
        <div className="featured-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <div
                key={product.id}
                className="featured-card"
                // Click handler navigates to the specific product detail page
                onClick={() => handleProductClick(product.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="featured-image-wrapper">
                  <img src={product.image} alt={product.name} />
                </div>
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

      {/* 4. CTA (Call to Action) SECTION: Encourages browsing more products */}
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
