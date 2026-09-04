/**
 * Enterprise-Grade Accessibility Utilities
 *
 * Production-ready accessibility with:
 * - ARIA label generation
 * - Keyboard navigation helpers
 * - Focus management
 * - Screen reader support
 * - High contrast mode detection
 * - Reduced motion detection
 * - Accessibility audit helpers
 * - WCAG compliance checks
 */

/**
 * Generate unique ID for accessibility attributes
 */
function generateAriaId() {
  return `aria-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate ARIA label from content
 */
function generateAriaLabel(content, context = '') {
  if (!content) return '';

  // Remove HTML tags
  const textContent = content.replace(/<[^>]*>/g, '').trim();

  // Add context if provided
  return context ? `${context}: ${textContent}` : textContent;
}

/**
 * Generate ARIA description
 */
function generateAriaDescription(description) {
  if (!description) return '';
  return description.replace(/<[^>]*>/g, '').trim();
}

/**
 * Check if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if high contrast mode is enabled
 */
function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Check if dark mode is preferred
 */
function prefersDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Focus management utilities
 */
const focusManager = {
  /**
   * Focus element by ID
   */
  focusById(id) {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst(container) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Focus last focusable element in container
   */
  focusLast(container) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Get all focusable elements in container
   */
  getFocusableElements(container) {
    if (!container) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Trap focus within container (for modals, dialogs)
   */
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

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
    };

    container.addEventListener('keydown', handleTab);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus(previousElement) {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  },

  /**
   * Save current focused element
   */
  saveFocus() {
    return document.activeElement;
  },
};

/**
 * Keyboard navigation helpers
 */
const keyboardNav = {
  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation(e, items, currentIndex, callback) {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    if (callback) {
      callback(newIndex, items[newIndex]);
    }
  },

  /**
   * Handle escape key
   */
  handleEscape(e, callback) {
    if (e.key === 'Escape' && callback) {
      callback(e);
    }
  },

  /**
   * Handle enter key
   */
  handleEnter(e, callback) {
    if (e.key === 'Enter' && callback) {
      callback(e);
    }
  },

  /**
   * Handle space key
   */
  handleSpace(e, callback) {
    if (e.key === ' ' && callback) {
      e.preventDefault();
      callback(e);
    }
  },
};

/**
 * Screen reader utilities
 */
const screenReader = {
  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create visually hidden but screen reader accessible element
   */
  createHiddenElement(content) {
    const element = document.createElement('span');
    element.className = 'sr-only';
    element.textContent = content;
    return element;
  },
};

/**
 * Accessibility audit helpers
 */
const accessibilityAudit = {
  /**
   * Check for missing alt text on images
   */
  checkMissingAltText() {
    const images = document.querySelectorAll('img');
    const missingAlt = [];

    images.forEach((img, index) => {
      if (!img.alt || img.alt.trim() === '') {
        missingAlt.push({
          element: img,
          index,
          src: img.src,
        });
      }
    });

    return missingAlt;
  },

  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level > previousLevel + 1) {
        issues.push({
          element: heading,
          currentLevel: level,
          previousLevel,
          message: `Heading level skipped from h${previousLevel} to h${level}`,
        });
      }

      previousLevel = level;
    });

    return issues;
  },

  /**
   * Check for proper form labels
   */
  checkFormLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const unlabeled = [];

    inputs.forEach((input) => {
      const hasLabel =
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        document.querySelector(`label[for="${input.id}"]`) ||
        input.closest('label');

      if (!hasLabel && input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
        unlabeled.push({
          element: input,
          type: input.type,
          name: input.name,
        });
      }
    });

    return unlabeled;
  },

  /**
   * Check for proper button labels
   */
  checkButtonLabels() {
    const buttons = document.querySelectorAll('button, [role="button"]');
    const unlabeled = [];

    buttons.forEach((button) => {
      const hasLabel =
        button.textContent.trim() ||
        button.getAttribute('aria-label') ||
        button.getAttribute('title') ||
        button.getAttribute('aria-labelledby');

      if (!hasLabel) {
        unlabeled.push({
          element: button,
        });
      }
    });

    return unlabeled;
  },

  /**
   * Check for proper link text
   */
  checkLinkText() {
    const links = document.querySelectorAll('a[href]');
    const issues = [];

    links.forEach((link) => {
      const text = link.textContent.trim();

      // Check for generic link text
      if (['click here', 'read more', 'learn more', 'more'].includes(text.toLowerCase())) {
        issues.push({
          element: link,
          text,
          message: 'Generic link text detected',
        });
      }

      // Check for empty links
      if (!text && !link.getAttribute('aria-label')) {
        issues.push({
          element: link,
          message: 'Empty link without aria-label',
        });
      }
    });

    return issues;
  },

  /**
   * Run full accessibility audit
   */
  runAudit() {
    return {
      missingAltText: this.checkMissingAltText(),
      headingIssues: this.checkHeadingHierarchy(),
      unlabeledInputs: this.checkFormLabels(),
      unlabeledButtons: this.checkButtonLabels(),
      linkIssues: this.checkLinkText(),
    };
  },
};

/**
 * WCAG compliance helpers
 */
const wcag = {
  /**
   * Check color contrast ratio
   */
  checkColorContrast(foreground, background) {
    // Convert hex to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : null;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return null;

    // Calculate relative luminance
    const luminance = (r, g, b) => {
      const [R, G, B] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };

    const L1 = luminance(fg.r, fg.g, fg.b);
    const L2 = luminance(bg.r, bg.g, bg.b);

    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG AA standard
   */
  meetsWCAGAA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  },

  /**
   * Check if contrast ratio meets WCAG AAA standard
   */
  meetsWCAGAAA(ratio, isLargeText = false) {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  },
};

/**
 * Add CSS for screen reader only content
 */
function injectScreenReaderStyles() {
  if (document.getElementById('sr-only-styles')) return;

  const style = document.createElement('style');
  style.id = 'sr-only-styles';
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    
    .sr-only-focusable:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
    
    .focus-visible:focus {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize screen reader styles on load
if (typeof document !== 'undefined') {
  injectScreenReaderStyles();
}

export {
  generateAriaId,
  generateAriaLabel,
  generateAriaDescription,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  focusManager,
  keyboardNav,
  screenReader,
  accessibilityAudit,
  wcag,
  injectScreenReaderStyles,
};
