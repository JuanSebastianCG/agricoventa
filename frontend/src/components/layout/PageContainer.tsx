import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: 'white' | 'gray' | 'none';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  centered?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * PageContainer - A reusable container for page content with consistent styling
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  bgColor = 'gray',
  maxWidth = 'xl',
  centered = false,
  padding = 'md',
}) => {
  // Background color classes
  const bgClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    none: '',
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
    none: '',
  };

  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'px-4 py-4',
    md: 'px-6 py-8',
    lg: 'px-8 py-12',
  };
  
  // Combine classes
  const containerClasses = `
    ${bgClasses[bgColor]}
    ${maxWidth !== 'none' ? 'w-full' : ''}
    ${maxWidthClasses[maxWidth]}
    ${paddingClasses[padding]}
    ${centered ? 'mx-auto' : ''}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

export default PageContainer; 