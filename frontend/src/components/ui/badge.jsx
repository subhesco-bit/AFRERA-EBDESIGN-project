import React from 'react';

export function Badge({ className = '', variant = 'default', ...props }) {
  const tones = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-slate-100 text-slate-700',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-slate-300 bg-transparent text-slate-700',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[variant] || tones.default} ${className}`} {...props} />;
}

export default Badge;
