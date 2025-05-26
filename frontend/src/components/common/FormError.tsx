import React from 'react';

interface FormErrorProps {
  message: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`flex items-center mt-1 animate-fadeIn ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 text-red-1 mr-1.5 flex-shrink-0" 
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
      <p className="text-sm text-red-1 font-medium">{message}</p>
    </div>
  );
};

// Keyframe animation para la aparición suave
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-in-out;
  }
`;
document.head.appendChild(style);

export default FormError; 