import { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const productService = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`${API_ENDPOINTS.PRODUCTS}?${query}`);
  },

  getById: (id) => api.get(API_ENDPOINTS.PRODUCT_DETAIL(id)),
  
  create: (data) => api.post(API_ENDPOINTS.PRODUCTS, data),
  
  update: (id, data) => api.put(API_ENDPOINTS.PRODUCT_DETAIL(id), data),
  
  delete: (id) => api.delete(API_ENDPOINTS.PRODUCT_DETAIL(id)),
};

