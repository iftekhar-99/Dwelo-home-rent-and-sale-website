import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const ownerToken = localStorage.getItem('ownerToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (ownerToken) {
      config.headers.Authorization = `Bearer ${ownerToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('ownerToken');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('owner');
      
      // Redirect to appropriate login page
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/owner')) {
        window.location.href = '/owner/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function for fetch requests with proper base URL
export const fetchWithAuth = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';
  const url = `${baseURL}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  const ownerToken = localStorage.getItem('ownerToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  } else if (ownerToken) {
    headers.Authorization = `Bearer ${ownerToken}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};