// This is a backup of the original Cart page component
// It's been renamed to CartPage to avoid conflicts with the new cart sidebar approach

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { useCart } from '../../context/CartContext';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAppContext();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
      setQuantities({...quantities, [productId]: newQuantity.toString()});
    }
  };

  const handleQuantityInputChange = (productId: string, value: string) => {
    setQuantities({...quantities, [productId]: value});
  };

  const handleQuantityInputBlur = (productId: string) => {
    const newQuantity = parseInt(quantities[productId] || '0', 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    } else {
      // Reset to current quantity if invalid input
      const item = items.find(item => item.productId === productId);
      if (item) {
        setQuantities({...quantities, [productId]: item.quantity.toString()});
      }
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleCheckout = () => {
    if (!user || !user.id) {
      // Redirect to login without alert
      navigate('/login');
      return;
    }
    
    // Remove the confirmation dialog and proceed directly
    // Create an array of cart items formatted for the API
    const orderItems = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    
    // Set loading state to show processing
    setIsProcessing(true);
    
    // Call the API to create an order
    api.post('/orders', {
      items: orderItems,
      paymentMethod: 'CASH', // Default payment method
      buyerUserId: user.id,
      notes: 'Orden realizada desde la página web'
    })
    .then(response => {
      if (response.data.success) {
        // Clear the cart after successful order creation
        clearCart();
        // Navigate to the order details page without alert
        navigate(`/pedidos/${response.data.data.id}`);
      } else {
        throw new Error(response.data.error?.message || 'Error al procesar el pedido');
      }
    })
    .catch(error => {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Error desconocido';
      // Log error without alert
      console.error(`Error al procesar el pedido: ${errorMessage}`);
    })
    .finally(() => {
      setIsProcessing(false);
    });
  };

  const handleContinueShopping = () => {
    navigate('/mercado-general');
  };

  const shippingCost = totalPrice > 0 ? 12000 : 0;
  const totalWithShipping = totalPrice + shippingCost;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tu Carrito de Compras</h1>
          <p className="text-gray-1 mt-1">{totalItems} productos en tu carrito</p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-6">Parece que no has agregado ningún producto a tu carrito todavía.</p>
            <button
              onClick={handleContinueShopping}
              className="bg-green-1 hover:bg-green-0-9 text-white py-3 px-6 rounded-md shadow-sm transition-colors"
            >
              Explorar Productos
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side - Cart Items */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex flex-col md:flex-row border-b py-6 last:border-b-0 last:pb-0 first:pt-0">
                    {/* Product Image */}
                    <div className="md:w-32 h-32 flex-shrink-0 mb-4 md:mb-0">
                      {item.imageUrl ? (
                        <img
                          className="w-full h-full object-cover rounded-md"
                          src={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="md:ml-6 flex-grow">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Vendedor: {item.sellerName || 'Agricultor verificado'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Stock disponible: {typeof item.stockQuantity === 'number' && item.stockQuantity !== 999 
                              ? item.stockQuantity 
                              : 'Disponible'}
                          </p>
                        </div>
                        <div className="text-right mt-2 md:mt-0">
                          <p className="text-lg font-bold">
                            {(item.price * item.quantity).toLocaleString('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.price.toLocaleString('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                              minimumFractionDigits: 0
                            })}/{item.unitMeasure}
                          </p>
                        </div>
                      </div>
                      
                      {/* Quantity controls and remove button */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() => handleQuantityChange(item.productId, Math.max(1, item.quantity - 1))}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                            aria-label="Decrease quantity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                            </svg>
                          </button>
                          <input
                            type="text"
                            value={quantities[item.productId] !== undefined ? quantities[item.productId] : item.quantity}
                            onChange={(e) => handleQuantityInputChange(item.productId, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(item.productId)}
                            className="w-12 py-1 text-center focus:outline-none focus:ring-0 border-none"
                            aria-label="Quantity"
                          />
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            className={`px-3 py-1 text-gray-600 hover:text-gray-800 ${(item.stockQuantity !== 999 && item.quantity >= (Number(item.stockQuantity) || 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label="Increase quantity"
                            disabled={item.stockQuantity !== 999 && item.quantity >= (Number(item.stockQuantity) || 0)}
                            title={item.stockQuantity !== 999 && item.quantity >= (Number(item.stockQuantity) || 0) ? 'Stock máximo alcanzado' : ''}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-1 hover:text-red-600 text-sm flex items-center"
                          aria-label="Remove item"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          Eliminar
                        </button>
                      </div>
                      {item.stockQuantity !== 999 && item.quantity === Number(item.stockQuantity) && Number(item.stockQuantity) > 0 && (
                        <p className="text-sm text-yellow-1 mt-2">
                          Cantidad máxima disponible alcanzada
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de la Compra</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {totalPrice.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío estimado</span>
                    <span className="font-medium">
                      {shippingCost.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-green-1">
                      {totalWithShipping.toLocaleString('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                {/* Shipping info */}
                <div className="bg-green-0-4 p-4 rounded-md mb-6">
                  <div className="flex items-start">
                    <div className="text-green-1 mr-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="text-sm text-green-1">
                      Tiempo estimado de entrega: 10-25 dias hábiles
                    </p>
                  </div>
                </div>

                {/* Security notice */}
                <div className="mb-6">
                  <div className="flex items-center text-gray-600 text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Recuerda que todos los pagos son protegidos y verificados
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-1 hover:bg-green-0-9 text-white py-3 px-4 rounded-md shadow-sm transition-colors font-medium"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </span>
                    ) : 'Finalizar Compra'}
                  </button>
                  <button
                    onClick={handleContinueShopping}
                    className="w-full bg-white border border-green-1 text-green-1 hover:bg-green-0-4 py-3 px-4 rounded-md transition-colors font-medium"
                    disabled={isProcessing}
                  >
                    Seguir Comprando
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPage; 