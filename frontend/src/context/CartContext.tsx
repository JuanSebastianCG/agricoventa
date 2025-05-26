import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the type for cart items
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unitMeasure: string;
  imageUrl?: string;
  sellerName?: string;
  stockQuantity: number;
}

// Define the context type
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// Create the context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => false,
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Check if user is logged in
    const authToken = localStorage.getItem('auth_token');
    
    // If no auth token exists, return empty cart
    if (!authToken) {
      return [];
    }
    
    // Load cart from localStorage on initial render
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return [];
    
    try {
      const parsedCart = JSON.parse(savedCart);
      
      // Validate that parsed items have the required stockQuantity field
      // If any items don't have stockQuantity, it's safer to clear the cart
      const isValid = Array.isArray(parsedCart) && parsedCart.every(
        (item: any) => typeof item.stockQuantity === 'number'
      );
      
      return isValid ? parsedCart : [];
    } catch (e) {
      console.error('Error parsing cart from localStorage:', e);
      return [];
    }
  });

  // Check auth status changes to clear cart if user logs out
  useEffect(() => {
    const handleStorageChange = () => {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        // User logged out, clear the cart in state
        setItems([]);
      }
    };

    // Listen for storage events (like logout in another tab)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Calculate total items and price
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Add an item to the cart
  const addItem = (itemToAdd: Omit<CartItem, 'id'>) => {
    // Ensure stockQuantity is a number, default to 0 if not provided or invalid
    const stockQty = typeof itemToAdd.stockQuantity === 'number' && !isNaN(itemToAdd.stockQuantity) ? 
      itemToAdd.stockQuantity : 0;
    
    // Block if explicitly 0 or negative
    if (stockQty <= 0) {
      console.error('Cannot add product with no stock:', itemToAdd.name);
      return false; // Return false to indicate failure
    }
    
    setItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === itemToAdd.productId
      );

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Calculate new quantity, but don't exceed stock
        const newQuantity = existingItem.quantity + 1;
        if (newQuantity <= stockQty) {
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            stockQuantity: stockQty // Update stock quantity in case it changed
          };
          return updatedItems;
        } else {
          // Stock limit reached
          console.log(`Cannot add more items. Available stock: ${stockQty}`);
          return prevItems;
        }
      } else {
        // Item doesn't exist, add new item with validated stockQuantity
        return [...prevItems, { 
          ...itemToAdd, 
          id: `${Date.now()}`, 
          quantity: 1,
          stockQuantity: stockQty
        }];
      }
    });
    
    return true; // Return true to indicate success
  };

  // Remove an item from the cart
  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  // Update the quantity of an item
  const updateQuantity = (productId: string, quantity: number) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      const itemIndex = updatedItems.findIndex(item => item.productId === productId);
      
      if (itemIndex >= 0) {
        const item = updatedItems[itemIndex];
        
        // Validate quantity against stock
        const stockQty = typeof item.stockQuantity === 'number' && !isNaN(item.stockQuantity) ?
          item.stockQuantity : 0; // Default to 0 if undefined/invalid
        
        if (quantity <= stockQty) {
          updatedItems[itemIndex] = { ...item, quantity };
          return updatedItems;
        } else {
          // Limit to maximum available stock
          console.log(`Cannot add more items. Available stock: ${stockQty}`);
          updatedItems[itemIndex] = { ...item, quantity: stockQty };
          return updatedItems;
        }
      }
      
      return updatedItems;
    });
  };

  // Clear the cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext; 