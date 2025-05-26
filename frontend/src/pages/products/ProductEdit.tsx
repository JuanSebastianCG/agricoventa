import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductEdit: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

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

  useEffect(() => {
    // Simply redirect to the ProductCreate component with the product ID
    if (productId) {
      navigate(`/crear-producto/${productId}`);
    } else {
      navigate('/mis-productos');
    }
  }, [productId, navigate]);

  // Show a simple loading state while redirecting
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
    </div>
  );
};

export default ProductEdit; 