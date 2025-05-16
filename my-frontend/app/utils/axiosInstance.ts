import axios from 'axios';
import BASE_URL from './api';

// Create an axios instance with base URL
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies
});

// Add interceptor to automatically add token to every request
axiosInstance.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('jwtToken');
    
    // Debug log for API requests
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to header if available
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // For WebSocket endpoints, we'll let the WebSocketService handle the auth
      // rather than modifying the URL here to avoid conflicts
      if (config.url?.includes('/ws')) {
        console.log('WebSocket request detected - token will be handled by WebSocketService');
      }
    } else {
      console.warn(`No token found for request to ${config.url}`);
    }
    
    return config;
  },
  error => {
    // Handle request creation errors
    console.error('Error creating request:', error);
    return Promise.reject(error);
  }
);

// Add interceptor to handle responses
axiosInstance.interceptors.response.use(
  response => {
    // Handle successful responses
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    // Handle error responses
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        // Token expired or invalid
        console.error('Authentication error:', error.response.data);
        
        // Remove token and redirect to login page if in browser
        if (typeof window !== 'undefined') {
          // Check if user is logged in
          const isLoggedIn = localStorage.getItem('jwtToken') !== null;
          
          if (isLoggedIn) {
            console.warn('Token is invalid or expired. Redirecting to login page...');
            
            // Remove token and user info
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userId');
            
            // Redirect to login page if not already there
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
      }
    } else if (error.request) {
      // No response received
      console.error(`[API Network Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    } else {
      // Other errors
      console.error(`[API Error] ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;