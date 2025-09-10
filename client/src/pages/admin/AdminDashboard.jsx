import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AdminDashboard.css';

// Get API base URL from environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    // Check for admin token
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('admin');
    
    if (!adminToken || !adminData) {
      console.error('No admin token found');
      navigate('/admin/login');
      return;
    }
    
    try {
      // Fetch dashboard metrics
      const metricsResponse = await api.get('/api/admin/dashboard');
      setMetrics(metricsResponse.data);
      console.log('Dashboard metrics:', metricsResponse.data);
      
      // Fetch pending properties
      const pendingPropertiesResponse = await api.get('/api/admin/properties/pending');
      setPendingProperties(pendingPropertiesResponse.data);
      console.log('Pending properties:', pendingPropertiesResponse.data);
      
      // Fetch all properties
      const allPropertiesResponse = await api.get('/api/admin/properties');
      setAllProperties(allPropertiesResponse.data);
      console.log('All properties:', allPropertiesResponse.data);
      
      // Fetch pending reports
      const pendingReportsResponse = await api.get('/api/admin/reports/pending');
      setPendingReports(pendingReportsResponse.data);
      console.log('Pending reports:', pendingReportsResponse.data);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Handle 401 errors
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    navigate('/admin/login');
  };

  const handlePropertyAction = async (propertyId, action) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }
      
      await api.put(`/api/admin/properties/${propertyId}/${action}`);
      
      // Refresh data after action
      fetchDashboardData();
      
      // Close modal if open
      if (showPropertyModal) {
        setShowPropertyModal(false);
      }
    } catch (err) {
      console.error(`Error ${action} property:`, err);
      setError(`Failed to ${action} property. Please try again.`);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }
      
      await api.put(`/api/admin/reports/${reportId}/${action}`);
      
      // Refresh data after action
      fetchDashboardData();
    } catch (err) {
      console.error(`Error ${action} report:`, err);
      setError(`Failed to ${action} report. Please try again.`);
    }
  };

  const viewPropertyDetails = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // Tab content for dashboard
  const renderDashboardTab = () => (
    <div className="dashboard-tab">
      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : metrics ? (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Users</h3>
              <p className="metric-value">{metrics.totalUsers}</p>
              <div className="metric-breakdown">
                <span>Buyers: {metrics.buyerCount}</span>
                <span>Renters: {metrics.renterCount}</span>
                <span>Owners: {metrics.ownerCount}</span>
              </div>
            </div>
            <div className="metric-card">
              <h3>Properties</h3>
              <p className="metric-value">{metrics.totalProperties}</p>
              <div className="metric-breakdown">
                <span>Pending: {metrics.pendingProperties}</span>
                <span>Approved: {metrics.approvedProperties}</span>
                <span>Rejected: {metrics.rejectedProperties}</span>
              </div>
            </div>
            <div className="metric-card">
              <h3>Reports</h3>
              <p className="metric-value">{metrics.totalReports}</p>
              <div className="metric-breakdown">
                <span>Pending: {metrics.pendingReports}</span>
                <span>Resolved: {metrics.resolvedReports}</span>
              </div>
            </div>
          </div>
          
          <div className="pending-section">
            <h3>Pending Properties</h3>
            {pendingProperties.length > 0 ? (
              <div className="property-cards">
                {pendingProperties.map(property => (
                  <div key={property._id} className="property-card">
                    <div className="property-image">
                      <img 
                        src={property.images && property.images.length > 0 
                          ? `${API_BASE}${property.images[0]}` 
                          : '/placeholder-property.jpg'} 
                        alt={property.title} 
                      />
                    </div>
                    <div className="property-info">
                      <h4>{property.title}</h4>
                      <p>{property.location}</p>
                      <p className="price">${property.price.toLocaleString()}</p>
                      <div className="property-actions">
                        <button 
                          onClick={() => viewPropertyDetails(property)}
                          className="view-btn"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handlePropertyAction(property._id, 'approve')}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handlePropertyAction(property._id, 'reject')}
                          className="reject-btn"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No pending properties</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );

  // Tab content for all properties
  const renderAllPropertiesTab = () => (
    <div className="all-properties-tab">
      {loading ? (
        <div className="loading">Loading properties...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : allProperties.length > 0 ? (
        <div className="properties-table-container">
          <table className="properties-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Location</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allProperties.map(property => (
                <tr key={property._id}>
                  <td>
                    <img 
                      src={property.images && property.images.length > 0 
                        ? `${API_BASE}${property.images[0]}` 
                        : '/placeholder-property.jpg'} 
                      alt={property.title} 
                      className="table-image"
                    />
                  </td>
                  <td>{property.title}</td>
                  <td>{property.location}</td>
                  <td>${property.price.toLocaleString()}</td>
                  <td>{property.type}</td>
                  <td>
                    <span className={`status-badge ${property.status}`}>
                      {property.status}
                    </span>
                  </td>
                  <td>{property.owner?.name || 'Unknown'}</td>
                  <td>
                    <button 
                      onClick={() => viewPropertyDetails(property)}
                      className="view-btn small"
                    >
                      View
                    </button>
                    {property.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handlePropertyAction(property._id, 'approve')}
                          className="approve-btn small"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handlePropertyAction(property._id, 'reject')}
                          className="reject-btn small"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No properties found</p>
      )}
    </div>
  );

  // Tab content for reports
  const renderReportsTab = () => (
    <div className="reports-tab">
      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : pendingReports.length > 0 ? (
        <div className="reports-list">
          {pendingReports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-header">
                <h4>Report #{report._id.substring(0, 8)}</h4>
                <span className="report-date">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="report-content">
                <p><strong>Property:</strong> {report.property?.title || 'Unknown'}</p>
                <p><strong>Reported by:</strong> {report.user?.name || 'Anonymous'}</p>
                <p><strong>Reason:</strong> {report.reason}</p>
                <p><strong>Description:</strong> {report.description}</p>
              </div>
              <div className="report-actions">
                <button 
                  onClick={() => handleReportAction(report._id, 'resolve')}
                  className="resolve-btn"
                >
                  Mark as Resolved
                </button>
                {report.property && (
                  <button 
                    onClick={() => viewPropertyDetails(report.property)}
                    className="view-btn"
                  >
                    View Property
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No pending reports</p>
      )}
    </div>
  );

  // Tab content for profile
  const renderProfileTab = () => (
    <div className="profile-tab">
      <div className="profile-card">
        <h3>Admin Profile</h3>
        <p>Manage your admin profile and settings</p>
        <button onClick={() => navigate('/admin/profile-settings')} className="settings-btn">
          Profile Settings
        </button>
      </div>
    </div>
  );

  // Property details modal
  const renderPropertyModal = () => {
    if (!selectedProperty) return null;
    
    return (
      <div className="modal-overlay" onClick={() => setShowPropertyModal(false)}>
        <div className="property-modal" onClick={e => e.stopPropagation()}>
          <button className="close-modal" onClick={() => setShowPropertyModal(false)}>×</button>
          
          <div className="modal-images">
            {selectedProperty.images && selectedProperty.images.length > 0 ? (
              <img 
                src={`${API_BASE}${selectedProperty.images[0]}`} 
                alt={selectedProperty.title} 
              />
            ) : (
              <div className="no-image">No image available</div>
            )}
          </div>
          
          <div className="modal-content">
            <h3>{selectedProperty.title}</h3>
            <p className="location">{selectedProperty.location}</p>
            <p className="price">${selectedProperty.price.toLocaleString()}</p>
            
            <div className="property-details">
              <div className="detail">
                <span className="label">Type:</span>
                <span className="value">{selectedProperty.type}</span>
              </div>
              <div className="detail">
                <span className="label">Status:</span>
                <span className="value status-badge ${selectedProperty.status}">
                  {selectedProperty.status}
                </span>
              </div>
              <div className="detail">
                <span className="label">Bedrooms:</span>
                <span className="value">{selectedProperty.bedrooms}</span>
              </div>
              <div className="detail">
                <span className="label">Bathrooms:</span>
                <span className="value">{selectedProperty.bathrooms}</span>
              </div>
              <div className="detail">
                <span className="label">Area:</span>
                <span className="value">{selectedProperty.area} sq ft</span>
              </div>
              <div className="detail">
                <span className="label">Owner:</span>
                <span className="value">{selectedProperty.owner?.name || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="description">
              <h4>Description</h4>
              <p>{selectedProperty.description}</p>
            </div>
            
            {selectedProperty.status === 'pending' && (
              <div className="modal-actions">
                <button 
                  onClick={() => handlePropertyAction(selectedProperty._id, 'approve')}
                  className="approve-btn"
                >
                  Approve Property
                </button>
                <button 
                  onClick={() => handlePropertyAction(selectedProperty._id, 'reject')}
                  className="reject-btn"
                >
                  Reject Property
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>
      
      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <ul>
            <li>
              <button 
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                className={activeTab === 'allProperties' ? 'active' : ''}
                onClick={() => setActiveTab('allProperties')}
              >
                All Properties
              </button>
            </li>
            <li>
              <button 
                className={activeTab === 'reports' ? 'active' : ''}
                onClick={() => setActiveTab('reports')}
              >
                Reports
              </button>
            </li>
            <li>
              <button 
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
            </li>
          </ul>
        </nav>
        
        <main className="tab-content">
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'allProperties' && renderAllPropertiesTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </main>
      </div>
      
      {showPropertyModal && renderPropertyModal()}
    </div>
  );
};

export default AdminDashboard;