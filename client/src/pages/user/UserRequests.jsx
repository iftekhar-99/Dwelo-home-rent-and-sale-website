import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaCalendar, FaDollarSign, FaEye } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './UserRequests.css';

const UserRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetchWithAuth('/api/property-requests/user');

      const data = await response.json();
      if (response.ok && data.success) {
        setRequests(data.data.requests);
      } else {
        setError(data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Pending' },
      accepted: { class: 'status-accepted', text: 'Accepted' },
      rejected: { class: 'status-rejected', text: 'Rejected' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getRequestTypeIcon = (type) => {
    return type === 'buy' ? <FaDollarSign /> : <FaCalendar />;
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (loading) {
    return (
      <div className="user-requests-loading">
        <div className="loading-spinner"></div>
        <p>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div className="user-requests">
      <div className="requests-header">
        <button onClick={() => {
          const userRole = localStorage.getItem('role');
          navigate(userRole === 'buyer' ? '/buyer/dashboard' : '/renter/dashboard');
        }} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>My Property Requests</h1>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchRequests} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="requests-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted ({requests.filter(r => r.status === 'accepted').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      <div className="requests-list">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <div className="request-info">
                  <h3>{request.property?.title || 'Property'}</h3>
                  <div className="request-meta">
                    <span className="owner-name">
                      Owner: {request.owner?.name || 'Unknown Owner'}
                    </span>
                    <span className="request-date">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="request-status">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              <div className="request-details">
                <div className="request-type">
                  {getRequestTypeIcon(request.requestType)}
                  <span>{request.requestType === 'buy' ? 'Purchase' : 'Rental'} Request</span>
                </div>
                
                {request.offerAmount && (
                  <div className="offer-amount">
                    <FaDollarSign />
                    <span>Offer: ${request.offerAmount.toLocaleString()}</span>
                  </div>
                )}
                
                {request.preferredMoveInDate && (
                  <div className="move-in-date">
                    <FaCalendar />
                    <span>Move-in: {new Date(request.preferredMoveInDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="request-message">
                <p><strong>Your Message:</strong></p>
                <p>{request.message}</p>
              </div>

              {request.status !== 'pending' && request.responseMessage && (
                <div className="owner-response">
                  <p><strong>Owner's Response:</strong></p>
                  <p>{request.responseMessage}</p>
                </div>
              )}

              <div className="request-actions">
                <button 
                  onClick={() => handleViewDetails(request)}
                  className="view-btn"
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Requests Found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't made any property requests yet."
                : `No ${filter} requests found.`
              }
            </p>
            <Link to="/properties" className="browse-properties-btn">
              Browse Properties
            </Link>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="details-modal">
            <div className="modal-header">
              <h2>Request Details</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="request-summary">
                <h3>Property Information</h3>
                <div className="summary-item">
                  <strong>Property:</strong> {selectedRequest.property?.title}
                </div>
                <div className="summary-item">
                  <strong>Owner:</strong> {selectedRequest.owner?.name}
                </div>
                <div className="summary-item">
                  <strong>Type:</strong> {selectedRequest.requestType === 'buy' ? 'Purchase' : 'Rental'}
                </div>
                <div className="summary-item">
                  <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                </div>
                {selectedRequest.offerAmount && (
                  <div className="summary-item">
                    <strong>Offer Amount:</strong> ${selectedRequest.offerAmount.toLocaleString()}
                  </div>
                )}
                {selectedRequest.preferredMoveInDate && (
                  <div className="summary-item">
                    <strong>Preferred Move-in:</strong> {new Date(selectedRequest.preferredMoveInDate).toLocaleDateString()}
                  </div>
                )}
                <div className="summary-item">
                  <strong>Request Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="message-section">
                <h3>Your Message</h3>
                <div className="message-content">
                  <p>{selectedRequest.message}</p>
                </div>
              </div>

              {selectedRequest.status !== 'pending' && selectedRequest.responseMessage && (
                <div className="response-section">
                  <h3>Owner's Response</h3>
                  <div className="response-content">
                    <p>{selectedRequest.responseMessage}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="pending-notice">
                  <p>Your request is currently being reviewed by the property owner. You'll be notified when they respond.</p>
                </div>
              )}

              {selectedRequest.status === 'accepted' && (
                <div className="accepted-notice">
                  <p>🎉 Your request has been accepted! The owner will contact you soon to proceed with the next steps.</p>
                </div>
              )}

              {selectedRequest.status === 'rejected' && (
                <div className="rejected-notice">
                  <p>Your request was not accepted. You can browse other properties or try again later.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRequests;
