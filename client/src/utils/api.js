import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002',
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

    const currentPath = window.location.pathname || '';
    const url = (config?.url || '').toString();

    const isOwnerContext = currentPath.startsWith('/owner') || url.startsWith('/api/owner');
    const isAdminContext = currentPath.startsWith('/admin') || url.startsWith('/api/admin');

    if (isOwnerContext) {
      if (ownerToken) config.headers.Authorization = `Bearer ${ownerToken}`;
      else if (token) config.headers.Authorization = `Bearer ${token}`;
      else if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (isAdminContext) {
      if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
      else if (token) config.headers.Authorization = `Bearer ${token}`;
      else if (ownerToken) config.headers.Authorization = `Bearer ${ownerToken}`;
    } else {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      else if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
      else if (ownerToken) config.headers.Authorization = `Bearer ${ownerToken}`;
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
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
  const url = `${baseURL}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  const ownerToken = localStorage.getItem('ownerToken');

  const isFormData = options?.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  // Only set JSON content-type when body is not FormData and content-type not already provided
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  const currentPath = window.location.pathname || '';
  const isOwnerContext = currentPath.startsWith('/owner') || endpoint.startsWith('/api/owner');
  const isAdminContext = currentPath.startsWith('/admin') || endpoint.startsWith('/api/admin');

  if (isOwnerContext) {
    if (ownerToken) headers.Authorization = `Bearer ${ownerToken}`;
    else if (token) headers.Authorization = `Bearer ${token}`;
    else if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
  } else if (isAdminContext) {
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    else if (token) headers.Authorization = `Bearer ${token}`;
    else if (ownerToken) headers.Authorization = `Bearer ${ownerToken}`;
  } else {
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    else if (ownerToken) headers.Authorization = `Bearer ${ownerToken}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};