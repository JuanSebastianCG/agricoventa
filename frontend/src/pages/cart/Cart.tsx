import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import { useCart } from '../../context/CartContext';
import { useAppContext } from '../../context/AppContext';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { isAuthenticated, user } = useAppContext();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle changing quantity of a product
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  // Handle removing an item from the cart
  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  // Handle checkout process
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { returnUrl: '/cart' } });
      return;
    }

    setIsProcessing(true);
    // Simulate checkout process (would connect to backend in production)
    setTimeout(() => {
      clearCart();
      navigate('/mis-pedidos');
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Carrito de Compras</h1>

        {totalItems === 0 ? (
          <Card className="text-center py-12">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto text-gray-0-5 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <p className="text-gray-1 text-lg mb-4">Tu carrito está vacío</p>
            <StyledButton 
              variant="primary" 
              onClick={() => navigate('/mercado-general')}
            >
              Explorar productos
            </StyledButton>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th scope="col" className="text-left text-sm font-medium text-gray-1 px-6 py-4">
                          Producto
                        </th>
                        <th scope="col" className="text-center text-sm font-medium text-gray-1 px-6 py-4">
                          Precio
                        </th>
                        <th scope="col" className="text-center text-sm font-medium text-gray-1 px-6 py-4">
                          Cantidad
                        </th>
                        <th scope="col" className="text-right text-sm font-medium text-gray-1 px-6 py-4">
                          Subtotal
                        </th>
                        <th scope="col" className="text-center text-sm font-medium text-gray-1 px-6 py-4">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name} 
                                  className="h-12 w-12 object-cover rounded mr-4" 
                                />
                              ) : (
                                <div className="h-12 w-12 bg-gray-200 rounded mr-4 flex items-center justify-center text-gray-0-5">
                                  No img
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-gray-0-5">{item.unitMeasure}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center text-sm text-gray-900 px-6 py-4 whitespace-nowrap">
                            {item.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                          </td>
                          <td className="text-center text-sm text-gray-900 px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button 
                                className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="mx-2 w-8 text-center">{item.quantity}</span>
                              <button 
                                className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="text-right text-sm text-gray-900 px-6 py-4 whitespace-nowrap font-medium">
                            {(item.price * item.quantity).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                          </td>
                          <td className="text-center text-sm text-gray-900 px-6 py-4 whitespace-nowrap">
                            <button 
                              className="text-red-1 hover:text-red-700"
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t">
                  <StyledButton 
                    variant="outline" 
                    onClick={() => navigate('/mercado-general')}
                    className="text-sm"
                  >
                    Continuar comprando
                  </StyledButton>
                  <StyledButton 
                    variant="outline" 
                    onClick={() => clearCart()}
                    className="text-sm ml-2 text-red-1 border-red-1 hover:bg-red-50"
                  >
                    Vaciar carrito
                  </StyledButton>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-1">Productos ({totalItems})</span>
                      <span>{totalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-1">Envío</span>
                      <span>Calculado al finalizar</span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-green-1 text-lg">
                          {totalPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <StyledButton 
                    variant="primary" 
                    className="w-full"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                  >
                    {isProcessing ? 'Procesando...' : 'Proceder al pago'}
                  </StyledButton>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-1 mt-2 text-center">
                      Necesitas <a href="/login" className="text-green-1 hover:underline">iniciar sesión</a> para completar tu compra
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart; 