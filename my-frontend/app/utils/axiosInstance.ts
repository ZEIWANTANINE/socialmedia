import axios from 'axios';
import { apiEndpoints } from "./api";

const axiosInstance = axios.create({
  baseURL: 'http://localhost:6789', // Replace with your API base URL
  withCredentials: true, // Quan trọng để gửi cookie khi cần thiết
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Đếm số lần gặp lỗi xác thực liên tiếp
let authErrorCount = 0;
const MAX_AUTH_ERRORS = 3; // Số lỗi tối đa trước khi đăng xuất

// Hàm để lấy token mới nhất từ localStorage
const getAuthToken = () => {
  return localStorage.getItem('jwtToken');
};

// Check if token is fresh (less than 23 hours old)
const isTokenFresh = () => {
  const tokenTimestamp = localStorage.getItem('tokenTimestamp');
  if (!tokenTimestamp) return false;
  
  const now = Date.now();
  const tokenAge = now - parseInt(tokenTimestamp);
  
  // If token is older than 23 hours (assuming token validity is 24 hours)
  return tokenAge <= 82800000; // 23 hours in milliseconds
};

// Kiểm tra xem có phải đang ở trang login/register không
const isAuthPage = () => {
  return window.location.pathname === '/' || 
         window.location.pathname === '/login' || 
         window.location.pathname === '/register';
};

// Add a request interceptor to include the JWT token in all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = getAuthToken();
    
    if (token) {
      // Check if token might be stale
      if (!isTokenFresh() && !config.url?.includes('/auth/check-auth')) {
        console.warn(`Token may be stale for request to ${config.url}`);
        
        // Continue with the request, but mark it for potential refresh
        // The response interceptor will handle 403 errors
      }
      
      // Log that we're adding the token to a request
      console.log(`Adding token to ${config.method?.toUpperCase()} request to ${config.url}`);
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`No token found for request to ${config.url}`);
      
      // If not on auth page and trying to access protected endpoint, redirect to login
      if (!isAuthPage() && 
          !config.url?.includes('/auth/login') && 
          !config.url?.includes('/auth/register') &&
          !config.url?.includes('/auth/check-auth')) {
        console.log("No token for protected route, redirecting to login page");
        window.location.href = '/';
        return Promise.reject(new Error('Authentication required'));
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Đặt lại bộ đếm lỗi xác thực khi có response thành công
    authErrorCount = 0;
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Error response data:', error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        authErrorCount++;
        console.warn(`Authentication error detected (${authErrorCount}/${MAX_AUTH_ERRORS}) - token may be invalid or expired`);
        
        // Check if this might be due to a stale token
        if (!isTokenFresh()) {
          console.warn("Token is stale, may need to refresh");
        }
        
        // After MAX_AUTH_ERRORS consecutive auth errors, clear token and redirect
        if (authErrorCount >= MAX_AUTH_ERRORS && !isAuthPage()) {
          console.log("Too many authentication errors, logging out");
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('tokenTimestamp');
          window.location.href = '/';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } else {
        // Reset auth error count for non-auth errors
        authErrorCount = 0;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error: No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;