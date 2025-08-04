import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
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
      const metricsResponse = await axios.get('http://localhost:5001/api/admin/dashboard', { headers });
      setMetrics(metricsResponse.data.data);

      // Fetch pending properties
      const propertiesResponse = await axios.get('http://localhost:5001/api/admin/properties/pending', { headers });
      setPendingProperties(propertiesResponse.data.data.properties);

      // Fetch pending reports
      const reportsResponse = await axios.get('http://localhost:5001/api/admin/reports/pending', { headers });
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

      await axios.put(`http://localhost:5001/api/admin/properties/${propertyId}/approve`, {
        action,
        reason
      }, { headers });

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling property action:', error);
    }
  };

  const handleReportAction = async (reportId, action, details = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`http://localhost:5001/api/admin/reports/${reportId}/handle`, {
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
          Properties ({pendingProperties.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({pendingReports.length})
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
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
            <h2>Pending Properties</h2>
            
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
    </div>
  );
};

export default AdminDashboard; 