import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || 'N/A'; // Example: Get orderId from navigation state

  return (
    <div className="container mx-auto p-6 text-center">
      <div className="bg-green-0-4 p-8 rounded-lg shadow-xl max-w-md mx-auto">
        <svg className="w-16 h-16 text-green-1 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-3xl font-bold text-green-1 mb-3">¡Pedido Confirmado!</h1>
        <p className="text-gray-700 mb-2">
          Gracias por tu compra. Tu pedido ha sido procesado exitosamente.
        </p>
        <p className="text-gray-600 mb-6">
          Número de Pedido: <span className="font-semibold text-gray-800">{orderId}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Recibirás un correo electrónico con los detalles de tu pedido y la información de seguimiento pronto.
        </p>
        <div className="space-y-3">
          <Link 
            to="/mis-pedidos"
            className="block w-full bg-green-1 text-white py-3 px-4 rounded-md hover:bg-green-0-9 transition duration-300"
          >
            Ver Mis Pedidos
          </Link>
          <Link 
            to="/marketplace"
            className="block w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition duration-300"
          >
            Seguir Comprando
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 