import { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import { saveAuth } from '../utils/auth';

export const authService = {
  register: async (data) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, data);
    saveAuth(response.data.token, response.data.user);
    return response;
  },

  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    saveAuth(response.data.token, response.data.user);
    return response;
  },

  logout: async () => {
    await api.post(API_ENDPOINTS.LOGOUT);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  me: () => api.get(API_ENDPOINTS.ME),
};
