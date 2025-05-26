import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { IProduct } from '../../interfaces/product';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import { useAppContext } from '../../context/AppContext';
import ReviewList, { ReviewItem } from '../../components/reviews/ReviewList';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewStats from '../../components/reviews/ReviewStats';
import ProductHistoryList from '../../components/products/ProductHistoryList';
import { useCart } from '../../context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StarRating: React.FC<{ rating: number, reviewCount?: number }> = ({ rating, reviewCount }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`star-full-${i}`} className="w-5 h-5 text-yellow-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {hasHalfStar && (
        <div className="relative">
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <svg className="w-5 h-5 text-yellow-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      )}
      
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`star-empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      
      {reviewCount !== undefined && (
        <span className="ml-2 text-sm font-medium text-gray-600">({reviewCount} reseñas)</span>
      )}
    </div>
  );
};

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  const { addItem } = useCart();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'descripcion' | 'historial' | 'resenas'>('descripcion');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Review related state
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<{ [key: number]: number }>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  // Integrar un estado para controlar la visualización del historial
  const [showHistory, setShowHistory] = useState(false);

  console.log("ProductDetail mounted with productId:", productId);

  // Calculate rating distribution from reviews
  const calculateRatingDistribution = (reviewsList: ReviewItem[]) => {
    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviewsList.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[Math.floor(review.rating)] = (distribution[Math.floor(review.rating)] || 0) + 1;
      }
    });
    
    return distribution;
  };

  // Function to fetch product reviews
  const fetchReviews = async () => {
    if (!productId) return;
    
    try {
      setReviewsLoading(true);
      const response = await api.get(`/reviews/product/${productId}`);
      
      if (response.data.success && response.data.data) {
        const reviewData = response.data.data.reviews || [];
        setReviews(reviewData);
        setRatingDistribution(calculateRatingDistribution(reviewData));
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        console.error("Product ID is missing from URL params");
        setError('Product ID not found.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.log("Fetching product with ID:", productId);
        const response = await api.get(`/products/${productId}`);
        if (response.data.success && response.data.data) {
          console.log("Product data retrieved:", response.data.data);
          setProduct(response.data.data);
        } else {
          throw new Error(response.data.error?.message || 'Failed to fetch product details');
        }
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [productId]);

  const nextImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images && product.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
      );
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if there is available stock using various potential field names and formats
    const hasStock = (
      (typeof product.availableQuantity === 'number' && product.availableQuantity > 0) ||
      (typeof product.stockQuantity === 'number' && product.stockQuantity > 0) ||
      (product.availableQuantity && parseInt(String(product.availableQuantity)) > 0) ||
      (product.stockQuantity && parseInt(String(product.stockQuantity)) > 0)
    );
    
    if (!hasStock) {
      toast.error('Este producto no tiene stock disponible');
      return;
    }
    
    // Determine the actual stock amount
    const stockAmount = (
      typeof product.availableQuantity === 'number' ? product.availableQuantity :
      typeof product.stockQuantity === 'number' ? product.stockQuantity :
      product.availableQuantity ? parseInt(String(product.availableQuantity)) :
      product.stockQuantity ? parseInt(String(product.stockQuantity)) :
      0
    );
    
    try {
      // Create a cart item from the product data
      const success = addItem({
        productId: product.id || '',
        name: product.name,
        price: product.price,
        quantity: 1, // Default quantity
        unitMeasure: product.unitMeasure || 'unidad',
        imageUrl: product.images?.[0]?.imageUrl || '', // First image URL if available
        sellerName: product.seller ? 
          `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 
          ((product.seller as any)?.username || 'Vendedor') : 
          'Vendedor',
        stockQuantity: stockAmount
      });
      
      if (success) {
        // Show success message and navigate to cart
        toast.success('Producto añadido al carrito');
        navigate('/carrito');
      } else {
        toast.error('No se pudo añadir el producto. Stock insuficiente.');
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      toast.error('No se pudo añadir el producto al carrito');
    }
  };

  // Handle review submission complete
  const handleReviewSubmitted = () => {
    fetchReviews();
    // Also update product rating if needed
    if (productId) {
      api.get(`/products/${productId}`)
        .then(response => {
          if (response.data.success) {
            setProduct(response.data.data);
          }
        })
        .catch(err => console.error('Error refreshing product data:', err));
    }
  };

  // Add this helper function near the top of the component
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '';
    
    // If the path is already a full URL (starts with http:// or https://), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, prepend the API URL
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${apiUrl}/${cleanPath}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-1 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Cargando detalles del producto...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="p-8 bg-red-50">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <StyledButton onClick={() => navigate('/')} variant="primary">
              Volver al Inicio
            </StyledButton>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Producto no encontrado</h2>
            <p className="text-gray-600 mb-6">El producto que estás buscando no existe o no está disponible.</p>
            <StyledButton onClick={() => navigate('/')} variant="primary">
              Explorar Productos
            </StyledButton>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const sellerFullName = product.seller ? 
    `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 
    ((product.seller as any)?.username || 'Vendedor') : 
    'Vendedor';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            <p className="ml-4 text-lg text-gray-600">Cargando producto...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-1 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : product ? (
          <div className="flex flex-col gap-8">
            {/* Imagen del producto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Imagen del producto */}
              <div className="rounded-lg overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={getImageUrl(product.images[currentImageIndex]?.imageUrl || '')}
                    alt={product.name} 
                    className="w-full h-auto object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No hay imagen disponible</p>
                  </div>
                )}
              </div>

              {/* Segunda columna: información del producto */}
              <div className="bg-white rounded-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name || 'Cafe Organico - Certificado'}</h1>
                
                <div className="flex items-center mb-4">
                  <p className="text-2xl font-bold text-green-600 mr-4">
                    {typeof product.price === 'number' 
                      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)
                      : '12,000 COP'
                    }/kg
                  </p>
                  
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(product.averageRating || 4.5) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({product.reviewCount || 128} Reseñas)</span>
                  </div>
                </div>
                
                {/* Información de ubicación y disponibilidad */}
                <div className="flex items-start mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{product.originLocation?.city || 'Nariño'}, {product.originLocation?.country || 'Colombia'}</span>
                </div>
                
                <div className="flex items-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Disponible: {product.stockQuantity || 150} kg</span>
                </div>
                
                {/* Información del vendedor */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6 flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    {product.seller?.profileImage ? (
                      <img 
                        src={getImageUrl(product.seller.profileImage)}
                        alt={product.seller.firstName || 'Vendedor'} 
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                        {((product.seller?.firstName || '').charAt(0) + (product.seller?.lastName || '').charAt(0)) || 'JC'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {product.seller 
                        ? `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || ((product.seller as any)?.username || 'Juan Carlos Ramirez')
                        : 'Juan Carlos Ramirez'
                      }
                    </h3>
                    <div className="flex mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                        Verificado
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Certificación De producto
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="mb-8">
                  <button 
                    onClick={handleAddToCart}
                    disabled={!product.stockQuantity || product.stockQuantity <= 0}
                    className="w-full flex justify-center items-center py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition duration-150 ease-in-out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    {product.stockQuantity && product.stockQuantity > 0 
                      ? 'Añadir al carrito' 
                      : 'Sin stock disponible'
                    }
                  </button>
                </div>
              </div>
            </div>
            
            {/* Información del producto y pestañas */}
            <div className="mt-6">
              {/* Tabs para descripción, historial y reseñas */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('descripcion')}
                    className={`mr-8 py-2 relative ${
                      activeTab === 'descripcion'
                        ? 'text-green-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Descripcion
                    {activeTab === 'descripcion' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('historial')}
                    className={`mr-8 py-2 relative ${
                      activeTab === 'historial'
                        ? 'text-green-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Historial
                    {activeTab === 'historial' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('resenas')}
                    className={`py-2 relative ${
                      activeTab === 'resenas'
                        ? 'text-green-600 font-medium'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reseñas
                    {activeTab === 'resenas' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600"></span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Contenido de las pestañas */}
              <div>
                {activeTab === 'descripcion' && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">
                      {product.description || 'Nuestros granos de café orgánico premium son cultivados cuidadosamente a gran altitud en Nariño, Colombia. Los granos crecen a la sombra bajo condiciones óptimas, lo que da como resultado un sabor intenso y completo con notas de chocolate y cítricos. Todas nuestras prácticas agrícolas están certificadas como orgánicas, lo que garantiza métodos de producción sostenibles y respetuosos con el medio ambiente.'}
                    </p>
                  </div>
                )}

                {activeTab === 'historial' && (
                  <div>
                    {(user?.userType === 'SELLER' || user?.userType === 'ADMIN') ? (
                      <ProductHistoryList productId={product.id || ''} />
                    ) : (
                      <p className="text-gray-700">Necesita permisos de vendedor o administrador para ver el historial del producto.</p>
                    )}
                  </div>
                )}

                {activeTab === 'resenas' && (
                  <div>
                    <ReviewStats 
                      averageRating={product.averageRating || 0}
                      totalReviews={reviews.length} 
                      ratingDistribution={ratingDistribution}
                    />
                    
                    {isAuthenticated ? (
                      <div className="mt-6">
                        <ReviewForm 
                          productId={product.id || ''} 
                          userId={user?.id || ''}
                          onReviewSubmitted={handleReviewSubmitted}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-700">
                          Inicia sesión para dejar una reseña sobre este producto.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Reseñas de clientes</h3>
                      {reviewsLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-1"></div>
                          <p className="ml-3 text-gray-600">Cargando reseñas...</p>
                        </div>
                      ) : reviews.length > 0 ? (
                        <ReviewList reviews={reviews} />
                      ) : (
                        <p className="text-gray-500">Aún no hay reseñas para este producto.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontró el producto solicitado.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail; 