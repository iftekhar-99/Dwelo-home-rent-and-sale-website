import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  // Removed update requests (owner edits now apply immediately)
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
      const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  // Single list for new property approvals only
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
      const metricsResponse = await api.get('/api/admin/dashboard');
      setMetrics(metricsResponse.data.data);

      const pendingPropertiesResponse = await api.get('/api/admin/properties/pending');
      setPendingProperties(pendingPropertiesResponse.data.data.properties);

      const allPropertiesResponse = await api.get('/api/admin/properties/all');
      setAllProperties(allPropertiesResponse.data.data.properties);
      // Update requests removed
      const reportsResponse = await api.get('/api/admin/reports/pending');
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
      await axios.put(`/api/admin/properties/${propertyId}/approve`, { action, reason }, { headers });
      fetchDashboardData();
      setSelectedProperty(null);
    } catch (error) {
      console.error('Error handling property action:', error);
    }
  };

  // Update request handler removed

  const viewPropertyDetails = (property) => {
    setSelectedProperty({ ...property });
  };

  const closePropertyDetails = () => setSelectedProperty(null);

  const handleReportAction = async (reportId, action, details = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      await api.put(`/api/admin/reports/${reportId}/handle`, { action, details });
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

      {/* NEW: Rebuilt and renamed admin navigation (topbar) */}
      <nav className="admin-topbar" role="navigation" aria-label="Admin primary">
        <div className="admin-topbar-inner">
          <div className="topbar-group">
            <button
              type="button"
              className={`topbar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>



            <button
              type="button"
              className={`topbar-item ${activeTab === 'allProperties' ? 'active' : ''}`}
              onClick={() => setActiveTab('allProperties')}
            >
              All Properties
            </button>

            <button
              type="button"
              className={`topbar-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Reports{pendingReports?.length ? ` (${pendingReports.length})` : ''}
            </button>

            <button
              type="button"
              className={`topbar-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      <main className="admin-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
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





        {activeTab === 'allProperties' && (
          <div className="properties-content">
            <h2>All Properties</h2>
            {allProperties.length === 0 ? (
              <p>No properties available.</p>
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
                    {allProperties.map(property => (
                      <tr key={property._id}>
                        <td>{property.title}</td>
                        <td>{property.ownerId?.userId?.name || 'Unknown'}</td>
                        <td>{property.propertyType}</td>
                        <td>${property.price?.toLocaleString()}</td>
                        <td>
                          <span className={`status ${property.status}`}>{property.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => viewPropertyDetails(property)} className="btn-view">View Details</button>
                            {property.status === 'pending' && (
                              <>
                                <button onClick={() => handlePropertyAction(property._id, 'approve')} className="btn-approve">Approve</button>
                                <button onClick={() => { const reason = prompt('Enter rejection reason:'); if (reason) handlePropertyAction(property._id, 'reject', reason); }} className="btn-reject">Reject</button>
                              </>
                            )}
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
                        <td><span className={`priority ${report.priority}`}>{report.priority}</span></td>
                        <td><span className={`status ${report.status}`}>{report.status}</span></td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleReportAction(report._id, 'warn_user')} className="btn-warn">Warn User</button>
                            <button onClick={() => handleReportAction(report._id, 'ban_user')} className="btn-ban">Ban User</button>
                            <button onClick={() => handleReportAction(report._id, 'delete_content')} className="btn-delete">Delete Content</button>
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
            <button onClick={() => window.location.href = '/admin/profile'} className="btn-view" style={{ marginTop: '1rem' }}>Go to Profile Settings</button>
          </div>
        )}
      </main>

      {selectedProperty && (
        <div className="modal-overlay">
          <div className="property-modal">
            <div className="modal-header">
              <h2>Property Details</h2>
              <button onClick={closePropertyDetails} className="close-btn">&times;</button>
            </div>
            <div className="modal-content">
              {selectedProperty.isUpdateRequest && (
                <div className="update-request-details">
                  <h3>Proposed Updates</h3>
                  <p>Displaying proposed changes for property ID: {selectedProperty._id}</p>
                </div>
              )}

              <div className="property-image-large">
                {selectedProperty.images && selectedProperty.images.length > 0 ? (
                  <div className="image-gallery">
                    <img src={
                      typeof selectedProperty.images[0] === 'string'
                        ? `http://localhost:5002${selectedProperty.images[0].startsWith('/') ? selectedProperty.images[0] : '/' + selectedProperty.images[0]}`
                        : (selectedProperty.images[0].url?.startsWith('http')
                            ? selectedProperty.images[0].url
                            : `http://localhost:5002${selectedProperty.images[0].url?.startsWith('/') ? selectedProperty.images[0].url : '/' + (selectedProperty.images[0].url || selectedProperty.images[0])}`)
                    } alt={selectedProperty.title} />
                    {selectedProperty.images.length > 1 && (
                      <div className="image-count">
                        +{selectedProperty.images.length - 1} more images
                      </div>
                    )}
                  </div>
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
                  <div className="detail-item"><strong>Property Type:</strong> {selectedProperty.propertyType}</div>
                  <div className="detail-item"><strong>Status:</strong> <span className={`status-badge ${selectedProperty.status}`}>{selectedProperty.status}</span></div>
                  <div className="detail-item"><strong>Bedrooms:</strong> {selectedProperty.details?.bedrooms}</div>
                  <div className="detail-item"><strong>Bathrooms:</strong> {selectedProperty.details?.bathrooms}</div>
                  <div className="detail-item"><strong>Area:</strong> {selectedProperty.details?.area?.size || selectedProperty.details?.area} {selectedProperty.details?.area?.unit || 'sq ft'}</div>
                  <div className="detail-item"><strong>Year Built:</strong> {selectedProperty.details?.yearBuilt}</div>
                  <div className="detail-item"><strong>Parking:</strong> {selectedProperty.details?.parking || 'None'}</div>
                  <div className="detail-item"><strong>Views:</strong> {selectedProperty.views || 0}</div>
                  <div className="detail-item"><strong>Listed Date:</strong> {new Date(selectedProperty.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="address-section">
                  <h4>Location</h4>
                  <p>{selectedProperty.location?.address?.street}, {selectedProperty.location?.address?.city}, {selectedProperty.location?.address?.state} {selectedProperty.location?.address?.zipCode}</p>
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
                    <strong>Name:</strong> {selectedProperty.ownerId?.userId?.name || 'Unknown'}<br />
                    <strong>Email:</strong> {selectedProperty.ownerId?.userId?.email || 'Unknown'}<br />
                    <strong>Phone:</strong> {selectedProperty.ownerId?.userId?.phone || 'Unknown'}
                  </p>
                </div>
                <div className="action-buttons modal-actions">
                  {selectedProperty.status === 'pending' && (
                    <>
                      <button onClick={() => handlePropertyAction(selectedProperty._id, 'approve')} className="btn-approve">Approve Property</button>
                      <button onClick={() => { const reason = prompt('Enter rejection reason:'); if (reason) handlePropertyAction(selectedProperty._id, 'reject', reason); }} className="btn-reject">Reject Property</button>
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