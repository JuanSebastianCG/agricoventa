import React from 'react';

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const StyledInput: React.FC<StyledInputProps> = ({ 
  label, 
  error, 
  icon, 
  className = '', 
  containerClassName = '',
  labelClassName = '',
  ...props 
}) => {
  // Use color variables based on error state
  const inputClasses = `
    w-full px-4 py-2 
    ${icon ? 'pl-10' : ''} 
    rounded-md 
    border
    focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors
    ${error 
      ? 'border-red-1 focus:ring-red-1/20' 
      : 'border-gray-0-5 focus:border-green-1 focus:ring-green-1/20'
    }
    ${className}
  `;

  const labelClasses = `
    block text-sm font-medium text-gray-1 mb-2
    ${labelClassName}
  `;

  return (
    <div className={`mb-4 ${containerClassName}`}>
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-1 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default StyledInput; 