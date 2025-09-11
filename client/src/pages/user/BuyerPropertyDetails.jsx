import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaHeart, FaEnvelope, FaPhone, FaBookmark, FaRegBookmark, FaComments, FaHandshake } from 'react-icons/fa';
import { ChatInterface } from "../../components/chat";
import { fetchWithAuth } from '../../utils/api';
import '../common/PropertyDetails.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const BuyerPropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [ownerContact, setOwnerContact] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [requestType, setRequestType] = useState('rent');
  const [offerAmount, setOfferAmount] = useState('');
  const [preferredMoveInDate, setPreferredMoveInDate] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
    checkWishlistStatus();
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        setUserEmail(parsedData.email || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetchWithAuth(`/api/properties/${id}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const property = data.data.property;
        if (property.images && Array.isArray(property.images)) {
          property.images = property.images.map(img => {
            if (typeof img === 'string') return img.startsWith('/') ? img : `/${img}`;
            return img.url || img;
          });
        }
        setProperty(property);
        if (property.ownerId) {
          fetchOwnerContact(property.ownerId._id || property.ownerId);
        } else {
          console.error('Owner information not available');
        }
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

  const fetchOwnerContact = async () => {
    try {
      const response = await fetchWithAuth(`/api/requests/owner-contact/${id}`);
      const data = await response.json();
      if (response.ok && data.success) setOwnerContact(data.ownerContact);
    } catch (error) {
      console.error('Error fetching owner contact:', error);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetchWithAuth(`/api/wishlist/check/${id}`);
      const data = await response.json();
      if (response.ok && data.success) setIsInWishlist(data.data.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      if (isInWishlist) {
        const response = await fetchWithAuth(`/api/wishlist/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok && data.success) { setIsInWishlist(false); alert('Property removed from wishlist'); }
        else { alert(data.message || 'Failed to remove from wishlist'); }
      } else {
        const response = await fetchWithAuth('/api/wishlist/add', {
          method: 'POST',
          body: JSON.stringify({ propertyId: id })
        });
        const data = await response.json();
        if (response.ok && data.success) { setIsInWishlist(true); alert('Property added to wishlist'); }
        else { alert(data.message || 'Failed to add to wishlist'); }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    }
  };

  const handleContactOwner = () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setShowContactModal(true);
  };
  
  const handleStartChat = () => {
    const token = localStorage.getItem('token');
    if (!token) { 
      navigate('/login'); 
      return; 
    }
    
    try {
      // Get owner ID from property data
      const ownerId = property.ownerId?._id || property.ownerId;
      
      if (!ownerId) {
        console.error('Owner ID not available');
        alert('Cannot start chat: owner information not available');
        return;
      }
      
      // Navigate to messages page with property and recipient info as URL parameters
      navigate(`/messages?propertyId=${id}&recipientId=${ownerId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat with owner');
    }
  };

  const handleCloseModal = () => { setShowContactModal(false); setSendSuccess(false); };

  const handleShowRequestModal = () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setShowRequestModal(true);
  };

  const handleCloseRequestModal = () => {
    setShowRequestModal(false);
    setRequestSuccess(false);
    setMessage('');
    setOfferAmount('');
    setPreferredMoveInDate('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const ownerId = property.ownerUserId || property.ownerId?._id || property.ownerId;
      if (!ownerId) { alert('Owner information not available'); setSending(false); return; }
      const requestData = {
        propertyId: id,
        ownerId,
        requestType,
        message,
        offerAmount: offerAmount ? parseFloat(offerAmount) : undefined,
        preferredMoveInDate: preferredMoveInDate || undefined
      };
      const response = await fetchWithAuth('/api/property-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRequestSuccess(true);
        setMessage(''); setOfferAmount(''); setPreferredMoveInDate('');
      } else {
        // Don't show an incorrect failure pop-up; surface server message when present
        console.error('Request failed:', data);
        alert(data.message || 'There was a delay processing your request, please check My Requests.');
      }
    } catch (error) {
      console.error('Error sending property request:', error);
      alert('There was a delay processing your request, please check My Requests.');
    } finally { setSending(false); }
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

  return (
    <div className="property-details">
      <div className="property-details-header">
        <button onClick={() => {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userRole = currentUser?.role;
          let dashboardRoute = '/dashboard';
          
          switch (userRole) {
            case 'buyer':
              dashboardRoute = '/buyer/dashboard';
              break;
            case 'renter':
              dashboardRoute = '/renter/dashboard';
              break;
            case 'owner':
              dashboardRoute = '/owner/dashboard';
              break;
            case 'admin':
              dashboardRoute = '/admin/dashboard';
              break;
            default:
              dashboardRoute = '/dashboard';
          }
          
          navigate(dashboardRoute);
        }} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
      </div>

      <div className="property-details-content">
        <div className="property-images-section">
          {property.images && property.images.length > 0 ? (
            <div className="property-image-gallery">
              <div className="main-image">
                <img 
                  src={typeof property.images[0] === 'string' ? 
                    (property.images[0].startsWith('http') ? property.images[0] : `${API_BASE}${property.images[0]}`) : 
                    (property.images[0].url.startsWith('http') ? property.images[0].url : `${API_BASE}${property.images[0].url}`)} 
                  alt={`${property.title}`}
                  onError={(e) => { e.target.src = '/placeholder-property.jpg'; }}
                />
              </div>
            </div>
          ) : (
            <div className="no-images">
              <img src="/placeholder-property.jpg" alt="No image available" />
            </div>
          )}
          
          <div className="property-action-buttons">
            <button onClick={handleContactOwner} className="contact-owner-btn">
              <FaEnvelope /> Contact Owner
            </button>
            <button onClick={toggleWishlist} className="wishlist-btn">
              {isInWishlist ? <FaBookmark /> : <FaRegBookmark />} {isInWishlist ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleShowRequestModal} className="request-btn">
              <FaHandshake /> Send Request
            </button>
            <button onClick={handleStartChat} className="chat-btn">
              <FaComments /> Chat
            </button>
          </div>
        </div>

        <div className="property-info-section">
          <div className="property-header">
            <h1>{property.title}</h1>
            <span className={`status-badge status-${property.status}`}>
              {property.status.toUpperCase()}
            </span>
          </div>

          <div className="property-price">
            <h2>${property.price?.toLocaleString() || '0'}</h2>
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
                    {amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="property-description">
            <h3>Description</h3>
            <p>{property.description}</p>
          </div>

          {property.details?.yearBuilt && (
            <div className="property-detail-item">
              <h3>Year Built</h3>
              <p>{property.details.yearBuilt}</p>
            </div>
          )}

          {property.details?.parking && (
            <div className="property-detail-item">
              <h3>Parking</h3>
              <p>{property.details.parking.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
          )}

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
      
      {/* Contact Owner Modal (information only) */}
      {showContactModal && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>Contact Property Owner</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>
            <div className="modal-content">
              {ownerContact && (
                <div className="owner-contact-info">
                  <h3>Owner Contact Information</h3>
                  <div className="contact-item">
                    <FaEnvelope />
                    <span>{ownerContact.email}</span>
                  </div>
                  {ownerContact.phone && (
                    <div className="contact-item">
                      <FaPhone />
                      <span>{ownerContact.phone}</span>
                    </div>
                  )}
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <button onClick={handleCloseModal} className="close-success-btn">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="contact-modal request-modal">
            <div className="modal-header">
              <h2>{requestType === 'buy' ? 'Send Purchase Request' : 'Send Rental Request'}</h2>
              <button onClick={handleCloseRequestModal} className="close-btn">&times;</button>
            </div>
            {requestSuccess ? (
              <div className="success-message">
                <h3>Your request has been sent to the owner!</h3>
                <p>They will review your request and get back to you soon.</p>
                <button onClick={handleCloseRequestModal} className="close-success-btn">Close</button>
              </div>
            ) : (
              <div className="modal-content">
                <form onSubmit={handleSubmitRequest}>
                  <div className="form-group">
                    <label>Request Type</label>
                    <div className="request-type-selector">
                      <button type="button" className={`request-type-btn ${requestType === 'rent' ? 'active' : ''}`} onClick={() => setRequestType('rent')}>Rent</button>
                      <button type="button" className={`request-type-btn ${requestType === 'buy' ? 'active' : ''}`} onClick={() => setRequestType('buy')}>Buy</button>
                    </div>
                  </div>

                  {requestType === 'buy' && (
                    <div className="form-group">
                      <label>Offer Amount ($)</label>
                      <input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="Enter your offer amount" min="0" step="1000" />
                    </div>
                  )}

                  {requestType === 'rent' && (
                    <div className="form-group">
                      <label>Preferred Move-in Date</label>
                      <input type="date" value={preferredMoveInDate} onChange={(e) => setPreferredMoveInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Message to Owner</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Write details about your ${requestType === 'buy' ? 'purchase' : 'rental'} request here...`} rows="6" required></textarea>
                  </div>
                  
                  <button type="submit" className="send-message-btn" disabled={sending}>
                    {sending ? 'Sending...' : `Send ${requestType === 'buy' ? 'Purchase' : 'Rental'} Request`}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerPropertyDetails;