import React from 'react';
import clsx from 'clsx';

const Input = React.forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const inputClasses = clsx(
    'w-full px-4 py-3 border rounded-lg bg-white text-neutral-900 placeholder-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
    error
      ? 'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500'
      : 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500 focus:shadow-soft',
    'transform focus:scale-[1.02]',
    className
  );
  
  const labelClasses = clsx(
    'block text-sm font-medium mb-2',
    error ? 'text-error-700' : 'text-neutral-700'
  );
  
  const helperTextClasses = clsx(
    'text-sm mt-1',
    error ? 'text-error-600' : 'text-neutral-500'
  );
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        disabled={disabled}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText ? `${props.id || 'input'}-helper` : undefined}
        {...props}
      />
      {helperText && (
        <p id={`${props.id || 'input'}-helper`} className={helperTextClasses}>
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-error-600 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
