import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";

export const cartService = {
  // Retrieve the current user's cart
  get: () => api.get(API_ENDPOINTS.CART),

  // Add a product to the cart with specified quantity
  add: (productId, quantity) =>
    api.post(API_ENDPOINTS.CART_ADD, { product_id: productId, quantity }),

  // Update the quantity of a specific cart item
  update: (cartItemId, quantity) =>
    api.put(API_ENDPOINTS.CART_UPDATE(cartItemId), { quantity }),

  // Remove a specific item from the cart
  remove: (cartItemId) => api.delete(API_ENDPOINTS.CART_REMOVE(cartItemId)),

  // Clear all items from the cart
  clear: () => api.delete(API_ENDPOINTS.CART_CLEAR),
};
