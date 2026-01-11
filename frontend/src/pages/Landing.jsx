import { useState } from "react";
import { Link } from "react-router-dom";
import Register from "./Register";
import "./Landing.css";

// ✅ Import images properly (Vite-safe)
import heroImg from "../assets/legacy.png";
import aboutImg from "../assets/about.jpg";

const Landing = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <>
      <div className="landing">

        {/* ================= Header ================= */}
        <header className="header">
          <div className="container">
            <h2 className="logo">LegacyChain</h2>

            <nav className="nav">
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#about">About</a>
              <Link to="/login">Login</Link>
              <button className="primary-btn" onClick={() => setIsRegisterOpen(true)}>
                Register
              </button>
            </nav>
          </div>
        </header>

        {/* ================= Hero Section ================= */}
        <main className="hero">
          <div className="hero-overlay"></div>

          <div className="container">
            <div className="hero-content">

              <div className="hero-text">
                <h1>
                  YOUR DIGITAL LIFE <br />
                  DOESN’T END WITH YOU.
                </h1>

                <p>
                  Your digital assets deserve the same protection as your physical ones.
                  LegacyChain helps you define, secure, and pass on your digital life
                  transparently and legally using blockchain technology.
                </p>

                <div className="hero-actions">
                  <button className="primary-btn" onClick={() => setIsRegisterOpen(true)}>
                    Register
                  </button>
                  <a href="#features" className="secondary-btn">
                    Learn More
                  </a>
                </div>
              </div>

              <div className="hero-image">
                <img src={heroImg} alt="Digital Legacy Concept" />
              </div>

            </div>
          </div>
        </main>

        {/* ================= Features Section ================= */}
        <section id="features" className="features">
          <div className="container">
            <h2 className="section-title">Why LegacyChain?</h2>

            <div className="features-grid">

              <div className="feature-card">
                <div className="feature-icon">📜</div>
                <h3>Blockchain-Based Digital Will</h3>
                <p>
                  Your will is converted into a cryptographic hash and stored on the
                  blockchain, ensuring immutability and tamper resistance.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🏛️</div>
                <h3>Authority-Based Verification</h3>
                <p>
                  Asset release occurs only after verification by a trusted legal
                  or government authority.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">👨‍👩‍👧</div>
                <h3>Beneficiary Mapping</h3>
                <p>
                  Assign specific digital assets to specific beneficiaries with
                  clearly defined ownership rules.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>Encrypted Asset Metadata</h3>
                <p>
                  Sensitive asset details remain encrypted off-chain while proof
                  of existence is maintained on-chain.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">⏳</div>
                <h3>Conditional Asset Release</h3>
                <p>
                  Assets are released only after predefined conditions are met,
                  preventing misuse or premature access.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Will Status Tracking</h3>
                <p>
                  Track the status of your will — Drafted, Pending Verification,
                  Approved, or Released.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= How It Works ================= */}
        <section id="how-it-works" className="how-it-works">
          <div className="container">
            <h2 className="section-title">How It Works</h2>

            <div className="steps">

              <div className="step">
                <div className="step-number">1</div>
                <h3>Create an Account</h3>
                <p>Register and securely authenticate your identity.</p>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <h3>Draft Your Digital Will</h3>
                <p>Add digital assets and assign beneficiaries.</p>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <h3>Secure on Blockchain</h3>
                <p>Will data is hashed and securely recorded on the blockchain.</p>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <h3>Controlled Execution</h3>
                <p>Assets are released only after verified authority approval.</p>
              </div>

            </div>
          </div>
        </section>

        {/* ================= About Section ================= */}
        <section id="about" className="about">
          <div className="container">
            <div className="about-content">

              <div className="about-text">
                <h2>About LegacyChain</h2>
                <p>
                  LegacyChain is a secure digital inheritance platform designed to
                  solve the growing problem of unmanaged digital assets after death.
                </p>
                <p>
                  By combining blockchain immutability with controlled legal
                  verification, LegacyChain ensures your digital legacy is protected
                  and honored exactly as intended.
                </p>
              </div>

              <div className="about-image">
                <img src={aboutImg} alt="LegacyChain Overview" />
              </div>

            </div>
          </div>
        </section>

        {/* ================= Testimonials ================= */}
        <section className="testimonials">
          <div className="container">
            <h2 className="section-title">What Our Users Say</h2>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"LegacyChain gave me peace of mind knowing my digital assets will be properly distributed. The blockchain security is unmatched."</p>
                </div>
                <div className="testimonial-author">
                  <img src="https://via.placeholder.com/50" alt="User" />
                  <div>
                    <h4>Sarah Johnson</h4>
                    <span>Tech Entrepreneur</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"As a lawyer, I appreciate the legal compliance and verification process. It's the future of digital inheritance."</p>
                </div>
                <div className="testimonial-author">
                  <img src="https://via.placeholder.com/50" alt="User" />
                  <div>
                    <h4>Michael Chen</h4>
                    <span>Attorney at Law</span>
                  </div>
                </div>
              </div>
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Simple, secure, and trustworthy. LegacyChain handles what traditional wills can't touch."</p>
                </div>
                <div className="testimonial-author">
                  <img src="https://via.placeholder.com/50" alt="User" />
                  <div>
                    <h4>Emily Rodriguez</h4>
                    <span>Digital Content Creator</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= Footer ================= */}
        <footer className="footer">
          <div className="footer-content">

            <div className="footer-section">
              <h3>LegacyChain</h3>
              <p>Securing your digital legacy.</p>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#about">About</a></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© 2024 LegacyChain. All rights reserved.</p>
          </div>
        </footer>

      </div>

      {/* Register Modal */}
      <Register
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </>
  );
};

export default Landing;
