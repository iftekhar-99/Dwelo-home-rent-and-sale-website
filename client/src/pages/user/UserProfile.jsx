import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: ''
  });
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileData({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        preferences: parsedUser.preferences || ''
      });
    }
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
      // In a real application, you would send this data to the server
      // For now, we'll just update the local storage
      const updatedUser = {
        ...user,
        name: profileData.name,
        phone: profileData.phone,
        preferences: profileData.preferences
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowProfileEdit(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (!user) {
    return <div>Loading profile...</div>;
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
        </div>
      )}
    </section>
  );
};

export default UserProfile;