import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css'; // Assuming you'll create this file for styling

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: ''
  });
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // Handle unauthenticated user, e.g., redirect to login
          setError('User not authenticated.');
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const fetchedUser = response.data.data.user;
          const fetchedRoleData = response.data.data.roleData;
          setUser(fetchedUser);
          setProfileData({
            name: fetchedUser.name || '',
            email: fetchedUser.email || '',
            phone: fetchedUser.phone || '',
          });
        } else {
          setError(response.data.message || 'Failed to fetch profile.');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const toggleProfileEdit = () => {
    setShowProfileEdit(!showProfileEdit);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      // Only send name and phone for update, as email and role are not editable via this form
      const updateData = {
        name: profileData.name,
        phone: profileData.phone
      };
      const response = await axios.put('/api/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedUser = response.data.data.user;
        // Update local storage and state with the new user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        // Re-fetch profile data to get updated roleData if needed (e.g., preferences)
        // This is a simple approach; for complex scenarios, consider more granular state updates
        const updatedProfileResponse = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (updatedProfileResponse.data.success) {
          const fetchedUser = updatedProfileResponse.data.data.user;
          const fetchedRoleData = updatedProfileResponse.data.data.roleData;
          setProfileData({
            name: fetchedUser.name || '',
            email: fetchedUser.email || '',
            phone: fetchedUser.phone || '',
            preferences: fetchedRoleData && fetchedRoleData.preferences ? fetchedRoleData.preferences : {}
          });
        }
        setShowProfileEdit(false);
        alert('Profile updated successfully!');
      } else {
        alert(response.data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="profile-no-data">No user profile data available.</div>;
  }

  return (
    <section className="profile-section">
      <div className="profile-header">
        <h2>My Profile</h2>
        <button 
          className="edit-profile-btn" 
          onClick={toggleProfileEdit}
        >
          {showProfileEdit ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>
      
      {showProfileEdit ? (
        <div className="profile-edit-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={profileData.name} 
              onChange={handleProfileChange} 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={profileData.email} 
              disabled 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              value={profileData.phone} 
              onChange={handleProfileChange} 
            />
          </div>

          {/* Display preferences for editing if applicable */}
          {user.role === 'buyer' && (
            <div className="form-group">
              <label htmlFor="preferences">Preferences (e.g., Budget, Property Type)</label>
              <textarea
                id="preferences"
                name="preferences"
                value={JSON.stringify(profileData.preferences, null, 2)}
                onChange={handleProfileChange}
                rows="5"
                disabled // For now, disable direct editing of complex preferences
              ></textarea>
            </div>
          )}

          <button className="save-profile-btn" onClick={saveProfile}>Save Profile</button>
        </div>
      ) : (
        <div className="profile-info">
          <div className="info-group">
            <span className="info-label">Name:</span>
            <span className="info-value">{user.name}</span>
          </div>
          
          <div className="info-group">
            <span className="info-label">Email:</span>
            <span className="info-value">{user.email}</span>
          </div>
          
          <div className="info-group">
            <span className="info-label">Phone:</span>
            <span className="info-value">{user.phone || 'Not provided'}</span>
          </div>

          <div className="info-group">
            <span className="info-label">Role:</span>
            <span className="info-value">{user.role}</span>
          </div>

          {/* Display preferences if user is a buyer */}
          {user.role === 'buyer' && profileData.preferences && (
            <div className="info-group">
              <span className="info-label">Preferences:</span>
              <span className="info-value">
                {profileData.preferences.budget && `Budget: $${profileData.preferences.budget.min} - $${profileData.preferences.budget.max}, `}
                {profileData.preferences.propertyType && `Property Type: ${profileData.preferences.propertyType.join(', ')}, `}
                {profileData.preferences.bedrooms && `Bedrooms: ${profileData.preferences.bedrooms.min}-${profileData.preferences.bedrooms.max}, `}
                {profileData.preferences.bathrooms && `Bathrooms: ${profileData.preferences.bathrooms.min}-${profileData.preferences.bathrooms.max}, `}
                {profileData.preferences.location && `Location: ${profileData.preferences.location.city}, ${profileData.preferences.location.state}, `}
                {profileData.preferences.amenities && `Amenities: ${profileData.preferences.amenities.join(', ')}`}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default UserProfile;