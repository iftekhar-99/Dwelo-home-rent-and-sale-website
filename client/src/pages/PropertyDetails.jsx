import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaHeart } from 'react-icons/fa';
import './PropertyDetails.css';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/properties/${id}?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Fix image URLs to work with the uploads directory
        const property = data.data.property;
        if (property.images && Array.isArray(property.images)) {
          property.images = property.images.map(img => {
            if (typeof img === 'string') {
              return img.startsWith('/') ? img : `/${img}`;
            }
            return img.url || img;
          });
        }
        setProperty(property);
      } else {
        setError(data.message || 'Failed to fetch property details');
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError('Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };



  const handleEdit = () => {
    // Check if user is the owner before allowing edit
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Handle case where ownerId might be an object with _id property
    const ownerId = property?.ownerId?._id || property?.ownerId;
    const currentUserId = currentUser?._id;
    
    if (property && ownerId && currentUserId && ownerId === currentUserId) {
      navigate(`/owner/edit-property/${id}`);
    } else {
      alert('You do not have permission to edit this property');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Property deleted successfully');
        navigate('/owner/dashboard');
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
      <div className="property-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-details-error">
        <h2>Property Not Found</h2>
        <p>The property you're looking for doesn't exist.</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  // Check if current user is the property owner
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = (property?.ownerId?._id || property?.ownerId) === currentUser._id;

  return (
    <div className="property-details">
      <div className="property-details-header">
        <button onClick={() => navigate('/owner/dashboard')} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="property-actions">
          <button onClick={handleEdit} className="edit-btn">
            <FaEdit /> Edit
          </button>
          <button onClick={handleDelete} className="delete-btn">
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      <div className="property-details-content">
        <div className="property-images-section">
          {property.images && property.images.length > 0 ? (
            <div className="property-image-gallery">
              <div className="main-image">
                <img 
                  src={typeof property.images[0] === 'string' ? 
                    (property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5002${property.images[0]}`) : 
                    (property.images[0].url.startsWith('http') ? property.images[0].url : `http://localhost:5002${property.images[0].url}`)} 
                  alt={`${property.title}`}
                  onError={(e) => {
                    console.log('Image failed to load:', e.target.src);
                    e.target.src = '/placeholder-property.jpg';
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="no-images">
              <img src="/placeholder-property.jpg" alt="No image available" />
            </div>
          )}
        </div>

        <div className="property-info-section">
          <div className="property-header">
            <h1>{property.title}</h1>
            <span className={`status-badge status-${property.status}`}>
              {property.status.toUpperCase()}
            </span>
          </div>

          <div className="property-price">
            <h2>${Number(property.price ?? 0).toLocaleString()}</h2>
            <span className="listing-type">{property.listingType === 'sale' ? 'For Sale' : 'For Rent'}</span>
          </div>

          <div className="property-location">
            <h3>Location</h3>
            <p>
              {property.location?.address?.street && `${property.location.address.street}, `}
              {property.location?.address?.city && `${property.location.address.city}, `}
              {property.location?.address?.state && `${property.location.address.state} `}
              {property.location?.address?.zipCode && property.location.address.zipCode}
            </p>
          </div>

          <div className="property-details-grid">
            <div className="detail-item">
              <span className="label">Property Type</span>
              <span className="value">{property.propertyType}</span>
            </div>
            {property.details?.bedrooms && (
              <div className="detail-item">
                <span className="label">Bedrooms</span>
                <span className="value">{property.details.bedrooms}</span>
              </div>
            )}
            {property.details?.bathrooms && (
              <div className="detail-item">
                <span className="label">Bathrooms</span>
                <span className="value">{property.details.bathrooms}</span>
              </div>
            )}
            {property.details?.area?.size && (
              <div className="detail-item">
                <span className="label">Area</span>
                <span className="value">{property.details.area.size} {property.details.area.unit}</span>
              </div>
            )}
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div className="property-amenities">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {property.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="property-description">
            <h3>Description</h3>
            <p>{property.description}</p>
          </div>

          <div className="property-stats">
            <div className="stat-item">
              <FaEye />
              <span>{property.views || 0} views</span>
            </div>
            <div className="stat-item">
              <FaHeart />
              <span>{property.favorites?.length || 0} favorites</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;