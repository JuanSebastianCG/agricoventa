import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';

interface Product {
  id: string;
  name: string;
  price: number;
  availableQuantity: number;
  stockQuantity?: number;
  unitMeasure: string;
  createdAt: string;
  isActive: boolean;
  isFeatured: boolean;
  seller?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  category?: {
    id: string;
    name: string;
  } | null;
}

const ManageProducts: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.userType !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    fetchProducts();
  }, [isAuthenticated, user, navigate]);
  
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products');
      
      if (response.data.success) {
        let productData = Array.isArray(response.data.data.products) 
          ? response.data.data.products 
          : response.data.data;
          
        setProducts(productData);
      } else {
        throw new Error(response.data.error?.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await api.put(`/products/${productId}`, { isActive: !currentStatus });
      
      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, isActive: !currentStatus } 
          : product
      ));
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('Error al cambiar el estado del producto');
    }
  };
  
  const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
    try {
      await api.put(`/products/${productId}`, { isFeatured: !currentStatus });
      
      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, isFeatured: !currentStatus } 
          : product
      ));
    } catch (err) {
      console.error('Error toggling featured status:', err);
      alert('Error al cambiar el estado destacado del producto');
    }
  };
  
  // Filter products based on search term, status, and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.seller?.username.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive) ||
                         (statusFilter === 'featured' && product.isFeatured);
    
    const matchesCategory = !categoryFilter || 
                           product.category?.id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Administrar Productos</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nombre o vendedor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-1"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-1"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="featured">Destacados</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-1"
            >
              <option value="">Todas las categorías</option>
              <option value="category1">Categoría 1 (placeholder)</option>
              <option value="category2">Categoría 2 (placeholder)</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => fetchProducts()}
              className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Products Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
        </div>
      ) : (
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destacado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category?.name || 'Sin categoría'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.seller 
                          ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || product.seller.username 
                          : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500">por {product.unitMeasure}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.availableQuantity || product.stockQuantity || 0} {product.unitMeasure}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isFeatured ? 'Destacado' : 'No destacado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                        className={`mr-2 px-3 py-1 rounded text-xs font-medium ${
                          product.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {product.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          product.isFeatured 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {product.isFeatured ? 'No destacar' : 'Destacar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageProducts; 