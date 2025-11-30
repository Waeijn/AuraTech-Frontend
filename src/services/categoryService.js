javascriptimport { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const categoryService = {
  getAll: () => api.get(API_ENDPOINTS.CATEGORIES),
  
  getById: (id) => api.get(API_ENDPOINTS.CATEGORY_DETAIL(id)),
  
  create: (data) => api.post(API_ENDPOINTS.CATEGORIES, data),
  
  update: (id, data) => api.put(API_ENDPOINTS.CATEGORY_DETAIL(id), data),
  
  delete: (id) => api.delete(API_ENDPOINTS.CATEGORY_DETAIL(id)),
};
