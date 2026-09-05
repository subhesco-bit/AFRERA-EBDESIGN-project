/**
 * Visual Responsive Testing Suite
 * Tests across mobile (xs, sm), tablet (md, lg), and desktop (xl, 2xl) viewports
 * Verifies layout, interactions, and accessibility across all device sizes
 */

import React, { useState, useEffect, useCallback } from 'react';
import deviceDetection from '../../utils/deviceDetection';

// Viewport definitions matching Tailwind breakpoints
const VIEWPORTS = {
  xs: { width: 320, height: 568, name: 'iPhone SE', type: 'mobile' },
  sm: { width: 480, height: 800, name: 'iPhone 13', type: 'mobile' },
  md: { width: 768, height: 1024, name: 'iPad Mini', type: 'tablet' },
  lg: { width: 1024, height: 768, name: 'iPad Pro', type: 'tablet' },
  xl: { width: 1280, height: 720, name: 'Laptop', type: 'desktop' },
  '2xl': { width: 1536, height: 864, name: '4K Desktop', type: 'desktop' },
};

/**
 * Responsive Test Component
 * Renders component at multiple viewport sizes and validates layout
 */
export const ResponsiveTestWrapper = ({
  children,
  component: Component,
  testName,
  onTestComplete,
}) => {
  const [currentViewport, setCurrentViewport] = useState('xs');
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runResponsiveTest = useCallback(async () => {
    setIsRunning(true);
    const results = {};

    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      try {
        // Simulate viewport
        window.resizeTo(viewport.width, viewport.height);

        // Wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Validate viewport
        results[key] = await validateViewport(key, viewport);

        // Move to next viewport
        setCurrentViewport(key);
      } catch (error) {
        results[key] = {
          success: false,
          error: error.message,
        };
      }
    }

    setTestResults(results);
    setIsRunning(false);
    onTestComplete?.(results);
  }, [onTestComplete]);

  useEffect(() => {
    // Auto-run on mount if provided
    if (testName) {
      runResponsiveTest();
    }
  }, [testName, runResponsiveTest]);

  const viewport = VIEWPORTS[currentViewport];

  return (
    <div className="responsive-test-wrapper">
      {/* Viewport Selector */}
      <div className="sticky top-0 z-50 bg-white border-b p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Viewport:</span>
            <select
              value={currentViewport}
              onChange={e => setCurrentViewport(e.target.value)}
              disabled={isRunning}
              className="px-3 py-2 border rounded-md text-sm font-medium bg-white"
            >
              {Object.entries(VIEWPORTS).map(([key, vp]) => (
                <option key={key} value={key}>
                  {vp.name} ({vp.width}x{vp.height})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{viewport.width}×{viewport.height}px</span>
            <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {viewport.type}
            </span>
          </div>

          <button
            onClick={runResponsiveTest}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Testing...' : 'Run Full Test'}
          </button>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
            {Object.entries(VIEWPORTS).map(([key, vp]) => {
              const result = testResults[key];
              const status = result?.success ? '✓' : result ? '✗' : '-';
              const statusColor =
                result?.success ?
                  'bg-green-100 text-green-700' :
                  result ?
                    'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700';

              return (
                <div
                  key={key}
                  className={`text-center p-2 rounded-md text-xs font-semibold ${statusColor}`}
                >
                  {vp.name.split(' ')[0]}
                  <div className="text-lg">{status}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Component Container */}
      <div
        className="responsive-test-container bg-gray-50 flex items-center justify-center"
        style={{
          width: viewport.width,
          height: viewport.height,
          margin: '0 auto',
        }}
      >
        <div className="w-full h-full bg-white shadow-lg overflow-auto">
          {Component ? <Component viewport={currentViewport} /> : children}
        </div>
      </div>

      {/* Debug Info */}
      <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs font-mono">
        <h3 className="font-bold mb-2">Device Detection Info:</h3>
        <pre>{JSON.stringify(deviceDetection.getDeviceInfo(), null, 2)}</pre>
      </div>
    </div>
  );
};

/**
 * Validate viewport for layout issues
 */
async function validateViewport(viewportKey, viewport) {
  const errors = [];

  try {
    // Check for horizontal scroll
    if (document.body.scrollWidth > window.innerWidth + 1) {
      errors.push('Horizontal scroll detected');
    }

    // Check for overlapping elements
    const overlaps = checkElementOverlaps();
    if (overlaps.length > 0) {
      errors.push(`${overlaps.length} overlapping elements found`);
    }

    // Check text readability
    const textIssues = checkTextReadability();
    if (textIssues.length > 0) {
      errors.push(`Text readability issues: ${textIssues.join(', ')}`);
    }

    // Check touch targets (mobile only)
    if (viewport.type === 'mobile') {
      const touchIssues = checkTouchTargets();
      if (touchIssues.length > 0) {
        errors.push(`Touch target issues: ${touchIssues.join(', ')}`);
      }
    }

    // Check image loading
    const imageIssues = await checkImageLoading();
    if (imageIssues.length > 0) {
      errors.push(`Image loading issues: ${imageIssues.join(', ')}`);
    }

    return {
      success: errors.length === 0,
      viewport: viewportKey,
      size: `${viewport.width}x${viewport.height}`,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      viewport: viewportKey,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check for overlapping elements
 */
function checkElementOverlaps() {
  const overlaps = [];
  const elements = document.querySelectorAll('[data-test-layout]');

  for (let i = 0; i < elements.length; i++) {
    const rect1 = elements[i].getBoundingClientRect();

    for (let j = i + 1; j < elements.length; j++) {
      const rect2 = elements[j].getBoundingClientRect();

      // Check for overlap with tolerance
      const tolerance = 5;
      if (
        rect1.left < rect2.right - tolerance &&
        rect1.right > rect2.left + tolerance &&
        rect1.top < rect2.bottom - tolerance &&
        rect1.bottom > rect2.top + tolerance
      ) {
        overlaps.push(`${elements[i].id || 'unknown'} overlaps ${elements[j].id || 'unknown'}`);
      }
    }
  }

  return overlaps;
}

/**
 * Check text readability
 */
function checkTextReadability() {
  const issues = [];
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li');

  textElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight);

    // Check minimum font size (12px)
    if (fontSize < 12) {
      issues.push(`Small text detected (${fontSize}px)`);
    }

    // Check line height (should be 1.5x)
    if (lineHeight / fontSize < 1.4) {
      issues.push(`Poor line height (${(lineHeight / fontSize).toFixed(2)})`);
    }

    // Check contrast ratio
    const contrast = getContrastRatio(el);
    if (contrast < 4.5) {
      issues.push(`Low contrast (${contrast.toFixed(2)})`);
    }
  });

  return [...new Set(issues)]; // Remove duplicates
}

/**
 * Check touch target sizes
 */
function checkTouchTargets() {
  const issues = [];
  const touchTargets = document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');

  touchTargets.forEach(target => {
    const rect = target.getBoundingClientRect();
    const minSize = 44; // iOS recommendation

    if (rect.width < minSize || rect.height < minSize) {
      issues.push(
        `Small touch target: ${target.tagName} (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
      );
    }
  });

  return issues;
}

/**
 * Check image loading and sizing
 */
async function checkImageLoading() {
  const issues = [];
  const images = document.querySelectorAll('img');

  for (const img of images) {
    // Check if image loaded
    if (!img.complete) {
      issues.push(`Image not loaded: ${img.src || img.id}`);
    }

    // Check for error state
    if (img.naturalHeight === 0) {
      issues.push(`Failed to load: ${img.src}`);
    }

    // Check for proper sizing
    const rect = img.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
      issues.push(`Tiny image detected: ${img.src || img.id}`);
    }
  }

  return issues;
}

/**
 * Calculate contrast ratio between text and background
 */
function getContrastRatio(element) {
  const style = window.getComputedStyle(element);
  const fgColor = style.color;
  const bgColor = style.backgroundColor;

  // Simplified contrast calculation
  // In production, use a library like polished
  const fgLum = getLuminance(fgColor);
  const bgLum = getLuminance(bgColor);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate luminance of color
 */
function getLuminance(color) {
  // Parse color and return luminance (0-1)
  // Simplified version - in production use proper color library
  if (color.includes('rgb')) {
    const match = color.match(/\d+/g);
    const r = parseInt(match[0]) / 255;
    const g = parseInt(match[1]) / 255;
    const b = parseInt(match[2]) / 255;

    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  return 0.5; // Fallback
}

export default ResponsiveTestWrapper;
