import React, { useState } from 'react';
import api from '../../services/api';
import StyledButton from '../ui/StyledButton';

interface ReviewFormProps {
  productId: string;
  userId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, userId, onReviewSubmitted }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/reviews', {
        userId,
        productId,
        rating: parseInt(rating),
        comment: comment.trim() || undefined,
        isVerifiedPurchase: false
      });
      
      setComment('');
      setRating(5);
      onReviewSubmitted();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.error?.message || 'Error al enviar la reseña. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Deja tu opinión</h3>
      
      {/* Rating Stars */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Calificación
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="focus:outline-none"
            >
              <svg 
                className={`w-8 h-8 ${
                  (hoverRating !== null ? star <= hoverRating : star <= rating)
                    ? 'text-yellow-1'
                    : 'text-gray-300'
                }`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      {/* Review Text */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Tu comentario
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-1 focus:border-green-1"
          placeholder="Comparte tu experiencia con este producto..."
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <StyledButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            'Enviar reseña'
          )}
        </StyledButton>
      </div>
    </form>
  );
};

export default ReviewForm; 