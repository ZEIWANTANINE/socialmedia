import axios from 'axios';
import BASE_URL from './api';

// Tạo instance của axios với URL cơ sở
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Quan trọng để gửi cookie
});

// Thêm interceptor để tự động thêm token vào mọi request
axiosInstance.interceptors.request.use(
  config => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('jwtToken');
    
    // Debug
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Thêm token vào header nếu có
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Thêm token vào query parameter cho một số endpoint cụ thể nếu cần
      if (config.url?.includes('/ws') || config.url?.includes('/messages/chat')) {
        // Đối với URL là một string
        if (typeof config.url === 'string') {
          const separator = config.url.includes('?') ? '&' : '?';
          config.url = `${config.url}${separator}token=${encodeURIComponent(token)}`;
        }
      }
    } else {
      console.warn(`No token found for request to ${config.url}`);
    }
    
    return config;
  },
  error => {
    // Xử lý lỗi khi tạo request
    console.error('Error creating request:', error);
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response
axiosInstance.interceptors.response.use(
  response => {
    // Xử lý response thành công
    console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  error => {
    // Xử lý response lỗi
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        // Token hết hạn hoặc không hợp lệ
        console.error('Authentication error:', error.response.data);
        
        // Xóa token và chuyển hướng đến trang đăng nhập nếu đang ở trình duyệt
        if (typeof window !== 'undefined') {
          // Kiểm tra xem người dùng đã đăng nhập hay chưa
          const isLoggedIn = localStorage.getItem('jwtToken') !== null;
          
          if (isLoggedIn) {
            console.warn('Token is invalid or expired. Redirecting to login page...');
            
            // Xóa token và thông tin người dùng
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userId');
            
            // Chuyển hướng đến trang đăng nhập nếu không phải đang ở trang đăng nhập
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
      }
    } else if (error.request) {
      // Không nhận được response
      console.error(`[API Network Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    } else {
      // Lỗi khác
      console.error(`[API Error] ${error.message}`);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;