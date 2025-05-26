import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import Card from '../components/ui/Card'; // No longer needed directly for product items
import { IProduct, ProductFilters } from '../interfaces/product';
import api from '../services/api';
import Header from '../components/layout/Header';
// import UserProfile from '../components/common/UserProfile'; // UserProfile is now within ProductCard if needed
import ProductCard from '../components/products/ProductCard'; // Import ProductCard
import CartIcon from '../components/cart/CartIcon';
import { useCart } from '../context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCrown, FaSearch } from 'react-icons/fa';
import { useAppContext } from '../context/AppContext';

interface Seller {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
  profileImage?: string;
}

interface ProductWithSeller extends IProduct {
  seller?: Seller;
  stockQuantity?: number; // Add stockQuantity field for backend compatibility
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppContext();
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters & {search?: string}>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { addItem } = useCart();
  const pageSize = 12; // Items per page

  // Parse query params from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const searchParam = query.get('search');
    
    if (searchParam) {
      setSearchQuery(searchParam);
      setFilters(prev => ({ ...prev, search: searchParam }));
    }
  }, [location.search]);

  useEffect(() => {
    fetchProducts();
  }, [filters, currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Construct query parameters from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.append('categoryId', filters.category);
      if (filters.region) queryParams.append('department', filters.region);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.search) queryParams.append('search', filters.search);
      
      // Add pagination parameters
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());

      const response = await api.get(`/products?${queryParams.toString()}`);
      
      if (response.data.success && response.data.data) {
        console.log("API Response:", response.data);
        
        // Normalize the product data to ensure it has the fields we need
        const normalizedProducts = (response.data.data.products || []).map((product: any) => {
          // The backend might use different field names (basePrice/price, stockQuantity/availableQuantity)
          return {
            ...product,
            price: product.price || product.basePrice,
            availableQuantity: product.availableQuantity || product.stockQuantity || 0
          };
        });
        
        setProducts(normalizedProducts);
        setTotalProducts(response.data.data.pagination?.total || normalizedProducts.length);
        setTotalPages(response.data.data.pagination?.pages || 1);
      } else {
        throw new Error(response.data.error?.message || 'Error al cargar productos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filterName: keyof (ProductFilters & {search?: string}), value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchQuery);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast.error('Producto no encontrado');
      return;
    }

    // The backend might be using stockQuantity instead of availableQuantity
    // Let's check both fields and use the one that's available
    const stockAmount = typeof product.stockQuantity === 'number' ? 
      product.stockQuantity : 
      (typeof product.availableQuantity === 'number' ? 
        product.availableQuantity : 0);

    // Check if there is stock available
    if (stockAmount <= 0) {
      toast.error(`${product.name} no está disponible en inventario`);
      return;
    }

    // Get primary image URL if available
    const primaryImage = product.images?.find(img => img.isPrimary);
    const imageUrl = primaryImage?.imageUrl || product.images?.[0]?.imageUrl;

    // Add item to cart and check result
    const success = addItem({
      productId: product.id || '',
      name: product.name,
      price: product.price,
      quantity: 1,
      unitMeasure: product.unitMeasure,
      imageUrl,
      sellerName: product.seller ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() : 'Agricultor verificado',
      stockQuantity: stockAmount // Use the correct stock amount
    });

    if (success) {
      toast.success(`${product.name} agregado al carrito`);
      navigate('/carrito');
    } else {
      toast.error(`No se pudo agregar ${product.name} al carrito. Stock insuficiente.`);
    }
  };

  // Generate pagination controls
  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Previous page button
    pages.push(
      <button 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        &laquo;
      </button>
    );
    
    // First page if not included in the range
    if (startPage > 1) {
      pages.push(
        <button 
          key="1" 
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1 rounded-md border hover:bg-gray-50 ${currentPage === 1 ? 'bg-green-1 text-white border-green-1' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md border hover:bg-gray-50 ${currentPage === i ? 'bg-green-1 text-white border-green-1' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          {i}
        </button>
      );
    }
    
    // Last page if not included in the range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      
      pages.push(
        <button 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 rounded-md border hover:bg-gray-50 ${currentPage === totalPages ? 'bg-green-1 text-white border-green-1' : 'bg-white text-gray-700 border-gray-300'}`}
        >
          {totalPages}
        </button>
      );
    }
    
    // Next page button
    pages.push(
      <button 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        &raquo;
      </button>
    );
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {pages}
      </div>
    );
  };

  // Render category badges for the header section
  const renderCategoryBadges = () => {
    const categories = [
      { id: "", name: "Todos" },
      { id: "Frutas", name: "Frutas" },
      { id: "Verduras", name: "Verduras" },
      { id: "Granos", name: "Granos" },
      { id: "Lácteos", name: "Lácteos" },
      { id: "Café y Cacao", name: "Café" },
      { id: "Hierbas y Especias", name: "Hierbas" },
      { id: "Miel y Derivados", name: "Miel" }
    ];
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleFilterChange('category', category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filters.category === category.id
                ? 'bg-green-1 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="bg-green-1 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Mercado de Agricoventas</h1>
              <p className="mt-2">Compra productos frescos directamente de agricultores verificados</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/subscription')}
                className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-md text-white transition-colors"
              >
                <FaCrown className="mr-2" />
                {user?.subscriptionType === 'PREMIUM' ? 'Subscripción Premium' : 'Mejorar a Premium'}
              </button>
              <CartIcon className="text-white" />
            </div>
          </div>
          {renderCategoryBadges()}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and advanced filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form onSubmit={handleSearch} className="flex items-center mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-1"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FaSearch />
              </span>
            </div>
            <button 
              type="submit"
              className="bg-green-1 hover:bg-green-700 text-white py-2 px-4 rounded-r-md transition-colors"
            >
              Buscar
            </button>
          </form>
          
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
                value={filters.region || ''}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                <option value="">Todas las regiones</option>
                <option value="Antioquia">Antioquia</option>
                <option value="Nariño">Nariño</option>
                <option value="Cundinamarca">Cundinamarca</option>
                <option value="Valle">Valle del Cauca</option>
                <option value="Cauca">Cauca</option>
                <option value="Boyacá">Boyacá</option>
                <option value="Santander">Santander</option>
                <option value="Tolima">Tolima</option>
                <option value="Huila">Huila</option>
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <select
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
                value={filters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="">Ordenar por</option>
                <option value="price_asc">Precio: Menor a mayor</option>
                <option value="price_desc">Precio: Mayor a menor</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="name_desc">Nombre: Z-A</option>
                <option value="createdAt_desc">Más recientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products count */}
        <div className="mb-4 text-sm text-gray-1 flex justify-between items-center">
          <span><strong>{totalProducts}</strong> productos disponibles</span>
          {filters.search && (
            <button 
              onClick={() => {
                setFilters(prev => {
                  const newFilters = {...prev};
                  delete newFilters.search;
                  return newFilters;
                });
                setSearchQuery('');
              }}
              className="text-green-1 hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>

        {/* Active filters */}
        {(filters.category || filters.region || filters.search) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.category && (
              <div className="bg-green-0-5 text-green-1 px-3 py-1 rounded-full text-sm flex items-center">
                Categoría: {filters.category}
                <button 
                  className="ml-2"
                  onClick={() => handleFilterChange('category', '')}
                >
                  ✕
                </button>
              </div>
            )}
            {filters.region && (
              <div className="bg-green-0-5 text-green-1 px-3 py-1 rounded-full text-sm flex items-center">
                Región: {filters.region}
                <button 
                  className="ml-2"
                  onClick={() => handleFilterChange('region', '')}
                >
                  ✕
                </button>
              </div>
            )}
            {filters.search && (
              <div className="bg-green-0-5 text-green-1 px-3 py-1 rounded-full text-sm flex items-center">
                Búsqueda: {filters.search}
                <button 
                  className="ml-2"
                  onClick={() => {
                    handleFilterChange('search', '');
                    setSearchQuery('');
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            {(filters.category || filters.region || filters.search) && (
              <button 
                className="text-green-1 hover:underline text-sm"
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}

        {/* Loading and error states */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* Products grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onViewDetails={(productId) => navigate(`/product/${productId}`)}
                  onAddToCart={handleAddToCart}
                  viewContext="marketplace"
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <img 
                  src="/images/empty-results.svg" 
                  alt="No hay resultados" 
                  className="w-32 h-32 mb-4 opacity-70"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://via.placeholder.com/128?text=No+resultados';
                  }}
                />
                <p className="text-gray-1 text-lg font-medium">No hay productos que coincidan con tu búsqueda</p>
                <p className="text-gray-1 mb-4">Intenta cambiar los filtros o buscar con otros términos</p>
                <button 
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                  }}
                  className="bg-green-1 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Ver todos los productos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && products.length > 0 && totalPages > 1 && renderPagination()}
      </div>
      
      {/* Toast notifications */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default Marketplace; 