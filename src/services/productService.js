import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";

export const productService = {
  // Retrieve all products with optional query parameters (e.g., pagination, filters)
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`${API_ENDPOINTS.PRODUCTS}?${query}`);
  },

  // Retrieve a single product by its ID
  getById: (id) => api.get(API_ENDPOINTS.PRODUCT_DETAIL(id)),

  // Create a new product with the given data
  create: (data) => api.post(API_ENDPOINTS.PRODUCTS, data),

  // Update an existing product by its ID with new data
  update: (id, data) => api.put(API_ENDPOINTS.PRODUCT_DETAIL(id), data),

  // Delete a product by its ID
  delete: (id) => api.delete(API_ENDPOINTS.PRODUCT_DETAIL(id)),
};
