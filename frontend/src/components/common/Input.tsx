import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error = false,
  fullWidth = false,
  className = '',
  showPasswordToggle = false,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const baseInputClasses = 'py-2 px-4 w-full border rounded-md focus:outline-none transition-colors';
  const errorClasses = error 
    ? 'border-red-1 text-red-1 focus:border-red-1' 
    : 'border-gray-0-5 focus:border-green-1';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const inputType = showPasswordToggle 
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={`${widthClass} mb-4`}>
      {label && (
        <label className="block text-sm font-medium text-gray-1 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`${baseInputClasses} ${errorClasses} ${className} ${showPasswordToggle ? 'pr-10' : ''}`}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-1"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              // Eye open icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              // Eye closed icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-1' : 'text-gray-1'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input; 