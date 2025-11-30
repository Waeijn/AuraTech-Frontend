import { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const orderService = {
  getAll: () => api.get(API_ENDPOINTS.ORDERS),
  
  getById: (id) => api.get(API_ENDPOINTS.ORDER_DETAIL(id)),
  
  checkout: (data) => api.post(API_ENDPOINTS.CHECKOUT, data),
  
  cancel: (id) => api.post(API_ENDPOINTS.CANCEL_ORDER(id)),
};