
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout to prevent long-hanging requests
  timeout: 10000
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Is the backend server running?', error);
      return Promise.reject(new Error('Cannot connect to server. Please check your connection or try again later.'));
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// WhatsApp API calls
export const sendWhatsAppMessage = (to: string, body: string) => {
  return api.post('/whatsapp/send-message', { to, body });
};

export const sendWhatsAppVoucher = (to: string, voucherCode: string) => {
  return api.post('/whatsapp/send-voucher', { to, voucherCode });
};

export const sendWhatsAppTransactionStatus = (to: string, transaction: any) => {
  return api.post('/whatsapp/send-transaction-status', { to, transaction });
};

export const sendWhatsAppPackageStatus = (to: string, packageInfo: any) => {
  return api.post('/whatsapp/send-package-status', { to, packageInfo });
};

export const sendWhatsAppSubscriptionStatus = (to: string, subscription: any) => {
  return api.post('/whatsapp/send-subscription-status', { to, subscription });
};

export default api;
