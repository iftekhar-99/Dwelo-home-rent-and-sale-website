import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingUpdateRequests, setPendingUpdateRequests] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [propertyTab, setPropertyTab] = useState('new');
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminData = localStorage.getItem('admin');
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminData || !adminToken) {
      navigate('/admin/login');
      return;
    }

    setAdmin(JSON.parse(adminData));
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard metrics
      const metricsResponse = await axios.get('/api/admin/dashboard', { headers });
      setMetrics(metricsResponse.data.data);

      // Fetch pending properties
      // Fetch pending properties (new listings)
      const propertiesResponse = await axios.get('/api/admin/properties/pending', { headers });
      setPendingProperties(propertiesResponse.data.data.properties);

      // Fetch pending property update requests
      const updateRequestsResponse = await axios.get('/api/admin/requests/property-update/pending', { headers });
      setPendingUpdateRequests(updateRequestsResponse.data.data.requests);

      // Fetch pending reports
      const reportsResponse = await axios.get('/api/admin/reports/pending', { headers });
      setPendingReports(reportsResponse.data.data.reports);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handlePropertyAction = async (propertyId, action, reason = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/admin/properties/${propertyId}/approve`, {
        action,
        reason
      }, { headers });

      // Refresh data
      fetchDashboardData();
      // Close modal if open
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error handling property action:', error);
    }
  };

  const handlePropertyUpdateAction = async (requestId, action, propertyId, updatedData, reason = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/admin/requests/${requestId}/handle-property-update`, {
        action,
        propertyId,
        updatedData: action === 'approve' ? updatedData : null, // Only send updatedData if approving
        reason: action === 'reject' ? reason : null // Only send reason if rejecting
      }, { headers });

      // Refresh data
      fetchDashboardData();
      // Close modal if open
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error handling property update action:', error);
    }
  };

  const viewPropertyDetails = (property, isUpdateRequest = false) => {
    setSelectedProperty({ ...property, isUpdateRequest });
  };

  const closePropertyDetails = () => {
    setSelectedProperty(null);
  };

  const handleReportAction = async (reportId, action, details = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/api/admin/reports/${reportId}/handle`, {
        action,
        details
      }, { headers });

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling report action:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>Dwelo Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>Welcome, {admin?.name}</span>
            <span className="admin-level">({admin?.adminLevel})</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <div className="admin-nav-content">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Property Requests ({pendingProperties.length + pendingUpdateRequests.length})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Review Reports ({pendingReports.length})
          </button>
          <button 
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
            
            {/* Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Users</h3>
                <div className="metric-value">{metrics?.users?.total || 0}</div>
                <div className="metric-details">
                  <span>Buyers: {metrics?.users?.byRole?.buyer?.total || 0}</span>
                  <span>Renters: {metrics?.users?.byRole?.renter?.total || 0}</span>
                  <span>Owners: {metrics?.users?.byRole?.owner?.total || 0}</span>
                </div>
              </div>

              <div className="metric-card">
                <h3>Properties</h3>
                <div className="metric-value">{metrics?.properties?.total || 0}</div>
                <div className="metric-details">
                  <span>Pending: {metrics?.properties?.pending || 0}</span>
                  <span>Approved: {metrics?.properties?.byStatus?.approved || 0}</span>
                  <span>Rejected: {metrics?.properties?.byStatus?.rejected || 0}</span>
                </div>
              </div>

              <div className="metric-card">
                <h3>Reports</h3>
                <div className="metric-value">{metrics?.reports?.total || 0}</div>
                <div className="metric-details">
                  <span>Pending: {metrics?.reports?.pending || 0}</span>
                  <span>Investigating: {metrics?.reports?.byStatus?.investigating || 0}</span>
                  <span>Resolved: {metrics?.reports?.byStatus?.resolved || 0}</span>
                </div>
              </div>

              <div className="metric-card">
                <h3>Recent Activity</h3>
                <div className="metric-details">
                  <span>New Users: {metrics?.users?.recent || 0}</span>
                  <span>New Properties: {metrics?.properties?.recent || 0}</span>
                  <span>New Reports: {metrics?.reports?.recent || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="properties-content">
            <h2>Property Approval Requests</h2>
            
            <div className="tab-container">
              <div className="tab-buttons">
                <button 
                  className={`tab-btn ${propertyTab === 'new' ? 'active' : ''}`}
                  onClick={() => setPropertyTab('new')}
                >
                  New Properties ({pendingProperties.length})
                </button>
                <button 
                  className={`tab-btn ${propertyTab === 'updates' ? 'active' : ''}`}
                  onClick={() => setPropertyTab('updates')}
                >
                  Update Requests ({pendingUpdateRequests.length})
                </button>
              </div>
              
              {propertyTab === 'new' && (
                <div className="tab-content">
                  {pendingProperties.length === 0 ? (
                    <p>No pending properties to review.</p>
                  ) : (
                    <div className="properties-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Owner</th>
                            <th>Type</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingProperties.map(property => (
                            <tr key={property._id}>
                              <td>{property.title}</td>
                              <td>{property.ownerId?.name}</td>
                              <td>{property.propertyType}</td>
                              <td>${property.price?.toLocaleString()}</td>
                              <td>
                                <span className={`status ${property.status}`}>
                                  {property.status}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button 
                                    onClick={() => viewPropertyDetails(property)}
                                    className="btn-view"
                                  >
                                    View Details
                                  </button>
                                  <button 
                                    onClick={() => handlePropertyAction(property._id, 'approve')}
                                    className="btn-approve"
                                  >
                                    Approve
                                  </button>
                                  <button 
              
                              onClick={() => {
                                  const reason = prompt('Enter rejection reason:');
                                  if (reason) {
                                    handlePropertyAction(property._id, 'reject', reason);
                                  }
                                }}
                                className="btn-reject"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {propertyTab === 'updates' && (
              <div className="tab-content">
                {pendingUpdateRequests.length === 0 ? (
                  <p>No pending property update requests to review.</p>
                ) : (
                  <div className="properties-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Property Title</th>
                          <th>Owner</th>
                          <th>Requested Changes</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUpdateRequests.map(request => (
                          <tr key={request._id}>
                            <td>{request.propertyId?.title}</td>
                            <td>{request.ownerId?.name}</td>
                            <td>
                              <button 
                                onClick={() => viewPropertyDetails(request.proposedUpdates, true)}
                                className="btn-view"
                              >
                                View Proposed Changes
                              </button>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handlePropertyUpdateAction(request._id, 'approve', request.propertyId._id, request.proposedUpdates)}
                                  className="btn-approve"
                                >
                                  Approve Update
                                </button>
                                <button 
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      handlePropertyUpdateAction(request._id, 'reject', request.propertyId._id, null, reason);
                                    }
                                  }}
                                  className="btn-reject"
                                >
                                  Reject Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
            )}
          </div>
        </div>
      )}

        {activeTab === 'reports' && (
          <div className="reports-content">
            <h2>Pending Reports</h2>
            
            {pendingReports.length === 0 ? (
              <p>No pending reports to review.</p>
            ) : (
              <div className="reports-table">
                <table>
                  <thead>
                    <tr>
                      <th>Reported By</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReports.map(report => (
                      <tr key={report._id}>
                        <td>{report.reportedBy?.name}</td>
                        <td>{report.reportType}</td>
                        <td>{report.reason}</td>
                        <td>
                          <span className={`priority ${report.priority}`}>
                            {report.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${report.status}`}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleReportAction(report._id, 'warn_user')}
                              className="btn-warn"
                            >
                              Warn User
                            </button>
                            <button 
                              onClick={() => handleReportAction(report._id, 'ban_user')}
                              className="btn-ban"
                            >
                              Ban User
                            </button>
                            <button 
                              onClick={() => handleReportAction(report._id, 'delete_content')}
                              className="btn-delete"
                            >
                              Delete Content
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-content">
            <h2>Profile Settings</h2>
            <p>Profile settings functionality is available. Navigate to the Profile Settings page to update your account information.</p>
            <button 
              onClick={() => window.location.href = '/admin/profile'}
              className="btn-approve"
              style={{ marginTop: '1rem' }}
            >
              Go to Profile Settings
            </button>
          </div>
        )}
      </main>
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="modal-overlay">
          <div className="property-modal">
            <div className="modal-header">
              <h2>{selectedProperty.isUpdateRequest ? 'Property Update Request Details' : 'Property Details'}</h2>
              <button onClick={closePropertyDetails} className="close-btn">&times;</button>
            </div>
            <div className="modal-content">
              {selectedProperty.isUpdateRequest && (
                <div className="update-request-details">
                  <h3>Proposed Updates</h3>
                  {/* Render proposed updates here, comparing with original if available */}
                  <p>Displaying proposed changes for property ID: {selectedProperty._id}</p>
                  {/* You'll need to fetch the original property details here to compare */}
                </div>
              )}

              <div className="property-image-large">
                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                  <img src={`http://localhost:5002/${selectedProperty.images[0]}`} alt={selectedProperty.title} />
                ) : (
                  <div className="placeholder-image-large">No Image Available</div>
                )}
              </div>
              <div className="property-details-full">
                <div className="price-section">
                  <h3>${selectedProperty.price?.toLocaleString()}</h3>
                  <span className="listing-type">{selectedProperty.listingType}</span>
                </div>
                
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Property Type:</strong> {selectedProperty.propertyType}
                  </div>
                  <div className="detail-item">
                    <strong>Bedrooms:</strong> {selectedProperty.details?.bedrooms}
                  </div>
                  <div className="detail-item">
                    <strong>Bathrooms:</strong> {selectedProperty.details?.bathrooms}
                  </div>
                  <div className="detail-item">
                    <strong>Area:</strong> {selectedProperty.details?.area} sq ft
                  </div>
                  <div className="detail-item">
                    <strong>Year Built:</strong> {selectedProperty.details?.yearBuilt}
                  </div>
                  <div className="detail-item">
                    <strong>Parking:</strong> {selectedProperty.details?.parking ? 'Yes' : 'No'}
                  </div>
                </div>
                
                <div className="address-section">
                  <h4>Location</h4>
                  <p>
                    {selectedProperty.location?.address?.street}, {selectedProperty.location?.address?.city}, {selectedProperty.location?.address?.state} {selectedProperty.location?.address?.zipCode}
                  </p>
                </div>
                
                <div className="description-section">
                  <h4>Description</h4>
                  <p>{selectedProperty.description}</p>
                </div>
                
                <div className="amenities-section">
                  <h4>Amenities</h4>
                  <div className="amenities-list">
                    {selectedProperty.amenities?.map((amenity, index) => (
                      <span key={index} className="amenity-tag">{amenity}</span>
                    ))}
                  </div>
                </div>
                
                <div className="owner-section">
                  <h4>Owner Information</h4>
                  <p>
                    <strong>Name:</strong> {selectedProperty.ownerId?.name}<br />
                    <strong>Email:</strong> {selectedProperty.ownerId?.email}<br />
                    <strong>Phone:</strong> {selectedProperty.ownerId?.phone}
                  </p>
                </div>
                
                <div className="action-buttons modal-actions">
                  {selectedProperty.isUpdateRequest ? (
                    <>
                      <button 
                        onClick={() => handlePropertyUpdateAction(selectedProperty._id, 'approve', selectedProperty.propertyId._id, selectedProperty.proposedUpdates)}
                        className="btn-approve"
                      >
                        Approve Update
                      </button>
                      <button 
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            handlePropertyUpdateAction(selectedProperty._id, 'reject', selectedProperty.propertyId._id, null, reason);
                          }
                        }}
                        className="btn-reject"
                      >
                        Reject Update
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handlePropertyAction(selectedProperty._id, 'approve')}
                        className="btn-approve"
                      >
                        Approve Property
                      </button>
                      <button 
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            handlePropertyAction(selectedProperty._id, 'reject', reason);
                          }
                        }}
                        className="btn-reject"
                      >
                        Reject Property
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;