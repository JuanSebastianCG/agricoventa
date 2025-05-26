import React from 'react';

interface StyledCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const StyledCheckbox: React.FC<StyledCheckboxProps> = ({
  label,
  error,
  className = '',
  containerClassName = '',
  labelClassName = '',
  id,
  ...props
}) => {
  // Generate unique ID if not provided
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex items-start ${containerClassName}`}>
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          className={`
            h-4 w-4 
            rounded 
            border-gray-0-5
            text-green-1 
            focus:ring-green-1 
            focus:ring-opacity-25
            transition-colors
            ${className}
          `}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={checkboxId} className={`font-medium text-gray-1 ${labelClassName}`}>
          {label}
        </label>
        {error && (
          <p className="text-red-1 text-xs mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default StyledCheckbox; 