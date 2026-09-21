import React from 'react';

export const Textarea = React.forwardRef(({ className = '', ...props }, ref) => <textarea ref={ref} className={`min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />);
Textarea.displayName = 'Textarea';
export default Textarea;
