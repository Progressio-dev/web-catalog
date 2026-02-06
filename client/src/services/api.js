import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect to login if the user is on an admin page
      // This prevents redirects when public users try to access the home page
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
};

// CSV API
export const csvAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('csv', file);
    return api.post('/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// PDF API
export const pdfAPI = {
  generate: (data) => api.post('/generate-pdf', data, { responseType: 'blob' }),
};

// Logo API
export const logoAPI = {
  getAll: () => api.get('/logos'),
  get: (id) => api.get(`/logos/${id}`),
  create: (file, name) => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('name', name);
    return api.post('/logos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => api.put(`/logos/${id}`, data),
  delete: (id) => api.delete(`/logos/${id}`),
};

// Template API
export const templateAPI = {
  getAll: () => api.get('/templates'),
  get: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (settings) => api.put('/settings', settings),
};

export default api;
