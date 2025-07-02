import { Link } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-page landing-background">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🖥️</span>
            <span>GenDevize</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <h1>A device handling Website</h1>
          <p>
            A device generating application made by Tanmayee Chanda. <br />
            This project was done as a part of task of my internship at addwise
            technologies.
          </p>

          <div className="cta-buttons">
            <Link to="/role-selection" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
