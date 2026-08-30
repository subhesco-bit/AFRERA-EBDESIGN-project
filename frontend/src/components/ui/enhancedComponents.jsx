/**
 * Enhanced UI Components - Production Level Polish
 * Advanced components with loading states, transitions, micro-interactions
 * 
 * Features:
 * - Smooth animations and transitions
 * - Loading states and skeletons
 * - Hover effects and micro-interactions
 * - Accessibility enhancements
 * - Responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Card with hover effects and transitions
export const EnhancedCard = ({ 
  children, 
  className = '', 
  hover = true,
  onClick,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 ${hover ? 'hover:shadow-2xl hover:scale-[1.02]' : ''} ${isHovered ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} ${className}`}
      whileHover={hover ? { y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Enhanced Button with loading states and animations
export const EnhancedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  onClick,
  icon: Icon,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg shadow-blue-500/30',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 focus:ring-gray-500 shadow-lg shadow-gray-500/30',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg shadow-green-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg shadow-red-500/30',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 focus:ring-yellow-500 shadow-lg shadow-yellow-500/30',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Enhanced Badge with animations
export const EnhancedBadge = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  pulse = false,
  className = '' 
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300',
    success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300',
    danger: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300',
    warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300',
    info: 'bg-gradient-to-r from-cyan-100 to-cyan-200 text-cyan-800 border border-cyan-300'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base'
  };

  return (
    <motion.span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        transition: { duration: 2, repeat: Infinity }
      } : {}}
    >
      {children}
    </motion.span>
  );
};

// Enhanced Alert with animations and dismiss
export const EnhancedAlert = ({ 
  children, 
  variant = 'info', 
  dismissible = false,
  className = '',
  onDismiss,
  ...props 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-800',
    secondary: 'bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-gray-500 text-gray-800',
    success: 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800',
    danger: 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800',
    warning: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-800',
    info: 'bg-gradient-to-r from-cyan-50 to-cyan-100 border-l-4 border-cyan-500 text-cyan-800'
  };

  const icons = {
    primary: 'ℹ️',
    secondary: '📋',
    success: '✅',
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`p-4 rounded-r-lg shadow-md ${variantClasses[variant]} ${className}`}
          {...props}
        >
          <div className="flex items-start">
            <span className="text-xl mr-3">{icons[variant]}</span>
            <div className="flex-1">{children}</div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="ml-4 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced Input with validation states and animations
export const EnhancedInput = ({
  label,
  error,
  helper,
  icon: Icon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    if (props.onChange) props.onChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <motion.label
          initial={{ y: 0 }}
          animate={{ 
            y: isFocused || hasValue ? -24 : 0,
            scale: isFocused || hasValue ? 0.85 : 1
          }}
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            isFocused || hasValue 
              ? 'text-blue-600 text-xs bg-white px-1' 
              : 'text-gray-500 text-base'
          }`}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors ${isFocused ? 'text-blue-600' : ''}`} />
        )}
        
        <input
          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none ${
            Icon ? 'pl-10' : ''
          } ${
            error 
              ? 'border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
          } ${isFocused ? 'shadow-lg' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          {...props}
        />
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-sm mt-1"
          >
            {error}
          </motion.p>
        )}
        {helper && !error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-500 text-sm mt-1"
          >
            {helper}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Loading Skeleton
export const LoadingSkeleton = ({ 
  variant = 'text', 
  lines = 3, 
  className = '' 
}) => {
  const variants = {
    text: 'h-4',
    circular: 'w-12 h-12 rounded-full',
    rectangular: 'h-32',
    avatar: 'w-10 h-10 rounded-full'
  };

  const getWidth = (index) => {
    if (variant !== 'text') return '100%';
    const widths = ['80%', '60%', '90%', '70%', '85%'];
    return widths[index % widths.length];
  };

  const skeletonStyle = (index) => ({
    width: getWidth(index)
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={`skeleton-${i}`}
          className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${variants[variant]}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          style={skeletonStyle(i)}
        />
      ))}
    </div>
  );
};

// Enhanced Modal with animations
export const EnhancedModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${className}`}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// Enhanced Tooltip
export const EnhancedTooltip = ({
  children,
  content,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setIsVisible(true);
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute ${positionClasses[position]} left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 ${className}`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Progress Bar
export const EnhancedProgressBar = ({
  value = 0,
  max = 100,
  color = 'blue',
  animated = true,
  showLabel = true,
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    yellow: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${colorClasses[color]} ${animated ? 'animate-pulse' : ''}`}
        />
      </div>
    </div>
  );
};

// Enhanced Toast Notification
export const EnhancedToast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  className = ''
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`fixed bottom-4 right-4 ${typeClasses[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${className}`}
    >
      <span className="text-xl">{icons[type]}</span>
      <span>{message}</span>
    </motion.div>
  );
};

export default {
  EnhancedCard,
  EnhancedButton,
  EnhancedBadge,
  EnhancedAlert,
  EnhancedInput,
  LoadingSkeleton,
  EnhancedModal,
  EnhancedTooltip,
  EnhancedProgressBar,
  EnhancedToast
};