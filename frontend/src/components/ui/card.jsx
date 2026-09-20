import React from 'react';

function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`mb-4 space-y-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className = '', children, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`mt-4 flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
