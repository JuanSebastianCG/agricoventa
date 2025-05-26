import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Determine width based on size prop
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className={`relative mx-auto p-5 border shadow-lg rounded-md bg-white ${sizeClasses[size]} w-full m-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none p-1 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            {children}
          </div>
          {footer && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal; 