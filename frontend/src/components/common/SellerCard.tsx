import React from 'react';
import { Link } from 'react-router-dom';
import UserProfile from './UserProfile';

interface User {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  phoneNumber?: string | null;
  profileImage?: string | null;
}

interface SellerCardProps {
  seller: User;
  productCount?: number;
  rating?: number;
  showContact?: boolean;
  className?: string;
}

const SellerCard: React.FC<SellerCardProps> = ({
  seller,
  productCount,
  rating,
  showContact = false,
  className = ''
}) => {
  return (
    <div className={`border border-gray-0-5 rounded-lg p-4 ${className}`}>
      <div className="mb-3">
        <UserProfile 
          user={seller} 
          variant="detailed" 
          showActions={false} 
        />
      </div>

      {/* Seller stats */}
      <div className="mt-4 space-y-2">
        {productCount !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-1">Productos:</span>
            <span className="text-sm font-medium">{productCount}</span>
          </div>
        )}
        
        {rating !== undefined && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-1">Calificación:</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-1">{rating.toFixed(1)}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-1' : 'text-gray-0-5'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 15.585l-5.344 2.807 1.02-5.947-4.324-4.214 5.975-.87L10 2.021l2.673 5.341 5.975.87-4.324 4.214 1.02 5.947z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to={`/vendedor/${seller.id}`}
          className="bg-green-0-5 hover:bg-green-0-6 text-green-1 py-2 px-3 rounded text-center text-sm transition-colors"
        >
          Ver Productos
        </Link>
        
        {showContact && (
          <Link
            to={`/contactar/${seller.id}`}
            className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-3 rounded text-center text-sm transition-colors"
          >
            Contactar
          </Link>
        )}
      </div>
    </div>
  );
};

export default SellerCard; 