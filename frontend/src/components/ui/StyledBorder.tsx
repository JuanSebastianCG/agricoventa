import React from 'react';

interface StyledBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'focus' | 'error' | 'success';
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
  className?: string;
  noBorder?: boolean;
}

/**
 * StyledBorder - A component for consistent border styling
 * @param children - The content to wrap with the border
 * @param variant - Border style variant: default | focus | error | success
 * @param rounded - Border radius size: sm | md | lg | full | none
 * @param className - Additional CSS classes
 * @param noBorder - If true, removes the border completely
 */
const StyledBorder: React.FC<StyledBorderProps> = ({
  children,
  variant = 'default',
  rounded = 'md',
  className = '',
  noBorder = false,
  ...rest
}) => {
  // Map variants to color classes
  const variantClasses = {
    default: 'border-gray-0-5',
    focus: 'border-green-1',
    error: 'border-red-1',
    success: 'border-green-0-7',
  };

  // Map rounded values to Tailwind classes
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Combine classes
  const borderClasses = `
    ${noBorder ? '' : 'border'}
    ${noBorder ? '' : variantClasses[variant]}
    ${roundedClasses[rounded]}
    ${className}
  `;

  return (
    <div className={borderClasses} {...rest}>
      {children}
    </div>
  );
};

export default StyledBorder; 