import React from 'react';

const VARIANT_CLASSES = {
  default: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-input bg-transparent text-foreground hover:bg-accent',
  ghost: 'bg-transparent text-foreground hover:bg-accent',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  link: 'bg-transparent text-blue-600 underline-offset-4 hover:underline',
};

const SIZE_CLASSES = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

/**
 * Was dropping every prop except children (no onClick, disabled, type, id,
 * aria-*) - any button relying on those silently did nothing. Now forwards
 * ...props and maps the variant/size props the rest of the app already
 * passes (grepped across frontend/src) to real classes instead of ignoring
 * them.
 */
function Button({ className = '', variant = 'default', size = 'default', children, ...props }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.default;
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
export { Button };
