import React, { useEffect, useState } from 'react';

export type NotificationType = 'error' | 'success' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string | React.ReactNode;
  onClose?: () => void;
  className?: string;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  className = '',
  autoClose = false,
  autoCloseTime = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Para auto-cerrar después de un tiempo
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Esperar a que termine la animación para llamar a onClose
        setTimeout(onClose, 300);
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  // Manejar cierre con animación
  const handleClose = () => {
    if (onClose) {
      setIsVisible(false);
      // Esperar a que termine la animación para llamar a onClose
      setTimeout(onClose, 300);
    }
  };

  // Configuraciones según el tipo de notificación
  const configs = {
    error: {
      bgColor: 'bg-red-1/10',
      borderColor: 'border-l-4 border-red-1',
      textColor: 'text-red-1',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mr-2 flex-shrink-0"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      ),
      title: 'Error'
    },
    success: {
      bgColor: 'bg-green-0-5',
      borderColor: 'border-l-4 border-green-1',
      textColor: 'text-green-1',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mr-2 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      ),
      title: 'Éxito'
    },
    warning: {
      bgColor: 'bg-yellow-1/10',
      borderColor: 'border-l-4 border-yellow-1',
      textColor: 'text-yellow-1',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mr-2 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      ),
      title: 'Advertencia'
    },
    info: {
      bgColor: 'bg-blue-2',
      borderColor: 'border-l-4 border-blue-3',
      textColor: 'text-blue-3',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 mr-2 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      ),
      title: 'Información'
    }
  };

  const { bgColor, borderColor, textColor, icon, title } = configs[type];

  const visibilityClasses = isVisible 
    ? 'opacity-100 translate-y-0' 
    : 'opacity-0 -translate-y-2';

  return (
    <div 
      className={`
        flex items-start p-4 mb-4 rounded-md shadow-md ${bgColor} ${borderColor} ${className} ${visibilityClasses}
        transition-all duration-300 ease-in-out transform
      `}
      role="alert"
    >
      <div className={`${textColor} flex-shrink-0`}>
        {icon}
      </div>
      <div className="ml-3 flex-1">
        <h3 className={`font-semibold ${textColor}`}>{title}</h3>
        <div className={`text-sm mt-1 ${textColor}`}>
          {typeof message === 'string' 
            ? <p>{message}</p> 
            : message
          }
        </div>
      </div>
      
      {onClose && (
        <button 
          onClick={handleClose}
          className={`
            ml-auto -mx-1.5 -my-1.5 ${textColor} rounded-lg p-1.5 hover:bg-opacity-20
            hover:bg-black transition-colors duration-200 inline-flex h-8 w-8
          `}
          aria-label="Cerrar"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Notification; 