import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminProfileSettings.css';

const AdminProfileSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5001/api/admin/profile', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.data.success) {
        const adminData = response.data.data.admin;
        setAdmin(adminData);
        setFormData({
          name: adminData.userId.name || '',
          email: adminData.userId.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setMessage('Failed to load admin profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const updateData = {};

      if (formData.name.trim() && formData.name !== admin.userId.name) {
        updateData.name = formData.name.trim();
      }
      if (formData.email.trim() && formData.email !== admin.userId.email) {
        updateData.email = formData.email.trim();
      }
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('http://localhost:5001/api/admin/profile', updateData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setAdmin(response.data.data.admin);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!admin) {
    return <div className="admin-profile-settings"><div className="loading">Loading profile...</div></div>;
  }

  return (
    <div className="admin-profile-settings">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        <p>Update your account information and password</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="profile-card">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>Account Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Change Password</h3>
            <p className="section-description">
              Leave password fields empty if you don't want to change your password
            </p>

            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={isLoading}>
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfileSettings; 