import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './MyListings.css';

const MyListings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const response = await fetchWithAuth('/api/owner/properties');
      const data = await response.json();

      if (data.success) {
        const list = data.data?.properties || data.properties || [];
        setProperties(list);
      } else {
        setError(data.message || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to connect to server. Please try again.');
    } finally { setLoading(false); }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      setStatusUpdateLoading(prev => ({ ...prev, [propertyId]: true }));
      const token = localStorage.getItem('token');
      const body = { status: newStatus };
      if (['sold','rented','inactive'].includes(newStatus)) body.isActive = false;
      if (newStatus === 'approved') body.isActive = true;

      const response = await fetchWithAuth(`/api/owner/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'X-Update-Intent': 'owner-status-update' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setProperties(properties.map(p => p._id === propertyId ? { ...p, status: newStatus, isActive: body.isActive ?? p.isActive } : p));
      } else {
        alert(data.message || 'Failed to update property status');
      }
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Failed to update property status. Please try again.');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [propertyId]: false }));
    }
  };

  const confirmDelete = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`/api/owner/properties/${propertyToDelete._id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setProperties(properties.filter(p => p._id !== propertyToDelete._id));
        setShowDeleteModal(false);
        setPropertyToDelete(null);
      } else { alert(data.message || 'Failed to delete property'); }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property. Please try again.');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Available';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      case 'inactive': return 'Unavailable';
      case 'pending': return 'Pending Approval';
      case 'rejected': return 'Rejected';
      default: return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-active';
      case 'sold':
      case 'rented': return 'status-completed';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-inactive';
      default: return 'status-default';
    }
  };

  const renderStatusOptions = (property) => {
    const statusOptions = [
      { value: 'approved', label: 'Available' },
      { value: 'sold', label: 'Sold' },
      { value: 'rented', label: 'Rented' },
      { value: 'inactive', label: 'Unavailable' }
    ];

    if (property.status === 'pending' || property.status === 'rejected') {
      return (
        <div className="status-pending-message">
          <FaExclamationTriangle />
          <span>{property.status === 'pending' ? 'Awaiting admin approval' : 'Rejected by admin'}</span>
        </div>
      );
    }

    return (
      <select value={property.status} onChange={(e) => handleStatusChange(property._id, e.target.value)} disabled={statusUpdateLoading[property._id]} className="status-selector">
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  };

  if (loading) {
    return (
      <div className="my-listings-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your properties...</p>
      </div>
    );
  }

  return (
    <div className="my-listings-container">
      <div className="listings-header">
        <h1>My Listings</h1>
        <Link to="/owner/create-property" className="add-property-btn">+ Add New Property</Link>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchProperties} className="retry-btn">Retry</button>
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No Properties Yet</h3>
          <p>You haven't listed any properties. Add your first property to get started!</p>
          <Link to="/owner/create-property" className="empty-action-btn">Add Property</Link>
        </div>
      )}

      {properties.length > 0 && (
        <div className="property-list">
          {properties.map(property => (
            <div key={property._id} className="property-card">
              <div className="property-image">
                <img 
                  src={property.images && property.images.length > 0 ? 
                    (property.images[0].url?.startsWith('http') ? property.images[0].url : `http://localhost:5002${property.images[0].url}`) : 
                    '/placeholder-property.jpg'} 
                  alt={property.title} 
                  onError={(e) => { e.target.src = '/placeholder-property.jpg'; }}
                />
                <div className={`property-status ${getStatusClass(property.status)}`}>
                  {getStatusLabel(property.status)}
                </div>
              </div>
              <div className="property-details">
                <h3>{property.title}</h3>
                <p className="property-location">{property.location?.address?.city}, {property.location?.address?.state}</p>
                <p className="property-price">${property.price?.toLocaleString()}</p>
                <div className="property-meta">
                  <span>{property.details?.bedrooms} Beds</span>
                  <span>{property.details?.bathrooms} Baths</span>
                  <span>{property.details?.area?.size} {property.details?.area?.unit}</span>
                </div>
              </div>
              <div className="property-actions">
                <div className="status-control">
                  <label>Status:</label>
                  {renderStatusOptions(property)}
                </div>
                <div className="action-buttons">
                  <Link to={`/owner/property/${property._id}`} className="action-btn view-btn"><FaEye /> View</Link>
                  <Link to={`/owner/edit-property/${property._id}`} className="action-btn edit-btn"><FaEdit /> Edit</Link>
                  <button className="action-btn delete-btn" onClick={() => confirmDelete(property)}><FaTrash /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{propertyToDelete?.title}</strong>?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowDeleteModal(false); setPropertyToDelete(null); }}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Delete Property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;