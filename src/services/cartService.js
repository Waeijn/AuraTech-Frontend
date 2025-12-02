import { api } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const cartService = {
  get: () => api.get(API_ENDPOINTS.CART),
  
  add: (productId, quantity) => 
    api.post(API_ENDPOINTS.CART_ADD, { product_id: productId, quantity }),
  
  update: (cartItemId, quantity) => 
    api.put(API_ENDPOINTS.CART_UPDATE(cartItemId), { quantity }),
  
  remove: (cartItemId) => api.delete(API_ENDPOINTS.CART_REMOVE(cartItemId)),
  
  clear: () => api.delete(API_ENDPOINTS.CART_CLEAR),
};
