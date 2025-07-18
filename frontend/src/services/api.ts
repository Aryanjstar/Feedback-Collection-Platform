import axios from 'axios';
import { Form } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const formsAPI = {
  createForm: async (formData: Partial<Form>) => {
    const response = await api.post('/forms', formData);
    return response.data;
  },

  getForms: async () => {
    const response = await api.get('/forms');
    return response.data;
  },

  getForm: async (formId: string) => {
    const response = await api.get(`/forms/${formId}`);
    return response.data;
  },

  getPublicForm: async (publicUrl: string) => {
    const response = await api.get(`/forms/public/${publicUrl}`);
    return response.data;
  },

  updateForm: async (formId: string, formData: Partial<Form>) => {
    const response = await api.put(`/forms/${formId}`, formData);
    return response.data;
  },

  deleteForm: async (formId: string) => {
    const response = await api.delete(`/forms/${formId}`);
    return response.data;
  },
};

export const responsesAPI = {
  submitResponse: async (publicUrl: string, answers: any[]) => {
    const response = await api.post(`/responses/${publicUrl}`, { answers });
    return response.data;
  },

  getResponses: async (formId: string, page = 1, limit = 20) => {
    const response = await api.get(`/responses/form/${formId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  exportResponses: async (formId: string) => {
    const response = await api.get(`/responses/form/${formId}/export`, {
      responseType: 'blob',
    });
    return response;
  },

  deleteResponse: async (responseId: string) => {
    const response = await api.delete(`/responses/${responseId}`);
    return response.data;
  },
};

export default api;
