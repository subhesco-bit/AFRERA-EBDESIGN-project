import React, { forwardRef } from 'react';
import styles from './Button.module.css';

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    className={`${styles.button} ${styles[variant]} ${styles[size]}`}
    disabled={disabled || loading}
    aria-busy={loading}
    {...props}
  >
    {loading ? '⏳ Loading...' : children}
  </button>
));

Button.displayName = 'Button';
export default Button;
