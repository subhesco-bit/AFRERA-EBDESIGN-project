/**
 * Responsive Design Hooks
 * Production-level responsive design utilities and hooks
 *
 * Features:
 * - Breakpoint detection
 * - Orientation detection
 * - Device type detection
 * - Viewport utilities
 * - Responsive value mapping
 */

import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Hook to detect current breakpoint
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xs');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({ width, height });

      if (width < BREAKPOINTS.sm) {
        setBreakpoint('xs');
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint('sm');
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('md');
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint('lg');
      } else if (width < BREAKPOINTS['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { breakpoint, windowSize };
};

// Hook to check if current breakpoint matches or is above
export const useIsBreakpointUp = (breakpoint) => {
  const { breakpoint: currentBreakpoint } = useBreakpoint();
  const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(breakpoint);

  return currentIndex >= targetIndex;
};

// Hook to check if current breakpoint matches or is below
export const useIsBreakpointDown = (breakpoint) => {
  const { breakpoint: currentBreakpoint } = useBreakpoint();
  let breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  let currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  let targetIndex = breakpointOrder.indexOf(breakpoint);

  return currentIndex <= targetIndex;
};

// Hook to check if current breakpoint is between two values
export const useIsBreakpointBetween = (minBreakpoint, maxBreakpoint) => {
  const isUp = useIsBreakpointUp(minBreakpoint);
  const isDown = useIsBreakpointDown(maxBreakpoint);
  return isUp && isDown;
};

// Hook to detect device type
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    let width = window.innerWidth;

    let type = 'desktop';

    // Check for mobile
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent) || width < 768) {
      type = 'mobile';
    }
    // Check for tablet
    else if (/tablet|ipad/i.test(userAgent) || (width >= 768 && width < 1024)) {
      type = 'tablet';
    }

    setDeviceType(type);
  }, []);

  return deviceType;
};

// Hook to detect orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);

    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

// Hook to get responsive value based on breakpoint
export const useResponsiveValue = (values) => {
  const { breakpoint } = useBreakpoint();

  let breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  let currentIndex = breakpointOrder.indexOf(breakpoint);

  // Find the largest breakpoint that has a defined value
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  // Default to xs value if nothing else matches
  return values.xs;
};

// Hook to detect if device supports touch
export const useTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0,
      );
    };

    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });

    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

  return isTouch;
};

// Hook to detect if user prefers reduced motion
export const usePrefersReducedMotion = () => {
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

// Hook to detect if device has high pixel density
export const useRetinaDisplay = () => {
  const [isRetina, setIsRetina] = useState(false);

  useEffect(() => {
    const checkRetina = () => {
      setIsRetina(
        window.devicePixelRatio > 1 ||
        window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches ||
        window.matchMedia('(min-resolution: 192dpi)').matches,
      );
    };

    checkRetina();
  }, []);

  return isRetina;
};

// Hook to get safe area insets (for notched phones)
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      setInsets({
        top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0,
        right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right')) || 0,
        bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0,
        left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left')) || 0,
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);

    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

// Hook to get viewport dimensions
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Hook to detect if viewport is in landscape mode
export const useIsLandscape = () => {
  const { width, height } = useViewport();
  return width > height;
};

// Hook to detect if viewport is in portrait mode
export const useIsPortrait = () => {
  const { width, height } = useViewport();
  return height > width;
};

// Hook to get responsive spacing
export const useResponsiveSpacing = () => {
  const { breakpoint } = useBreakpoint();

  const spacingMap = {
    xs: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2rem', xl: '3rem' },
    sm: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2rem', xl: '3rem' },
    md: { xs: '1rem', sm: '1.5rem', md: '2rem', lg: '3rem', xl: '4rem' },
    lg: { xs: '1rem', sm: '1.5rem', md: '2rem', lg: '3rem', xl: '4rem' },
    xl: { xs: '1.5rem', sm: '2rem', md: '3rem', lg: '4rem', xl: '6rem' },
    '2xl': { xs: '2rem', sm: '3rem', md: '4rem', lg: '6rem', xl: '8rem' },
  };

  return spacingMap[breakpoint] || spacingMap.md;
};

// Hook to create responsive styles
export const useResponsiveStyles = (styleMap) => {
  const { breakpoint } = useBreakpoint();
  return styleMap[breakpoint] || styleMap.md || {};
};

// Media query hook for custom breakpoints
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    let mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    let handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Hook to detect if user is on iOS device
export const useIsIOS = () => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    );
  }, []);

  return isIOS;
};

// Hook to detect if user is on Android device
export const useIsAndroid = () => {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/Android/.test(navigator.userAgent));
  }, []);

  return isAndroid;
};

// Responsive container component
export const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 6 },
  gap = { xs: 1, sm: 2, md: 4, lg: 6, xl: 8 },
  className = '',
}) => {
  const { breakpoint } = useBreakpoint();
  const currentCols = cols[breakpoint] || cols.md;
  const currentGap = gap[breakpoint] || gap.md;

  return (
    <div
      className={`grid gap-${currentGap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
        gap: `${currentGap * 0.25}rem`,
      }}
    >
      {children}
    </div>
  );
};

// Responsive text component
export const ResponsiveText = ({
  children,
  size = { xs: 'sm', sm: 'base', md: 'lg', lg: 'xl', xl: '2xl' },
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  };

  const { breakpoint } = useBreakpoint();
  const currentSize = size[breakpoint] || size.md;
  const sizeClass = sizeClasses[currentSize] || sizeClasses.base;

  return (
    <span className={`${sizeClass} ${className}`}>
      {children}
    </span>
  );
};

export default {
  useBreakpoint,
  useIsBreakpointUp,
  useIsBreakpointDown,
  useIsBreakpointBetween,
  useDeviceType,
  useOrientation,
  useResponsiveValue,
  useTouchDevice,
  usePrefersReducedMotion,
  useRetinaDisplay,
  useSafeAreaInsets,
  useViewport,
  useIsLandscape,
  useIsPortrait,
  useResponsiveSpacing,
  useResponsiveStyles,
  useMediaQuery,
  useIsIOS,
  useIsAndroid,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveText,
};
