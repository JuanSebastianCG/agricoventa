import React from 'react';
import { IProduct } from '../../interfaces/product';
// import Card from '../ui/Card'; // No longer needed as ProductCard handles its own Card
import ProductCard from './ProductCard'; // Import the common ProductCard

interface ProductGridViewProps {
  products: IProduct[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

const ProductGridView: React.FC<ProductGridViewProps> = ({ 
  products, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  return (
    // Using a more responsive grid for compactness, can be adjusted
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          viewContext="my-products"
        />
      ))}
    </div>
  );
};

export default ProductGridView; 