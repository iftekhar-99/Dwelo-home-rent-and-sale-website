import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaList, FaBell, FaUser, FaSignOutAlt, FaEnvelope, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa';
import { BsFillHouseDoorFill, BsGraphUp } from 'react-icons/bs';
import { fetchWithAuth } from '../../utils/api';
import './OwnerProfile.css';

const OwnerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profilePhoto: ''
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const sidebarLinks = [
    { icon: <FaHome />, text: 'Dashboard', path: '/owner/dashboard' },
    { icon: <BsFillHouseDoorFill />, text: 'My Properties', path: '/owner/properties' },
    { icon: <FaList />, text: 'My Listings', path: '/owner/listings' },
    { icon: <FaEnvelope />, text: 'Requests', path: '/owner/requests' },
    { icon: <BsGraphUp />, text: 'Analytics', path: '/owner/analytics' },
    { icon: <FaUser />, text: 'Profile', path: '/owner/profile', active: true }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/owner/login');
        return;
      }

      const response = await fetchWithAuth('/api/owner/profile');

      const data = await response.json();

      if (data.success) {
        setProfile(data.data.owner);
        setFormData({
          name: data.data.owner.userId?.name || '',
          phone: data.data.owner.userId?.phone || '',
          profilePhoto: data.data.owner.profilePhoto || ''
        });
      } else {
        setError(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('business.')) {
      const businessField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        businessDetails: {
          ...prev.businessDetails,
          [businessField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithAuth('/api/owner/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data.owner);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset form data to original profile data
    if (profile) {
      setFormData({
        name: profile.userId?.name || '',
        phone: profile.userId?.phone || '',
        profilePhoto: profile.profilePhoto || ''
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/owner/login');
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <BsFillHouseDoorFill className="logo" />
          <h2>Owner Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          {sidebarLinks.map((link, index) => (
            <a
              key={index}
              href={link.path}
              className={`nav-link ${link.active ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.text}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Profile Settings</h1>
            <p>Manage your account information and business details</p>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="edit-profile-btn"
              >
                <FaEdit /> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  onClick={handleSave} 
                  className="save-btn"
                  disabled={saving}
                >
                  <FaSave /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={handleCancel} 
                  className="cancel-btn"
                  disabled={saving}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="profile-main">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <p>{successMessage}</p>
            </div>
          )}

          <div className="profile-container">
            {/* Profile Photo Section */}
            <div className="profile-photo-section">
              <div className="photo-container">
                <div className="profile-photo">
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" />
                  ) : (
                    <FaUser className="default-avatar" />
                  )}
                  {isEditing && (
                    <button className="photo-edit-btn">
                      <FaCamera />
                    </button>
                  )}
                </div>
                <div className="photo-info">
                  <h3>{profile?.userId?.name || 'Owner Name'}</h3>
                  <p>{profile?.userId?.email || 'owner@email.com'}</p>
                  <span className="owner-badge">Property Owner</span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="profile-section">
              <h2>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="form-value">{profile?.userId?.name || 'Not provided'}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="form-value readonly">{profile?.userId?.email || 'Not provided'}</div>
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="form-value">{profile?.userId?.phone || 'Not provided'}</div>
                  )}
                </div>
              </div>
            </div>


          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerProfile;