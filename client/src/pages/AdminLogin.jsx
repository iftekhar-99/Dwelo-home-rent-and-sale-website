import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5001/api/admin/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        setMessage('Admin login successful! Redirecting to dashboard...');
        
        // Store admin data and token in localStorage
        localStorage.setItem('admin', JSON.stringify(response.data.data.admin));
        localStorage.setItem('adminToken', response.data.data.token);
        
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setMessage(response.data.message || 'Admin login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setMessage(errorData.errors.join(', '));
        } else {
          setMessage(errorData.message || 'Admin login failed');
        }
      } else if (error.code === 'ECONNREFUSED') {
        setMessage('Cannot connect to server. Please check if the server is running.');
      } else {
        setMessage('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Admin Access</h2>
        <p className="auth-subtitle">Sign in to Dwelo Admin Dashboard</p>
        
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter admin email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter admin password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Need help? Contact system administrator</p>
          <p><a href="/">← Back to main site</a></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 