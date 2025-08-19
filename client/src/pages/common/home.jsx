import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Dwelo</h1>
        </div>
        <div className="nav-user">
          <span>Welcome, {user.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <h2>Welcome to Dwelo</h2>
          <p>Your perfect home is waiting for you</p>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <h3>Find Your Dream Home</h3>
            <p>Browse through thousands of properties to find the perfect match for your lifestyle.</p>
          </div>
          
          <div className="feature-card">
            <h3>Rent or Buy</h3>
            <p>Whether you're looking to rent or buy, we have options for every budget and preference.</p>
          </div>
          
          <div className="feature-card">
            <h3>Expert Support</h3>
            <p>Our team of real estate experts is here to help you every step of the way.</p>
          </div>
        </div>

        <div className="cta-section">
          <h3>Ready to start your journey?</h3>
          <p>Explore our properties and find your perfect home today.</p>
          <button className="cta-button">Browse Properties</button>
        </div>
      </main>
    </div>
  );
};

export default Home;
