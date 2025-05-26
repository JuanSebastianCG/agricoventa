import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  icon,
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors shadow-md focus:outline-none';
  
  // Variant-specific classes
  const variantClasses = {
    primary: 'bg-green-1 hover:bg-green-0-9 text-white border border-green-1',
    secondary: 'bg-gray-0-5 hover:bg-gray-1 text-white border border-gray-0-5',
    success: 'bg-green-1 hover:bg-green-0-9 text-white border border-green-1',
    danger: 'bg-red-1 hover:bg-red-1/90 text-white border border-red-1',
    warning: 'bg-yellow-1 hover:bg-yellow-1-5 text-black border border-yellow-1',
  };

  // Size-specific classes
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-3',
    lg: 'text-lg px-6 py-3',
  };

  // Width class
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button; 