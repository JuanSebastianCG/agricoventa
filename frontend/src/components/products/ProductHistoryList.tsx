import React, { useState, useEffect } from 'react';
import { ProductHistoryRecord } from '../../services/productHistoryService';
import productHistoryService from '../../services/productHistoryService';

interface ProductHistoryListProps {
  productId: string;
  className?: string;
}

const ProductHistoryList: React.FC<ProductHistoryListProps> = ({ productId, className = '' }) => {
  const [history, setHistory] = useState<ProductHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    loadHistory();
  }, [productId, pagination.offset, pagination.limit]);

  const loadHistory = async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await productHistoryService.getProductHistory(
        productId,
        pagination.limit,
        pagination.offset
      );
      
      setHistory(response.history);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
      setError(err.message || 'Error al cargar el historial del producto');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'CREATE':
        return { text: 'Creación', className: 'bg-green-100 text-green-800' };
      case 'UPDATE':
        return { text: 'Actualización', className: 'bg-blue-100 text-blue-800' };
      case 'DELETE':
        return { text: 'Eliminación', className: 'bg-red-100 text-red-800' };
      default:
        return { text: changeType, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const getFieldLabel = (field: string | undefined) => {
    if (!field) return 'General';
    
    // Mapeo de campos a nombres más amigables en español
    const fieldMap: Record<string, string> = {
      'name': 'Nombre',
      'description': 'Descripción',
      'basePrice': 'Precio base',
      'stockQuantity': 'Cantidad en stock',
      'unitMeasure': 'Unidad de medida',
      'categoryId': 'Categoría',
      'originLocationId': 'Ubicación de origen',
      'isFeatured': 'Destacado',
      'isActive': 'Activo'
    };
    
    return fieldMap[field] || field;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Historial de cambios</h3>
      </div>
      
      {loading && history.length === 0 ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-1"></div>
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <button 
            onClick={loadHistory}
            className="px-4 py-2 bg-green-1 hover:bg-green-0-9 text-white rounded-md transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No hay historial de cambios disponible para este producto.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {history.map((record) => {
              const changeTypeInfo = getChangeTypeLabel(record.changeType);
              return (
                <li key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${changeTypeInfo.className}`}>
                          {changeTypeInfo.text}
                        </span>
                        {record.changeField && (
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {getFieldLabel(record.changeField)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {record.user ? (
                          <>Por <span className="font-medium">{record.user.firstName || record.user.username}</span></>
                        ) : (
                          'Usuario desconocido'
                        )}
                      </p>
                      
                      <time className="text-xs text-gray-500">
                        {formatTimestamp(record.timestamp)}
                      </time>
                    </div>
                    
                    {record.changeType === 'UPDATE' && record.oldValue !== undefined && record.newValue !== undefined && (
                      <div className="text-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="bg-red-50 text-red-800 px-2 py-1 rounded-md line-through">
                            {record.oldValue}
                          </span>
                          <span className="hidden sm:block text-gray-400">→</span>
                          <span className="bg-green-50 text-green-800 px-2 py-1 rounded-md">
                            {record.newValue}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          
          {pagination.hasMore && (
            <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-200">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1"
              >
                Cargar más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductHistoryList; 