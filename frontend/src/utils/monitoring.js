/**
 * Enterprise-Grade Monitoring and Error Reporting
 *
 * Production-ready monitoring with:
 * - Sentry integration
 * - Performance monitoring
 * - User session tracking
 * - Error categorization
 * - Release tracking
 * - Environment tagging
 * - Custom breadcrumbs
 * - User context
 */

import * as Sentry from '@sentry/react';

import config from '../config/env';

/**
 * Initialize Sentry for error monitoring and performance tracking
 */
function initSentry() {
  if (!config.SENTRY_DSN) {

    return;
  }

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Which request URLs get trace headers attached (replaces the old
    // BrowserTracing({ tracingOrigins }) option from @sentry/tracing)
    tracePropagationTargets: [
      'localhost',
      config.API_URL,
      /^\//,
      import.meta.env.VITE_API_URL,
    ],

    // Performance sampling
    tracesSampleRate: config.IS_PRODUCTION ? 0.1 : 1.0,

    // Error sampling
    sampleRate: config.IS_PRODUCTION ? 0.1 : 1.0,

    // Before send hook for error filtering
    beforeSend(event, hint) {
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;

        // Ignore network errors in development
        if (config.IS_DEVELOPMENT && error.message?.includes('NetworkError')) {
          return null;
        }

        // Ignore cancelled requests
        if (error.message?.includes('cancelled')) {
          return null;
        }
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          name: 'EBDESIGN Frontend',
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        },
      };

      return event;
    },

    // Before breadcrumb hook
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === 'xhr') {
        const url = breadcrumb.data?.url;
        if (url?.includes('/auth/') || url?.includes('/login') || url?.includes('/register')) {
          breadcrumb.data = {
            ...breadcrumb.data,
            url: '[REDACTED]',
          };
        }
      }

      return breadcrumb;
    },

    // Initial scope
    initialScope: {
      tags: {
        platform: 'web',
        framework: 'react',
      },
    },
  });
}

/**
 * Set user context for Sentry
 */
function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    // Add any other user properties you want to track
  });
}

/**
 * Set custom tags for better error categorization
 */
function setTags(tags) {
  Sentry.setTags(tags);
}

/**
 * Set custom context for additional information
 */
function setContext(key, context) {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb for tracking user actions
 */
function addBreadcrumb(category, message, level = 'info', data = {}) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception with additional context
 */
function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      scope.setTags(context.tags);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }
    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message for logging
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    if (context.tags) {
      scope.setTags(context.tags);
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Track user action for analytics
 */
function trackAction(actionName, properties = {}) {
  addBreadcrumb('user-action', actionName, 'info', properties);
}

/**
 * Track page view
 */
function trackPageView(pageName, properties = {}) {
  addBreadcrumb('navigation', `Viewed ${pageName}`, 'info', {
    page: pageName,
    ...properties,
  });
}

/**
 * Track API call
 */
function trackAPICall(endpoint, method, status, duration) {
  addBreadcrumb('api', `${method} ${endpoint}`, status >= 400 ? 'warning' : 'info', {
    endpoint,
    method,
    status,
    duration,
  });
}

/**
 * Track form submission
 */
function trackFormSubmission(formName, success, errors = []) {
  addBreadcrumb('form', `Form ${formName} ${success ? 'submitted' : 'failed'}`, success ? 'info' : 'warning', {
    form: formName,
    success,
    errorCount: errors.length,
    errors: errors.slice(0, 5), // Only include first 5 errors
  });
}

/**
 * Track a performance metric (e.g. page load time). RouteAnalytics.jsx
 * calls this on every route change; it was never implemented here despite
 * every sibling trackX function (trackAction/trackPageView/trackAPICall/
 * trackFormSubmission) following this exact addBreadcrumb wrapper pattern.
 */
function trackPerformance(metricName, value, properties = {}) {
  addBreadcrumb('performance', `${metricName}: ${value}ms`, 'info', {
    metric: metricName,
    value,
    ...properties,
  });
}

/**
 * Track feature usage
 */
function trackFeatureUsage(featureName, properties = {}) {
  addBreadcrumb('feature', `Used ${featureName}`, 'info', {
    feature: featureName,
    ...properties,
  });
}

/**
 * Performance monitoring utilities
 */
const performance = {
  /**
   * Start a performance transaction
   */
  startTransaction(name, op = 'custom') {
    return Sentry.startInactiveSpan({
      name,
      op,
    });
  },

  /**
   * Measure page load time
   */
  measurePageLoad() {
    if (typeof window === 'undefined' || !window.performance) return null;

    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

    return {
      pageLoadTime,
      domReadyTime,
      firstPaint: perfData.responseStart - perfData.navigationStart,
      domInteractive: perfData.domInteractive - perfData.navigationStart,
    };
  },

  /**
   * Measure API request time
   */
  measureAPIRequest(endpoint, startTime) {
    const duration = Date.now() - startTime;
    trackAPICall(endpoint, 'API', 200, duration);
    return duration;
  },
};

/**
 * Error categorization helpers
 */
const errorCategories = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  BUSINESS_LOGIC: 'business_logic',
  UI: 'ui',
  UNKNOWN: 'unknown',
};

/**
 * Categorize error based on type and message
 */
function categorizeError(error) {
  if (!error) return errorCategories.UNKNOWN;

  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';

  // Network errors
  if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
    return errorCategories.NETWORK;
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401') || message.includes('token')) {
    return errorCategories.AUTHENTICATION;
  }

  // Authorization errors
  if (message.includes('forbidden') || message.includes('403') || message.includes('permission')) {
    return errorCategories.AUTHORIZATION;
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return errorCategories.VALIDATION;
  }

  // UI errors
  if (name.includes('react') || message.includes('render') || message.includes('component')) {
    return errorCategories.UI;
  }

  return errorCategories.UNKNOWN;
}

/**
 * Create error fingerprint for grouping
 */
function createErrorFingerprint(error, category) {
  let message = error.message || 'unknown';
  let name = error.name || 'Error';

  // Create a fingerprint based on error type and key parts of the message
  const keyParts = message
    .replace(/[0-9]/g, 'N') // Replace numbers with N
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
    .split(' ')
    .slice(0, 3) // Take first 3 words
    .join('-');

  return `${category}-${name}-${keyParts}`;
}

/**
 * Enhanced error capture with categorization
 */
function captureCategorizedError(error, context = {}) {
  const category = categorizeError(error);
  const fingerprint = createErrorFingerprint(error, category);

  captureException(error, {
    ...context,
    tags: {
      ...context.tags,
      category,
      errorType: error.name,
    },
    fingerprint: [fingerprint],
  });
}

/**
 * Session replay (if enabled)
 */
function enableSessionReplay() {
  // This would require @sentry/replay package
  // Implementation depends on your Sentry plan

}

/**
 * Health check for monitoring service
 */
function healthCheck() {
  return {
    sentry: Boolean(Sentry.getClient()),
    dsn: Boolean(config.SENTRY_DSN),
    environment: config.SENTRY_ENVIRONMENT,
    enabled: config.ENABLE_ERROR_REPORTING,
  };
}

/**
 * Monitoring API
 */
const monitoring = {
  init: initSentry,
  setUser,
  setTags,
  setContext,
  addBreadcrumb,
  captureException,
  captureMessage,
  trackAction,
  trackPageView,
  trackAPICall,
  trackFormSubmission,
  trackFeatureUsage,
  trackPerformance,
  performance,
  errorCategories,
  categorizeError,
  createErrorFingerprint,
  captureCategorizedError,
  enableSessionReplay,
  healthCheck,
};

export default monitoring;
