import React from 'react';
import { IProduct } from '../../interfaces/product';
// import Card from '../ui/Card'; // No longer needed as ProductCard handles its own Card
import ProductCard from './ProductCard'; // Import the common ProductCard

interface ProductListViewProps {
  products: IProduct[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onViewDetails: (productId: string) => void;
}

const ProductListView: React.FC<ProductListViewProps> = ({ 
  products, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {
  return (
    <div className="space-y-6"> {/* Increased spacing for list view */}
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

export default ProductListView; 