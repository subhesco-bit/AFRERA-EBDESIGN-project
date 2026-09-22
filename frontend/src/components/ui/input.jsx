import React from 'react';

export const Input = React.forwardRef(({ className = '', ...props }, ref) => <input ref={ref} className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />);
Input.displayName = 'Input';
export default Input;
