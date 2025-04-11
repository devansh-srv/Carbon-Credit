import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const login = (credentials) => api.post('/login', credentials);
export const signup = (userData) => api.post('/signup', userData);
export const getNGOCredits = () => api.get('/NGO/credits');
export const createNGOCredit = (creditData) => api.post('/NGO/credits', creditData);
export const getBuyerCredits = () => api.get('/buyer/credits');
export const purchaseCredit = (purchaseData) => api.post('/buyer/purchase', purchaseData);
export const sellCreditApi = (sellData) => api.patch('/buyer/sell', sellData);
export const removeSaleCreditApi = (removeData) => api.patch('/buyer/remove-from-sale', removeData);
export const getPurchasedCredits = () => api.get('/buyer/purchased');
export const getTransactions = () => api.get('/NGO/transactions');
export const generateCertificate = (creditId) => api.get(`/buyer/generate-certificate/${creditId}`);
export const downloadCertificate = (creditId) => api.get(`/buyer/download-certificate/${creditId}`);
export const expireCreditApi = (expireCreditId) => api.patch(`/NGO/credits/expire/${expireCreditId}`);
export const verifyBeforeExpire = (verificationData) => api.post(`/NGO/expire-req`, verificationData);
export const getAssignedCredits = () => api.get('/auditor/credits');
export const auditCreditApi = (auditData) => api.patch(`/auditor/audit/${auditData["creditId"]}`, auditData);
export const checkAuditorsNumber = (amount) => api.get(`/NGO/audit-req`, { params: { amount } });
export const getCreditDetailsAPI = (creditId) => api.get(`/buyer/credits/${creditId}`);

export default api;
