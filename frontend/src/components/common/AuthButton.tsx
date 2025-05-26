import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  isLoading = false,
  fullWidth = true,
  icon,
  children,
  className = '',
  ...props
}) => {
  // Usando clases personalizadas definidas en index.css
  const baseClasses = 'flex items-center justify-center px-4 py-3 border-2 btn-green text-base font-bold rounded-md shadow-lg focus:outline-none transition-colors';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${widthClass} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {isLoading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{typeof children === 'string' ? children.replace(/^(.*?)$/, '$1...') : 'Cargando...'}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default AuthButton; 