import api from './api';
import { CartItem } from '../context/CartContext';

/**
 * Service for managing the shopping cart interactions with the backend
 */
export const cartService = {
  /**
   * Get the current user's cart 
   */
  async getCart(): Promise<{ items: CartItem[], totalItems: number, totalPrice: number }> {
    try {
      const response = await api.get('/cart');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Return empty cart if there's an error
      return { items: [], totalItems: 0, totalPrice: 0 };
    }
  },

  /**
   * Add an item to the cart
   */
  async addToCart(productId: string, quantity: number): Promise<boolean> {
    try {
      await api.post('/cart/items', { productId, quantity });
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
  },

  /**
   * Update the quantity of a cart item
   */
  async updateCartItem(productId: string, quantity: number): Promise<boolean> {
    try {
      await api.put(`/cart/items/${productId}`, { quantity });
      return true;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
  },

  /**
   * Remove an item from the cart
   */
  async removeFromCart(productId: string): Promise<boolean> {
    try {
      await api.delete(`/cart/items/${productId}`);
      return true;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      return false;
    }
  },

  /**
   * Clear the entire cart
   */
  async clearCart(): Promise<boolean> {
    try {
      await api.delete('/cart/items');
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }
}; 