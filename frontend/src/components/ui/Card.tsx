import React from 'react';
import StyledBorder from './StyledBorder';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'focus' | 'success' | 'error';
  noBorder?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  noBorder = false,
  elevation = 'sm',
  ...rest
}) => {
  // Shadow classes based on elevation
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  // Base card classes
  const cardClasses = `
    bg-white overflow-hidden
    ${shadowClasses[elevation]}
    ${className}
  `;

  return (
    <StyledBorder 
      variant={variant} 
      rounded="md" 
      noBorder={noBorder} 
      className={cardClasses}
      {...rest}
    >
      {children}
    </StyledBorder>
  );
};

export default Card; 