import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OwnerDashboard.css';
import { FaHome, FaList, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { BsFillHouseDoorFill, BsGraphUp } from 'react-icons/bs';

const OwnerDashboard = () => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeListings: 0,
    pendingRequests: 0,
    totalViews: 0
  });
  
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/owner/dashboard');
      const data = await response.json();
      
      setStats(data.stats);
      setProperties(data.properties);
      setRequests(data.requests);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { icon: <FaHome />, text: 'Dashboard', path: '/owner/dashboard' },
    { icon: <BsFillHouseDoorFill />, text: 'My Properties', path: '/owner/properties' },
    { icon: <FaList />, text: 'Requests', path: '/owner/requests' },
    { icon: <BsGraphUp />, text: 'Analytics', path: '/owner/analytics' },
    { icon: <FaUser />, text: 'Profile', path: '/owner/profile' }
  ];

  const renderStatCards = () => (
    <div className="stats-grid">
      <div className="stat-card primary">
        <div className="stat-icon"><BsFillHouseDoorFill /></div>
        <div className="stat-info">
          <h3>Properties</h3>
          <p className="stat-value">{stats.totalProperties}</p>
          <span className="stat-label">Total Listed</span>
        </div>
      </div>
      <div className="stat-card success">
        <div className="stat-icon"><BsGraphUp /></div>
        <div className="stat-info">
          <h3>Active</h3>
          <p className="stat-value">{stats.activeListings}</p>
          <span className="stat-label">Current Listings</span>
        </div>
      </div>
      <div className="stat-card warning">
        <div className="stat-icon"><FaBell /></div>
        <div className="stat-info">
          <h3>Pending</h3>
          <p className="stat-value">{stats.pendingRequests}</p>
          <span className="stat-label">New Requests</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="owner-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Dwelo" className="logo" />
          <h2>Owner Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          {sidebarLinks.map((link, index) => (
            <Link key={index} to={link.path} className="nav-link">
              {link.icon}
              <span>{link.text}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-search">
            <input type="search" placeholder="Search properties..." />
          </div>
          
          <div className="header-actions">
            <button className="notification-btn">
              <FaBell />
              {stats.pendingRequests > 0 && (
                <span className="notification-badge">{stats.pendingRequests}</span>
              )}
            </button>
            <button className="add-property-btn">+ Add Property</button>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="welcome-section">
            <h1>Welcome Back, Owner!</h1>
            <p>Here's what's happening with your properties</p>
          </div>

          {loading ? (
            <div className="loading-skeleton">{/* Add loading animation */}</div>
          ) : (
            <>
              {renderStatCards()}

              <div className="dashboard-grid">
                <section className="recent-properties">
                  <div className="section-header">
                    <h2>Recent Properties</h2>
                    <Link to="/owner/properties" className="view-all">View All</Link>
                  </div>
                  <div className="property-list">
                    {properties.slice(0, 3).map(property => (
                      <div key={property.id} className="property-card">
                        <div className="property-image">
                          <img src={property.image} alt={property.title} />
                          <span className={`status-badge status-${property.status}`}>
                            {property.status}
                          </span>
                        </div>
                        <div className="property-info">
                          <h3>{property.title}</h3>
                          <p className="property-price">${property.price.toLocaleString()}</p>
                          <div className="property-stats">
                            <span>{property.views} views</span>
                            <span>{property.requests} requests</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="recent-requests">
                  <div className="section-header">
                    <h2>Recent Requests</h2>
                    <Link to="/owner/requests" className="view-all">View All</Link>
                  </div>
                  <div className="requests-list">
                    {requests.slice(0, 5).map(request => (
                      <div key={request.id} className="request-card">
                        <div className="request-info">
                          <h4>{request.property}</h4>
                          <p>{request.buyer}</p>
                          <span className={`status-badge status-${request.status}`}>
                            {request.status}
                          </span>
                        </div>
                        <button className="view-request-btn">View Details</button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;