import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaEnvelope, FaPhone, FaCalendar, FaDollarSign } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './OwnerRequests.css';

const OwnerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);
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

      const response = await fetchWithAuth('/api/property-requests/owner');

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

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const handleCloseModal = () => {
    setShowResponseModal(false);
    setSelectedRequest(null);
    setResponseMessage('');
  };

  const handleRespondToRequest = async (status) => {
    if (!selectedRequest) return;

    setResponding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth(`/api/property-requests/${selectedRequest._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          responseMessage: responseMessage.trim() || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Update the request in the list
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req._id === selectedRequest._id 
              ? { ...req, status, responseMessage: responseMessage.trim() || undefined }
              : req
          )
        );
        
        alert(`Request ${status === 'accepted' ? 'accepted' : 'rejected'} successfully`);
        handleCloseModal();
      } else {
        alert(data.message || `Failed to ${status} request`);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to respond to request');
    } finally {
      setResponding(false);
    }
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
      <div className="owner-requests-loading">
        <div className="loading-spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="owner-requests">
      <div className="requests-header">
        <button onClick={() => navigate('/owner/dashboard')} className="back-btn">
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>Property Requests</h1>
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
                    <span className="requester-name">
                      {request.requester?.name || 'Unknown User'}
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
                <p><strong>Message:</strong></p>
                <p>{request.message}</p>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    onClick={() => handleViewRequest(request)}
                    className="view-btn"
                  >
                    View Details
                  </button>
                </div>
              )}

              {request.status !== 'pending' && request.responseMessage && (
                <div className="response-message">
                  <p><strong>Your Response:</strong></p>
                  <p>{request.responseMessage}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Requests Found</h3>
            <p>
              {filter === 'all' 
                ? "You don't have any property requests yet."
                : `No ${filter} requests found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="response-modal">
            <div className="modal-header">
              <h2>Respond to Request</h2>
              <button onClick={handleCloseModal} className="close-btn">&times;</button>
            </div>
            
            <div className="modal-content">
              <div className="request-summary">
                <h3>Request Details</h3>
                <div className="summary-item">
                  <strong>Property:</strong> {selectedRequest.property?.title}
                </div>
                <div className="summary-item">
                  <strong>Requester:</strong> {selectedRequest.requester?.name}
                </div>
                <div className="summary-item">
                  <strong>Type:</strong> {selectedRequest.requestType === 'buy' ? 'Purchase' : 'Rental'}
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
                  <strong>Message:</strong>
                  <p>{selectedRequest.message}</p>
                </div>
              </div>

              <div className="response-form">
                <label>Your Response Message (Optional)</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Add a personal message to your response..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => handleRespondToRequest('rejected')}
                  className="reject-btn"
                  disabled={responding}
                >
                  <FaTimes /> Reject Request
                </button>
                <button
                  onClick={() => handleRespondToRequest('accepted')}
                  className="accept-btn"
                  disabled={responding}
                >
                  <FaCheck /> Accept Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerRequests;
