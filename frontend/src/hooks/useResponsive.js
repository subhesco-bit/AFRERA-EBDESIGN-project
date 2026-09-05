/**
 * Responsive Testing Hooks
 * Custom React hooks for responsive testing and device detection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import deviceDetection from '../utils/deviceDetection';

/**
 * Hook: Track viewport changes and provide viewport info
 */
export function useResponsiveViewport() {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  });

  useEffect(() => {
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setViewport({
          width,
          height,
          isMobile: width < 768,
          isTablet: width >= 768 && width < 1024,
          isDesktop: width >= 1024,
        });
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return viewport;
}

/**
 * Hook: Detect device type and capabilities
 */
export function useDeviceDetection() {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDevice = async () => {
      try {
        await deviceDetection.initialize();
        setDevice(deviceDetection.getDeviceInfo());
      } catch (error) {
        console.error('Device detection failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDevice();
  }, []);

  const getDeviceType = useCallback(() => {
    return deviceDetection.getDeviceType();
  }, []);

  const hasCapability = useCallback((capability) => {
    return deviceDetection.hasCapability(capability);
  }, []);

  return {
    device,
    loading,
    getDeviceType,
    hasCapability,
    isNative: deviceDetection.isRunningNative(),
  };
}

/**
 * Hook: Handle orientation changes
 */
export function useOrientationChange(callback) {
  useEffect(() => {
    const unsubscribe = deviceDetection.onOrientationChange((info) => {
      callback?.(info);
    });

    return () => unsubscribe?.();
  }, [callback]);
}

/**
 * Hook: Handle viewport changes
 */
export function useViewportChange(callback) {
  useEffect(() => {
    let unsubscribe = deviceDetection.onViewportChange((info) => {
      callback?.(info);
    });

    return () => unsubscribe?.();
  }, [callback]);
}

/**
 * Hook: Responsive component with conditional rendering
 */
export function useResponsiveComponent(components = {}) {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let resizeTimeout;

    let handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const getComponent = useCallback(() => {
    let width = viewport.width;

    if (width < 480) return components.xs || components.mobile;
    if (width < 768) return components.sm || components.mobile;
    if (width < 1024) return components.md || components.tablet;
    if (width < 1280) return components.lg || components.tablet;
    return components.xl || components.desktop || components['2xl'];
  }, [viewport.width, components]);

  return {
    viewport,
    component: getComponent(),
    getComponent,
  };
}

/**
 * Hook: Test layout for responsive issues
 */
export function useResponsiveLayoutTest() {
  const [issues, setIssues] = useState([]);
  const testTimeoutRef = useRef(null);

  const runTest = useCallback(async () => {
    const testIssues = [];

    // Check for horizontal scroll
    if (document.body.scrollWidth > window.innerWidth + 1) {
      testIssues.push({
        type: 'horizontal-scroll',
        severity: 'error',
        message: 'Horizontal scroll detected',
      });
    }

    // Check for overlapping elements
    const elements = document.querySelectorAll('[data-test-layout]');
    elements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      elements.forEach((el2, idx2) => {
        if (idx < idx2) {
          const rect2 = el2.getBoundingClientRect();

          if (
            rect.left < rect2.right &&
            rect.right > rect2.left &&
            rect.top < rect2.bottom &&
            rect.bottom > rect2.top
          ) {
            testIssues.push({
              type: 'overlapping-elements',
              severity: 'warning',
              message: `Elements overlap: ${el.id} and ${el2.id}`,
            });
          }
        }
      });
    });

    // Check text readability
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);

      if (fontSize < 12) {
        testIssues.push({
          type: 'small-font',
          severity: 'warning',
          message: `Small font detected: ${fontSize}px (recommended 12px+)`,
        });
      }
    });

    // Check touch targets (mobile)
    if (window.innerWidth < 768) {
      const buttons = document.querySelectorAll('button, a');
      buttons.forEach(btn => {
        let rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          testIssues.push({
            type: 'small-touch-target',
            severity: 'warning',
            message: `Small touch target: ${Math.round(rect.width)}x${Math.round(rect.height)}px (recommended 44x44px)`,
          });
        }
      });
    }

    setIssues(testIssues);
    return testIssues;
  }, []);

  return {
    issues,
    runTest,
    hasErrors: issues.some(i => i.severity === 'error'),
    hasWarnings: issues.some(i => i.severity === 'warning'),
  };
}

/**
 * Hook: Performance monitoring for responsive changes
 */
export function useResponsivePerformance() {
  const [performance, setPerformance] = useState({
    renderTime: 0,
    layoutShifts: 0,
    lastUpdate: null,
  });

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      setPerformance(prev => ({
        ...prev,
        renderTime: performance.now?.() || Date.now(),
        layoutShifts: prev.layoutShifts + 1,
        lastUpdate: new Date().toISOString(),
      }));
    });

    document.querySelectorAll('[data-test-layout]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return performance;
}

/**
 * Hook: Mock device for testing
 */
export function useMockDevice(mockConfig = {}) {
  const [mockDevice, setMockDevice] = useState({
    platform: 'ios',
    type: 'mobile',
    width: 375,
    height: 667,
    ...mockConfig,
  });

  const updateMock = useCallback((updates) => {
    setMockDevice(prev => ({ ...prev, ...updates }));

    // Update viewport
    window.resizeTo(updates.width || mockDevice.width, updates.height || mockDevice.height);
  }, [mockDevice]);

  const presets = {
    iPhoneSE: () => updateMock({ width: 375, height: 667, type: 'mobile' }),
    iPhone13: () => updateMock({ width: 390, height: 844, type: 'mobile' }),
    iPadMini: () => updateMock({ width: 768, height: 1024, type: 'tablet' }),
    iPadPro: () => updateMock({ width: 1024, height: 1366, type: 'tablet' }),
    laptop: () => updateMock({ width: 1280, height: 720, type: 'desktop' }),
    desktop4K: () => updateMock({ width: 3840, height: 2160, type: 'desktop' }),
  };

  return {
    mockDevice,
    updateMock,
    presets,
  };
}

export default {
  useResponsiveViewport,
  useDeviceDetection,
  useOrientationChange,
  useViewportChange,
  useResponsiveComponent,
  useResponsiveLayoutTest,
  useResponsivePerformance,
  useMockDevice,
};
