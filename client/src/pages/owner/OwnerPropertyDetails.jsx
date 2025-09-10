import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaHeart, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './OwnerPropertyDetails.css';

const OwnerPropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/owner/properties/${id}`);
      
      if (response.success) {
        setProperty(response.data.property);
      } else {
        setError(response.message || 'Failed to fetch property details');
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError('Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/owner/edit-property/${id}`);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetchWithAuth(`/api/owner/properties/${id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        navigate('/owner/properties', { 
          state: { message: 'Property deleted successfully' } 
        });
      } else {
        setError(response.message || 'Failed to delete property');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      setError('Failed to delete property. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { icon: FaClock, class: 'status-pending', text: 'Pending Approval' },
      'approved': { icon: FaCheckCircle, class: 'status-approved', text: 'Approved' },
      'rejected': { icon: FaTimesCircle, class: 'status-rejected', text: 'Rejected' },
      'sold': { icon: FaCheckCircle, class: 'status-sold', text: 'Sold' },
      'rented': { icon: FaCheckCircle, class: 'status-rented', text: 'Rented' },
      'inactive': { icon: FaTimesCircle, class: 'status-inactive', text: 'Inactive' }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const IconComponent = config.icon;

    return (
      <span className={`status-badge ${config.class}`}>
        <IconComponent /> {config.text}
      </span>
    );
  };

  const formatAddress = (property) => {
    if (property.location?.address) {
      const addr = property.location.address;
      return `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}`;
    }
    return property.address || 'Address not available';
  };

  if (loading) {
    return (
      <div className="owner-property-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-property-details-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/owner/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="owner-property-details-error">
        <h2>Property Not Found</h2>
        <p>The property you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/owner/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="owner-property-details">
      <div className="property-header">
        <button onClick={() => navigate('/owner/dashboard')} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div className="property-actions">
          <button onClick={handleEdit} className="edit-btn">
            <FaEdit /> Edit Property
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="delete-btn">
            <FaTrash /> Delete Property
          </button>
        </div>
      </div>

      <div className="property-content">
        <div className="property-images-section">
          {property.images && property.images.length > 0 ? (
            <div className="property-image-gallery">
              <div className="main-image">
                <img 
                  src={typeof property.images[0] === 'string' ? 
                    (property.images[0].startsWith('http') ? property.images[0] : `http://localhost:5002${property.images[0]}`) : 
                    (property.images[0].url.startsWith('http') ? property.images[0].url : `http://localhost:5002${property.images[0].url}`)} 
                  alt={property.title}
                  onError={(e) => { e.target.src = '/placeholder-property.jpg'; }}
                />
              </div>
              {property.images.length > 1 && (
                <div className="thumbnail-images">
                  {property.images.slice(1, 5).map((image, index) => (
                    <img 
                      key={index}
                      src={typeof image === 'string' ? 
                        (image.startsWith('http') ? image : `http://localhost:5002${image}`) : 
                        (image.url.startsWith('http') ? image.url : `http://localhost:5002${image.url}`)} 
                      alt={`${property.title} ${index + 2}`}
                      onError={(e) => { e.target.src = '/placeholder-property.jpg'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-images">
              <img src="/placeholder-property.jpg" alt="No image available" />
            </div>
          )}
        </div>

        <div className="property-info-section">
          <div className="property-header-info">
            <div className="title-status">
              <h1>{property.title}</h1>
              {getStatusBadge(property.status)}
            </div>
            <div className="property-price">
              <span className="price">${property.price?.toLocaleString() || 'N/A'}</span>
              <span className="listing-type">{property.listingType === 'rent' ? 'For Rent' : 'For Sale'}</span>
            </div>
          </div>

          <div className="property-location">
            <FaMapMarkerAlt />
            <span>{formatAddress(property)}</span>
          </div>

          <div className="property-specs">
            <div className="spec-item">
              <FaBed />
              <span>{property.details?.bedrooms || property.bedrooms || 0} Bedrooms</span>
            </div>
            <div className="spec-item">
              <FaBath />
              <span>{property.details?.bathrooms || property.bathrooms || 0} Bathrooms</span>
            </div>
            <div className="spec-item">
              <FaRulerCombined />
              <span>{property.details?.area?.size || property.squareFootage || 'N/A'} sqft</span>
            </div>
          </div>

          <div className="property-metrics">
            <div className="metric-item">
              <FaEye />
              <span>{property.views || 0} Views</span>
            </div>
            <div className="metric-item">
              <FaHeart />
              <span>{property.favorites?.length || 0} Favorites</span>
            </div>
            <div className="metric-item">
              <FaCalendarAlt />
              <span>Listed {new Date(property.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="property-description">
            <h3>Description</h3>
            <p>{property.description}</p>
          </div>

          {property.amenities && property.amenities.length > 0 && (
            <div className="property-amenities">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {property.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {property.approvalDetails && property.status === 'rejected' && (
            <div className="rejection-details">
              <h3>Rejection Details</h3>
              <p><strong>Reason:</strong> {property.approvalDetails.rejectionReason}</p>
              {property.approvalDetails.adminNotes && (
                <p><strong>Admin Notes:</strong> {property.approvalDetails.adminNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Property</h3>
            <p>Are you sure you want to delete this property? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="cancel-btn"
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="confirm-delete-btn"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPropertyDetails;