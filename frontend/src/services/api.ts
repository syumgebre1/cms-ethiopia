import axios from 'axios';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  Report,
  CreateReportInput,
  User,
} from '../types';

// ==================== Axios Instance ====================
const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
});

// ==================== Request Interceptor ====================
// Attaches the JWT to every outgoing request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Response Interceptor ====================
// Auto-redirect to /login on 401/403
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    if ([401, 403].includes(status) && !url.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ==================== Auth APIs ====================
export const authApi = {
  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const res = await API.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginInput): Promise<AuthResponse> => {
    const res = await API.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  me: async (): Promise<{ data: { user: User } }> => {
    const res = await API.get('/auth/me');
    return res.data;
  },
};

// ==================== Report APIs ====================
export const reportApi = {
  create: async (data: CreateReportInput): Promise<{ data: { report: Report } }> => {
    const res = await API.post('/reports', data);
    return res.data;
  },

  getMine: async (): Promise<{ data: { reports: Report[] } }> => {
    const res = await API.get('/reports/me');
    return res.data;
  },

  getAll: async (): Promise<{ data: { reports: Report[] } }> => {
    const res = await API.get('/reports/all');
    return res.data;
  },
};

export default API;