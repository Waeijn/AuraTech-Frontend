// Sprint 2: Member 3
// Task: Display Featured Products on the Home Page 
import "../styles/home.css";
import products from "../data/products.json";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

 
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <section className="home-page">
      <div className="hero">
        <h1>Welcome to AuraTech</h1>
        <p>
          Discover cutting-edge gaming gear designed for performance, durability,
          and style. Level up your setup with AuraTech.
        </p>
        <button className="btn-main" onClick={() => navigate("/products")}>
          Shop Now
        </button>
      </div>
      
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

      <section className="featured">
        <h2>Featured Products</h2>
        <div className="featured-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <div key={product.id} className="featured-card">
                <div className="featured-image-wrapper">
                  <img src={product.image} alt={product.name} />
                </div>
                <h3>{product.name}</h3>
                <p className="featured-price">₱{product.price.toLocaleString()}</p>
                <p className="featured-desc">{product.description}</p>
              </div>
            ))
          ) : (
            <p>No featured products available.</p>
          )}
        </div>
      </section>

      <div className="cta">
        <div className="cta-content">
          <h3>Join the AuraTech Community</h3>
          <p>
            Sign up to get exclusive discounts and early access to our next-gen
            gaming gear.
          </p>
          <button className="btn-main" onClick={() => navigate("/products")}>
            Shop Now
          </button>
        </div>
      </div>
    </section>
  );
}