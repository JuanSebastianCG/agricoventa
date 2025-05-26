import React from 'react';

interface StyledTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  rows?: number;
}

const StyledTextArea: React.FC<StyledTextAreaProps> = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  labelClassName = '',
  rows = 4,
  ...props 
}) => {
  // Use color variables based on error state
  const textareaClasses = `
    w-full px-4 py-2 
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
      <textarea
        className={textareaClasses}
        rows={rows}
        {...props}
      />
      {error && (
        <p className="text-red-1 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default StyledTextArea; 