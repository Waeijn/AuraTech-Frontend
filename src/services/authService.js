import { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import { saveAuth } from '../utils/auth';

export const authService = {

  // Register a new user and save authentication info
  register: async (data) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, data);
    saveAuth(response.data.token, response.data.user);
    return response;
  },

  // Login an existing user and save authentication info
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    saveAuth(response.data.token, response.data.user);
    return response;
  },

  // Logout the current user and clear local storage
  logout: async () => {
    await api.post(API_ENDPOINTS.LOGOUT);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get the current authenticated user's information
  me: () => api.get(API_ENDPOINTS.ME),
};
