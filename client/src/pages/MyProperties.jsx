import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import './MyProperties.css';

const MyProperties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/owner/login');
        return;
      }

      const response = await fetch('/api/owner/properties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProperties(data.data.properties || []);
      } else {
        setError(data.message || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Property deleted successfully');
        fetchProperties(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  if (loading) {
    return (
      <div className="my-properties-loading">
        <div className="loading-spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-properties-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchProperties}>Retry</button>
      </div>
    );
  }

  return (
    <div className="my-properties">
      <div className="properties-header">
        <h1>My Properties</h1>
        <Link to="/owner/create-property" className="add-property-btn">
          <FaPlus /> Add New Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h3>No Properties Yet</h3>
          <p>Start by adding your first property to see it here.</p>
          <Link to="/owner/create-property" className="empty-action-btn">
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map(property => (
            <div key={property._id} className="property-card">
              <div className="property-image">
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
                <span className={`status-badge status-${property.status}`}>
                  {property.status.toUpperCase()}
                </span>
              </div>
              
              <div className="property-info">
                <h3>{property.title}</h3>
                <p className="property-location">
                  {property.location?.address?.city && `${property.location.address.city}, `}
                  {property.location?.address?.state && property.location.address.state}
                </p>
                <p className="property-price">${property.price?.toLocaleString() || '0'}</p>
                
                <div className="property-stats">
                  <span>{property.views || 0} views</span>
                  <span>{property.requests || 0} requests</span>
                </div>
              </div>

              <div className="property-actions">
                <button 
                  onClick={() => navigate(`/owner/property/${property._id}`)}
                  className="view-btn"
                >
                  <FaEye /> View
                </button>
                <button 
                  onClick={() => navigate(`/owner/edit-property/${property._id}`)}
                  className="edit-btn"
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(property._id)}
                  className="delete-btn"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProperties;