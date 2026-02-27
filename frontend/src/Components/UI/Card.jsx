import React from 'react';
import clsx from 'clsx';

const Card = React.forwardRef(({
  children,
  className = '',
  hover = false,
  padding = 'normal',
  shadow = 'soft',
  ...props
}, ref) => {
  const baseClasses = 'bg-white rounded-lg border border-neutral-100 transition-all duration-200';
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-sm',
    soft: 'shadow-soft',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:shadow-soft hover:-translate-y-1 cursor-pointer' : '';
  
  const classes = clsx(
    baseClasses,
    paddings[padding],
    shadows[shadow],
    hoverClasses,
    className
  );
  
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({
  children,
  className = '',
  border = true,
  ...props
}, ref) => {
  const classes = clsx(
    'flex flex-col space-y-1.5',
    border && 'pb-6 border-b border-neutral-100',
    className
  );
  
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'text-xl font-semibold text-neutral-900 leading-none tracking-tight',
    className
  );
  
  return (
    <h3 ref={ref} className={classes} {...props}>
      {children}
    </h3>
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'text-sm text-neutral-600 mt-1',
    className
  );
  
  return (
    <p ref={ref} className={classes} {...props}>
      {children}
    </p>
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'pt-6',
    className
  );
  
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  const classes = clsx(
    'flex items-center pt-6',
    className
  );
  
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
