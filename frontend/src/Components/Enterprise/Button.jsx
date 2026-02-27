import React from 'react';
import clsx from 'clsx';

const EnterpriseButton = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'enterprise-btn inline-flex items-center justify-center font-medium rounded-enterprise transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'enterprise-btn-primary',
    secondary: 'enterprise-btn-secondary',
    outline: 'enterprise-btn-outline',
    ghost: 'enterprise-btn-ghost',
    success: 'enterprise-btn-success',
    warning: 'enterprise-btn-warning',
    error: 'enterprise-btn-error',
  };
  
  const sizes = {
    sm: 'enterprise-btn-sm',
    md: '',
    lg: 'enterprise-btn-lg',
  };
  
  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    className
  );
  
  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="enterprise-spinner-sm -ml-1 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
});

EnterpriseButton.displayName = 'EnterpriseButton';

export default EnterpriseButton;
