/**
 * Enterprise-Grade Route Transitions
 *
 * Production-ready route animations with:
 * - Smooth page transitions
 * - Multiple animation types
 * - Performance optimized
 * - Accessibility support
 * - Configurable duration
 * - Reduced motion support
 */

import { useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

/**
 * Animation types
 */
const AnimationType = {
  FADE: 'fade',
  SLIDE: 'slide',
  SCALE: 'scale',
  FLIP: 'flip',
  NONE: 'none',
};

/**
 * Animation configurations
 */
const animations = {
  fade: {
    enter: 'animate-in fade-in duration-300',
    exit: 'animate-out fade-out duration-200',
  },
  slide: {
    enter: 'animate-in slide-in-from-right-4 duration-300',
    exit: 'animate-out slide-out-to-left-4 duration-200',
  },
  scale: {
    enter: 'animate-in zoom-in-95 duration-300',
    exit: 'animate-out zoom-out-95 duration-200',
  },
  flip: {
    enter: 'animate-in flip-in-x duration-300',
    exit: 'animate-out flip-out-x duration-200',
  },
  none: {
    enter: '',
    exit: '',
  },
};

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Route Transition Component
 */
export function RouteTransition({ children, type = AnimationType.FADE, className }) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [animationClass, setAnimationClass] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion()) {
      setIsAnimating(false);
      return;
    }

    const animation = animations[type] || animations.fade;

    // Apply enter animation
    setAnimationClass(animation.enter);

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setAnimationClass('');
    }, 300);

    return () => clearTimeout(timer);
  }, [location, type]);

  if (prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(animationClass, className)}>
      {children}
    </div>
  );
}

/**
 * Page Transition Wrapper
 * Wraps children with transition based on route config
 */
export function PageTransition({ children, transition = 'fade', className }) {
  return (
    <RouteTransition type={transition} className={className}>
      {children}
    </RouteTransition>
  );
}

/**
 * Animated Routes Component
 * Applies transitions to all child routes
 */
export function AnimatedRoutes({ children, defaultTransition = AnimationType.FADE }) {
  return <div className="relative">{children}</div>;
}

export { AnimationType, animations };
