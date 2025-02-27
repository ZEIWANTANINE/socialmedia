import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:6789', // Replace with your API base URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;