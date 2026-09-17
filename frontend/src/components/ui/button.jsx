import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

// Restored to the standard shadcn/ui Button API that the rest of this
// codebase already assumes (58 files import { Button }, using variant/size
// props and one asChild usage) and that tailwind.config.js's design tokens
// (--primary, --destructive, --secondary, etc.) already support - the
// previous version of this file was a one-line default-export stub with no
// named export at all, which broke every one of those 58 imports.
const VARIANT_CLASSES = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  info: 'bg-blue-600 text-white hover:bg-blue-700',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
};

const SIZE_CLASSES = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  xl: 'h-12 rounded-md px-10 text-base',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
          SIZE_CLASSES[size] || SIZE_CLASSES.default,
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export default Button;
