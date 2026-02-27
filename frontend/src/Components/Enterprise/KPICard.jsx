import React from 'react';
import clsx from 'clsx';

const EnterpriseKPICard = ({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon,
  trend,
  className = '',
  ...props 
}) => {
  const baseClasses = 'enterprise-kpi-card bg-white rounded-enterprise-lg shadow-enterprise border border-neutral-100 p-6 hover:shadow-enterprise-md transition-all duration-200';
  
  const changeClasses = {
    positive: 'enterprise-kpi-change-positive',
    negative: 'enterprise-kpi-change-negative',
    neutral: 'text-neutral-600',
  };
  
  const trendIcons = {
    up: (
      <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0l-4-4m4 4v8m0 0l-4 4m4 4v8M12 4v.01M12 12v.01" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0l-4 4m4 4v-8m0 0l-4-4m4 4v-8M12 14v.01M12 8v.01" />
      </svg>
    ),
    stable: (
      <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 12v.01M12 5v.01" />
      </svg>
    ),
  };
  
  return (
    <div className={clsx(baseClasses, className)} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center mb-3">
            {icon && (
              <div className="p-2 bg-primary-50 rounded-enterprise">
                {icon}
              </div>
            )}
            <h3 className="enterprise-kpi-label">{title}</h3>
          </div>
          <div className="enterprise-kpi-value">{value}</div>
        </div>
        
        {(change !== undefined || trend) && (
          <div className="flex flex-col items-end space-y-1">
            {trend && trendIcons[trend]}
            {change !== undefined && (
              <span className={clsx('enterprise-kpi-change', changeClasses[changeType])}>
                {changeType === 'positive' ? '+' : ''}{change}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterpriseKPICard;
