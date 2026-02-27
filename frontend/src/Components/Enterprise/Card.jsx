import React from 'react';
import clsx from 'clsx';

const EnterpriseCard = React.forwardRef(({
  children,
  className = '',
  hover = false,
  padding = 'normal',
  shadow = 'enterprise',
  ...props
}, ref) => {
  const baseClasses = 'bg-white rounded-enterprise-lg shadow-enterprise border border-neutral-100 transition-all duration-200';
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };
  
  const shadows = {
    none: '',
    enterprise: 'shadow-enterprise',
    md: 'shadow-enterprise-md',
    lg: 'shadow-enterprise-lg',
  };
  
  const hoverClasses = hover ? 'hover:shadow-enterprise-md hover:-translate-y-1' : '';
  
  const classes = clsx(
    baseClasses,
    paddings[padding],
    shadows[shadow],
    hoverClasses,
    className
  );
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

EnterpriseCard.displayName = 'EnterpriseCard';

const EnterpriseCardHeader = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'border-b border-neutral-100 pb-4 mb-4',
    className
  );
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

EnterpriseCardHeader.displayName = 'EnterpriseCardHeader';

const EnterpriseCardTitle = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'text-xl font-semibold text-neutral-900 leading-none tracking-tight',
    className
  );
  
  return (
    <h3
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </h3>
  );
});

EnterpriseCardTitle.displayName = 'EnterpriseCardTitle';

const EnterpriseCardDescription = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'text-neutral-600 mt-1',
    className
  );
  
  return (
    <p
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </p>
  );
});

EnterpriseCardDescription.displayName = 'EnterpriseCardDescription';

const EnterpriseCardContent = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'pt-6',
    className
  );
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

EnterpriseCardContent.displayName = 'EnterpriseCardContent';

const EnterpriseCardFooter = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'flex items-center pt-6',
    className
  );
  
  return (
    <div
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </div>
  );
});

EnterpriseCardFooter.displayName = 'EnterpriseCardFooter';

export { 
  EnterpriseCard, 
  EnterpriseCardHeader, 
  EnterpriseCardTitle, 
  EnterpriseCardDescription, 
  EnterpriseCardContent, 
  EnterpriseCardFooter 
};
export default EnterpriseCard;
