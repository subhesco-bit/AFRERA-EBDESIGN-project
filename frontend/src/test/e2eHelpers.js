/**
 * E2E Testing Configuration & Helpers
 * Jest + Testing Library setup for comprehensive E2E coverage
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function with responsive testing support
 */
export function renderResponsive(component, options = {}) {
  const {
    viewport = 'md',
    viewportWidth = 1024,
    viewportHeight = 768,
    ...renderOptions
  } = options;

  // Set viewport size
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewportWidth,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewportHeight,
  });

  // Trigger resize event
  fireEvent.resize(window);

  return render(component, renderOptions);
}

/**
 * Test helper: Check element visibility at different viewports
 */
export async function testViewportVisibility(element, viewports) {
  const results = {};

  for (const [viewportName, { width, height }] of Object.entries(viewports)) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: height,
    });

    fireEvent.resize(window);
    await new Promise(resolve => setTimeout(resolve, 100));

    const style = window.getComputedStyle(element);
    results[viewportName] = {
      display: style.display,
      visibility: style.visibility,
      isVisible: style.display !== 'none' && style.visibility !== 'hidden',
    };
  }

  return results;
}

/**
 * Test helper: Verify responsive layout
 */
export async function testResponsiveLayout(container) {
  const issues = [];

  // Check for horizontal overflow
  if (container.scrollWidth > container.clientWidth) {
    issues.push('Horizontal overflow detected');
  }

  // Check z-index stacking
  const elements = container.querySelectorAll('[style*="z-index"]');
  const zIndices = new Set();

  elements.forEach(el => {
    const zIndex = window.getComputedStyle(el).zIndex;
    if (zIndices.has(zIndex)) {
      issues.push(`Duplicate z-index detected: ${zIndex}`);
    }
    zIndices.add(zIndex);
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test helper: Touch interaction simulation
 */
export async function simulateTouchInteraction(element, action = 'tap') {
  const user = userEvent.setup();

  switch (action) {
    case 'tap':
      await user.click(element);
      break;

    case 'longpress':
      fireEvent.touchStart(element);
      await new Promise(resolve => setTimeout(resolve, 500));
      fireEvent.touchEnd(element);
      break;

    case 'swipe':
      fireEvent.touchStart(element, {
        touches: [{ clientX: 0, clientY: 0 }],
      });
      fireEvent.touchMove(element, {
        touches: [{ clientX: 100, clientY: 0 }],
      });
      fireEvent.touchEnd(element);
      break;

    case 'pinch':
      fireEvent.touchStart(element, {
        touches: [
          { clientX: 0, clientY: 0 },
          { clientX: 100, clientY: 100 },
        ],
      });
      fireEvent.touchMove(element, {
        touches: [
          { clientX: 50, clientY: 50 },
          { clientX: 150, clientY: 150 },
        ],
      });
      fireEvent.touchEnd(element);
      break;

    default:
      throw new Error(`Unknown touch action: ${action}`);
  }
}

/**
 * Test helper: Verify API integration
 */
export async function testApiIntegration(endpoint, expectedResponse = {}) {
  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Verify response structure
    for (const key of Object.keys(expectedResponse)) {
      if (!(key in data)) {
        throw new Error(`Missing expected field: ${key}`);
      }
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test helper: Check accessibility
 */
export async function testAccessibility(container) {
  const issues = [];

  // Check for alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt || img.alt.trim() === '') {
      issues.push(`Image missing alt text: ${img.src}`);
    }
  });

  // Check for form labels
  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    if (!input.id || !container.querySelector(`label[for="${input.id}"]`)) {
      issues.push(`Input missing associated label: ${input.name || input.id}`);
    }
  });

  // Check heading hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;

  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    if (level > previousLevel + 1) {
      issues.push(`Heading hierarchy skip: from H${previousLevel} to H${level}`);
    }
    previousLevel = level;
  });

  // Check for keyboard navigation
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(el => {
    const tabIndex = el.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push(`Positive tabindex found: ${el.tagName}`);
    }
  });

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * Test helper: Performance metrics
 */
export async function measurePerformance(testFn) {
  const metrics = {
    startTime: performance.now(),
    endTime: 0,
    duration: 0,
    memoryUsed: 0,
  };

  const initialMemory = performance.memory?.usedJSHeapSize || 0;

  try {
    await testFn();
  } finally {
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.memoryUsed = (performance.memory?.usedJSHeapSize || 0) - initialMemory;
  }

  return metrics;
}

/**
 * Test helper: Mock device capabilities
 */
export function mockDeviceCapabilities(capabilities = {}) {
  const defaults = {
    camera: true,
    geolocation: true,
    microphone: true,
    notification: true,
  };

  const merged = { ...defaults, ...capabilities };

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: jest.fn(() =>
        merged.camera ? Promise.resolve({ getTracks: () => [] }) : Promise.reject(),
      ),
    },
  });

  Object.defineProperty(navigator, 'geolocation', {
    writable: true,
    value: {
      getCurrentPosition: jest.fn((success, error) =>
        merged.geolocation ? success() : error(),
      ),
    },
  });

  if ('Notification' in window) {
    Object.defineProperty(window, 'Notification', {
      writable: true,
      value: {
        permission: merged.notification ? 'granted' : 'denied',
      },
    });
  }
}

/**
 * Test helper: Snapshot testing for multiple viewports
 */
export async function testResponsiveSnapshots(component, viewports = {}) {
  const snapshots = {};

  for (const [viewportName, { width, height }] of Object.entries(viewports)) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: height,
    });

    fireEvent.resize(window);

    const { container } = render(component);
    snapshots[viewportName] = container.innerHTML;
  }

  return snapshots;
}

/**
 * Setup function for E2E tests
 */
export function setupE2EEnvironment() {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  };

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  };

  // Mock requestAnimationFrame
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

export default {
  renderResponsive,
  testViewportVisibility,
  testResponsiveLayout,
  simulateTouchInteraction,
  testApiIntegration,
  testAccessibility,
  measurePerformance,
  mockDeviceCapabilities,
  testResponsiveSnapshots,
  setupE2EEnvironment,
};
