import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Auth.css';

// Get API base URL from environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    phone: '',
    verificationDocs: null
  });

  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });
  
  const navigate = useNavigate();

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character (@$!%*?&)');
    }

    return { score, feedback };
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
    
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, PDF and DOC files are allowed');
        return;
      }
      
      setFormData(prev => ({ ...prev, verificationDocs: file }));
      setFilePreview(file.name);
      setError(''); // Clear any previous errors
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, verificationDocs: null }));
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      
      // Validate password strength
      if (passwordStrength.score < 3) { // Reduced from 5 to 3 for easier registration
        setError('Please choose a stronger password');
        setIsLoading(false);
        return;
      }
      
      // Validate role
      const validRoles = ['buyer', 'renter', 'owner'];
      if (!validRoles.includes(formData.role)) {
        setError('Please select a valid role');
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('phone', formData.phone);
      
      // Append verification docs for owner role
      if (formData.role === 'owner' && formData.verificationDocs) {
        formDataToSend.append('verificationDocs', formData.verificationDocs);
      }
      
      console.log('Sending registration data to:', `${API_BASE}/api/auth/register`);
      
      // Send registration request
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header when sending FormData
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store tokens and user data
      if (data.token) {
        if (formData.role === 'owner') {
          localStorage.setItem('ownerToken', data.token);
          localStorage.setItem('owner', JSON.stringify(data.user));
        } else if (formData.role === 'admin') {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('admin', JSON.stringify(data.user));
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      
      // Redirect based on role
      if (formData.role === 'owner') {
        navigate('/owner/login');
      } else if (formData.role === 'admin') {
        navigate('/admin/login');
      } else {
        navigate('/login');
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    if (passwordStrength.score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>
      <p>Join Dwelo to find your perfect home</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-control"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="form-control"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handlePasswordChange}
            className="form-control"
            placeholder="Enter your password"
            required
          />
          {formData.password && (
            <div className="password-feedback">
              <div className="strength-meter">
                <div 
                  className="strength-bar" 
                  style={{ 
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.score < 3 ? '#ff4d4d' : 
                                    passwordStrength.score < 4 ? '#ffad4d' : '#4CAF50'
                  }}
                ></div>
              </div>
              <p className="strength-text">{getPasswordStrengthText()}</p>
              {passwordStrength.feedback.length > 0 && (
                <ul>
                  {passwordStrength.feedback.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="form-control"
            placeholder="Confirm your password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="form-control"
            placeholder="Enter your phone number (optional)"
          />
        </div>

        <div className="form-group">
          <label>Role *</label>
          <select 
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="role-select"
            required
          >
            <option value="buyer">Buyer</option>
            <option value="renter">Renter</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        {formData.role === 'owner' && (
          <div className="form-group file-upload">
            <label>Verification Documents *</label>
            <p className="file-help">Please upload a valid ID proof (JPG, PNG, PDF, DOC)</p>
            {!filePreview ? (
              <div className="upload-box">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                />
                <span>Choose File</span>
              </div>
            ) : (
              <div className="file-preview">
                <span>{filePreview}</span>
                <button type="button" onClick={removeFile} className="remove-file">
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={isLoading || passwordStrength.score < 3}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default Register;
