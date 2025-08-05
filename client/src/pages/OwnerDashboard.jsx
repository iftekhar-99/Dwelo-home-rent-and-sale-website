import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OwnerDashboard.css';
import { FaHome, FaList, FaBell, FaUser, FaSignOutAlt, FaEnvelope } from 'react-icons/fa';
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
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/owner/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalProperties: data.data.overview.totalProperties || 0,
          activeListings: data.data.properties.stats.approved?.count || 0,
          pendingRequests: data.data.overview.totalRequests || 0,
          totalViews: 0
        });
        setProperties(data.data.properties.recent || []);
        setRequests(data.data.requests.recent || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
        // Set empty states instead of mock data
        setStats({
          totalProperties: 0,
          activeListings: 0,
          pendingRequests: 0,
          totalViews: 0
        });
        setProperties([]);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to connect to server. Please try again.');
      // Set empty states instead of mock data
      setStats({
        totalProperties: 0,
        activeListings: 0,
        pendingRequests: 0,
        totalViews: 0
      });
      setProperties([]);
      setRequests([]);
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

  const renderEmptyState = (title, message, actionText, actionPath) => (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionPath && (
        <Link to={actionPath} className="empty-action-btn">
          {actionText}
        </Link>
      )}
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const user = JSON.parse(localStorage.getItem('user'));
  const ownerName = user?.fullName || 'Owner';

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
          <button className="nav-link logout-button" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </nav>


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
            <Link to="/owner/create-property" className="add-property-btn">+ Add Property</Link>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="welcome-section">
            <h1>Welcome Back, {ownerName}!</h1>
            <p>Here's what's happening with your properties</p>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="loading-skeleton">
              <div className="skeleton-stats"></div>
              <div className="skeleton-content"></div>
            </div>
          ) : (
            <>
              {renderStatCards()}

              <div className="dashboard-main-content">
                <div className="dashboard-section properties-section">
                  <div className="section-header">
                    <h2>My Properties</h2>
                    <Link to="/owner/properties" className="view-all">View All</Link>
                  </div>
                  <div className="property-list-small">
                    {properties.length > 0 ? (
                      properties.slice(0, 2).map(property => (
                        <div 
                          key={property._id || property.id} 
                          className="property-card-small"
                          onClick={() => navigate(`/owner/property/${property._id || property.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="property-image-small">
                            <img 
                              src={property.images && property.images.length > 0 && property.images[0].url ? 
                                (property.images[0].url.startsWith('http') ? property.images[0].url : `http://localhost:5001${property.images[0].url}`) : 
                                '/placeholder-property.jpg'} 
                              alt={property.title} 
                              onError={(e) => {
                                console.log('Image failed to load:', e.target.src);
                                e.target.src = '/placeholder-property.jpg';
                              }}
                            />
                          </div>
                          <div className="property-info-small">
                            <h3>{property.title || property.name}</h3>
                            <p className="property-price-small">${property.price?.toLocaleString() || 'N/A'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      renderEmptyState(
                        "No Properties Yet",
                        "You haven't listed any properties. Add your first property to get started!",
                        "Add Property",
                        "/owner/create-property"
                      )
                    )}
                  </div>
                </div>

                <div className="dashboard-section requests-section">
                  <div className="section-header">
                    <h2><FaEnvelope className="header-icon" /> Recent Requests</h2>
                    <Link to="/owner/requests" className="view-all">View All</Link>
                  </div>
                  <div className="request-list">
                    {requests.length > 0 ? (
                      requests.slice(0, 3).map(request => (
                        <div key={request._id} className="request-card">
                          <p><strong>{request.user.fullName}</strong> requested to view <strong>{request.property.name}</strong></p>
                          <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <p>No recent requests.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;