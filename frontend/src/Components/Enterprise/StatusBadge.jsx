import React from 'react';
import clsx from 'clsx';

const EnterpriseStatusBadge = ({ 
  status, 
  children,
  className = '',
  size = 'md',
  ...props 
}) => {
  const baseClasses = 'enterprise-badge-status font-medium';
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  const statusClasses = {
    approved: 'enterprise-badge-approved',
    pending: 'enterprise-badge-pending',
    rejected: 'enterprise-badge-rejected',
    draft: 'enterprise-badge-neutral',
    submitted: 'enterprise-badge-pending',
    under_review: 'enterprise-badge-pending',
  };
  
  const statusIcons = {
    approved: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 1.414l8-8a1 1 0 011.414-1.414z" clipRule="evenodd" />
      </svg>
    ),
    pending: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 016 8zm1-16a4 4 0 00-8 0v8a4 4 0 008 0v-8a4 4 0 00-8 0z" clipRule="evenodd" />
      </svg>
    ),
    rejected: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 1.414L10 10.586 8.293a1 1 0 00-1.414-1.414L8.586 10H10a1 1 0 100 2v2a1 1 0 102 2h8a1 1 0 102-2v-2a1 1 0 00-2-2z" clipRule="evenodd" />
      </svg>
    ),
    draft: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 00-2.828 0l-2.828 2.828a2 2 0 002.828 2.828l1.414 1.414a2 2 0 002.828 0l2.828-2.828a2 2 0 00-2.828-2.828l-1.414-1.414z" />
      </svg>
    ),
  };
  
  const classes = clsx(
    baseClasses,
    sizes[size],
    statusClasses[status] || 'enterprise-badge-neutral',
    className
  );
  
  return (
    <span className={classes} {...props}>
      <span className="flex items-center space-x-1">
        {statusIcons[status]}
        {children || status}
      </span>
    </span>
  );
};

export default EnterpriseStatusBadge;
