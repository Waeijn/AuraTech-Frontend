export const API_BASE_URL = 'http://localhost:8082/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  ME: '/me',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id) => `/products/${id}`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: (id) => `/categories/${id}`,
  
  // Cart
  CART: '/cart',
  CART_ADD: '/cart/add',
  CART_UPDATE: (id) => `/cart/items/${id}`,
  CART_REMOVE: (id) => `/cart/items/${id}`,
  CART_CLEAR: '/cart/clear',
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id) => `/orders/${id}`,
  CHECKOUT: '/orders/checkout',
  CANCEL_ORDER: (id) => `/orders/${id}/cancel`,
};
