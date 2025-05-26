import React from 'react';

export interface ReviewItem {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
  isVerifiedPurchase: boolean;
}

interface ReviewListProps {
  reviews: ReviewItem[];
  isLoading: boolean;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-1' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const ReviewList: React.FC<ReviewListProps> = ({ reviews, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-1 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando reseñas...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-4 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-600">Este producto aún no tiene reseñas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border rounded-lg p-4 bg-white">
          <div className="flex items-start">
            <div className="mr-3">

              
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {review.user?.firstName && review.user?.lastName
                      ? `${review.user.firstName} ${review.user.lastName}`
                      : review.user?.username || 'Usuario Anónimo'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
                
                {review.isVerifiedPurchase && (
                  <span className="text-xs bg-green-0-4 text-green-1 px-2 py-1 rounded-full">
                    Compra verificada
                  </span>
                )}
              </div>
              
              {review.comment && (
                <div className="mt-2 text-gray-700 whitespace-pre-line">
                  {review.comment}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList; 