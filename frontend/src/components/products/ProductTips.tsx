import React from 'react';
import Card from '../ui/Card';

const ProductTips: React.FC = () => {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips para Mejores Ventas</h2>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-1">
              Agrega imágenes claras y de alta calidad de tus productos
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-1">
              Usa etiquetas de calidad para destacar tus productos
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            <svg className="h-5 w-5 text-green-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-1">
              Mantén tus precios actualizados según el mercado
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-md font-medium text-gray-900 mb-2">Acceso Rápido</h3>
        <ul className="space-y-2">
          <li>
            <a href="/estadisticas" className="text-sm text-green-1 hover:text-green-0-9 flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estadísticas de Ventas
            </a>
          </li>
          <li>
            <a href="/rendimiento" className="text-sm text-green-1 hover:text-green-0-9 flex items-center">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ver el rendimiento de tus productos
            </a>
          </li>
        </ul>
      </div>
    </Card>
  );
};

export default ProductTips; 