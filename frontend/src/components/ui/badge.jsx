import React from 'react';
import { cn } from '../../lib/utils';

// Restored to a named export - this file previously only had a default
// export, breaking every `import { Badge } from '.../ui/badge'` call site.
const VARIANT_CLASSES = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
        className,
      )}
      {...props}
    />
  );
}

export default Badge;
