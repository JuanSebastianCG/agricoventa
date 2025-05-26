import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

const NotFound: React.FC = () => {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <h1 className="text-6xl font-bold text-green-1 mb-6">404</h1>
        <h2 className="text-2xl font-medium text-gray-1 mb-8">Página no encontrada</h2>
        <p className="text-gray-1 mb-8 text-center max-w-md">
          La página que estás buscando no existe o ha sido movida.
        </p>
        <Link 
          to="/" 
          className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-6 rounded-md font-medium"
        >
          Volver al inicio
        </Link>
      </div>
    </>
  );
};

export default NotFound; 