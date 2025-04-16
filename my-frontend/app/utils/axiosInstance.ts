import axios from 'axios';
import { apiEndpoints } from "./api";
const axiosInstance = axios.create({
  baseURL: 'http://localhost:6789', // Replace with your API base URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    console.log("Token from localStorage513:", token);
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