/**
 * Accessibility Enhancements System
 * Production-level accessibility features for WCAG 2.1 AA compliance
 * 
 * Features:
 * - ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader optimizations
 * - Focus management
 * - Skip links
 * - Live regions
 * - Reduced motion support
 * - High contrast mode support
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

// ARIA attribute generators
export const aria = {
  label: (text) => ({ 'aria-label': text }),
  labelledBy: (id) => ({ 'aria-labelledby': id }),
  describedBy: (id) => ({ 'aria-describedby': id }),
  required: () => ({ 'aria-required': 'true' }),
  invalid: () => ({ 'aria-invalid': 'true' }),
  disabled: () => ({ 'aria-disabled': 'true' }),
  expanded: (isExpanded) => ({ 'aria-expanded': isExpanded.toString() }),
  checked: (isChecked) => ({ 'aria-checked': isChecked.toString() }),
  pressed: (isPressed) => ({ 'aria-pressed': isPressed.toString() }),
  selected: (isSelected) => ({ 'aria-selected': isSelected.toString() }),
  hasPopup: (type) => ({ 'aria-haspopup': type }),
  current: (page) => ({ 'aria-current': page }),
  live: (level) => ({ 'aria-live': level }),
  atomic: (isAtomic) => ({ 'aria-atomic': isAtomic.toString() }),
  relevant: (additions) => ({ 'aria-relevant': additions }),
  busy: (isBusy) => ({ 'aria-busy': isBusy.toString() }),
  controls: (id) => ({ 'aria-controls': id }),
  owns: (id) => ({ 'aria-owns': id }),
  hidden: (isHidden) => ({ 'aria-hidden': isHidden.toString() })
};

// Skip links component
export const SkipLinks = () => {
  const links = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'search', label: 'Skip to search' }
  ];

  return (
    <div className="sr-only">
      {links.map(link => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-blue-600 focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Focus trap component for modals
export const FocusTrap = ({ children, isActive, onEscape }) => {
  const trapRef = useRef(null);
  const previousFocusRef = useRef(null);

  const getFocusableElements = useCallback(() => {
    if (!trapRef.current) return [];
    
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return trapRef.current.querySelectorAll(focusableSelectors.join(','));
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (!isActive) return;

    if (e.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements, onEscape]);

  useEffect(() => {
    if (!isActive) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement;

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, handleKeyDown, getFocusableElements]);

  return <div ref={trapRef} tabIndex={-1}>{children}</div>;
};

// Live region for announcements
export const LiveRegion = ({ message, level = 'polite', atomic = false }) => {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic={atomic.toString()}
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Screen reader only content
export const ScreenReaderOnly = ({ children, as = 'span' }) => {
  const Tag = as;
  return (
    <Tag className="sr-only">
      {children}
    </Tag>
  );
};

// Visually hidden but accessible
export const VisuallyHidden = ({ children, as = 'span' }) => {
  const Tag = as;
  return (
    <Tag className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </Tag>
  );
};

// Keyboard navigation hook
export const useKeyboardNavigation = (items, onSelect, onClose) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        if (onClose) onClose();
        break;
    }
  }, [items, focusedIndex, onSelect, onClose]);

  return { focusedIndex, handleKeyDown, setFocusedIndex };
};

// Focus management hook
export const useFocusManagement = (initialFocus = null) => {
  const [isFocused, setIsFocused] = useState(false);
  const elementRef = useRef(null);

  const focus = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.focus();
      setIsFocused(true);
    }
  }, []);

  const blur = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.blur();
      setIsFocused(false);
    }
  }, []);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  useEffect(() => {
    if (initialFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [initialFocus]);

  return {
    elementRef,
    isFocused,
    focus,
    blur,
    handleFocus,
    handleBlur,
    focusProps: {
      ref: elementRef,
      onFocus: handleFocus,
      onBlur: handleBlur
    }
  };
};

// Reduced motion detection
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// High contrast mode detection
export const useHighContrastMode = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (e) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
};

// Accessible button component
export const AccessibleButton = ({
  children,
  icon,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}) => {
  const { focusProps, isFocused } = useFocusManagement();

  return (
    <button
      {...focusProps}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="mr-2" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
};

// Accessible form field wrapper
export const AccessibleField = ({
  label,
  error,
  helper,
  required = false,
  children,
  id
}) => {
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const labelId = `${id}-label`;

  return (
    <div className="space-y-1">
      <label
        id={labelId}
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children, {
        id,
        'aria-labelledby': labelId,
        'aria-describedby': error ? errorId : helperId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-required': required ? 'true' : 'false'
      })}
      
      {helper && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helper}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible modal component
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const modalRef = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      onKeyDown={handleKeyDown}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <FocusTrap isActive={isOpen} onEscape={onClose}>
        <div
          ref={modalRef}
          className={`relative bg-white rounded-lg shadow-xl w-full ${
            size === 'sm' ? 'max-w-md' :
            size === 'md' ? 'max-w-lg' :
            size === 'lg' ? 'max-w-2xl' : 'max-w-4xl'
          }`}
          tabIndex={-1}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id={titleId.current} className="text-xl font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

// Accessible tabs component
export const AccessibleTabs = ({ tabs, activeTab, onChange }) => {
  const tabsRef = useRef([]);

  const handleKeyDown = (e, index) => {
    let targetIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        onChange(tabs[targetIndex].id);
        tabsRef.current[targetIndex]?.focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        targetIndex = (index + 1) % tabs.length;
        onChange(tabs[targetIndex].id);
        tabsRef.current[targetIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        onChange(tabs[0].id);
        tabsRef.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        onChange(tabs[tabs.length - 1].id);
        tabsRef.current[tabs.length - 1]?.focus();
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Tabs">
      <div className="border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => tabsRef.current[index] = el}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              px-4 py-2 text-sm font-medium border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-blue-500
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.icon && <span className="mr-2" aria-hidden="true">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map(tab => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="py-4"
        >
          {activeTab === tab.id && tab.content}
        </div>
      ))}
    </div>
  );
};

// Accessibility announcement hook
export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message, level = 'polite') => {
    setAnnouncement({ message, level });
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  const AnnouncementComponent = () => (
    <LiveRegion
      message={typeof announcement === 'string' ? announcement : announcement?.message}
      level={typeof announcement === 'string' ? 'polite' : announcement?.level}
    />
  );

  return { announce, AnnouncementComponent };
};

export default {
  aria,
  SkipLinks,
  FocusTrap,
  LiveRegion,
  ScreenReaderOnly,
  VisuallyHidden,
  useKeyboardNavigation,
  useFocusManagement,
  useReducedMotion,
  useHighContrastMode,
  AccessibleButton,
  AccessibleField,
  AccessibleModal,
  AccessibleTabs,
  useAnnouncement
};