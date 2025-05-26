import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAppContext } from '../../context/AppContext';
import CartSidebar from './CartSidebar';

const FloatingCart: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated } = useAppContext();

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  if (!isAuthenticated) {
    return null; // No mostrar si el usuario no está autenticado
  }

  return (
    <>
      {/* Botón flotante del carrito */}
      <div className="fixed right-5 bottom-20 z-40">
        <button 
          className="bg-green-1 text-white p-3 rounded-full shadow-lg hover:bg-green-0-9 transition-colors flex items-center justify-center"
          onClick={toggleCart}
          aria-label="Carrito de compras"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar del carrito */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default FloatingCart; 