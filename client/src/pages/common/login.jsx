import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../utils/api';
import './Auth.css';

const Login = () => {
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
      const response = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const responseData = await response.json();

      if (responseData.success) {
        setMessage('Login successful! Redirecting...');
        
        // Store user data and token in localStorage
        localStorage.setItem('user', JSON.stringify(responseData.data.user));
        localStorage.setItem('token', responseData.data.token);
        
        // Redirect based on user role
        const userRole = responseData.data.user.role;
        let redirectPath = '/'; // Default to home or a common landing if no specific role match
        
        if (userRole === 'admin') {
          redirectPath = '/admin/dashboard';
        } else if (userRole === 'owner') {
          redirectPath = '/owner/dashboard';
        } else if (userRole === 'buyer') {
          redirectPath = '/buyer/dashboard';
        } else if (userRole === 'renter') {
          redirectPath = '/renter/dashboard';
        }
        
        setTimeout(() => {
          navigate(redirectPath);
        }, 1500);
      } else {
        setMessage(responseData.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.status && error.status >= 400) {
        try {
          const errorData = await error.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            setMessage(errorData.errors.join(', '));
          } else {
            setMessage(errorData.message || 'Login failed');
          }
        } catch {
          setMessage('Login failed. Please try again.');
        }
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
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Dwelo account</p>
        
        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
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
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <a href="/reg">Sign Up</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
