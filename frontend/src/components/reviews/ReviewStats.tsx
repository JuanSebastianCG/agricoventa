import React from 'react';

interface ReviewStatsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    [key: number]: number;
  };
}

const ReviewStats: React.FC<ReviewStatsProps> = ({ 
  averageRating, 
  totalReviews,
  ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
}) => {
  // Calculate percentages for the rating bars
  const getPercentage = (count: number): number => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-4">Valoraciones de clientes</h3>
      
      <div className="flex items-center mb-6">
        <div className="text-center mr-6">
          <div className="text-3xl font-bold text-gray-800">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex mt-1 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(averageRating) ? 'text-yellow-1' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalReviews} {totalReviews === 1 ? 'valoración' : 'valoraciones'}
          </div>
        </div>
        
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center mb-1">
              <div className="text-sm text-gray-600 w-8">
                {star} 
                <svg className="w-3 h-3 inline-block ml-0.5 text-yellow-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              
              <div className="flex-1 h-2 mx-2 bg-gray-200 rounded">
                <div 
                  className="h-2 bg-green-1 rounded"
                  style={{ width: `${getPercentage(ratingDistribution[star] || 0)}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 w-8 text-right">
                {ratingDistribution[star] || 0}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewStats; 