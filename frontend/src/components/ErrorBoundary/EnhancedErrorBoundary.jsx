/**
 * Enhanced Error Boundary System
 * Production-level error handling with graceful degradation
 *
 * Features:
 * - Comprehensive error catching
 * - User-friendly error messages
 * - Error recovery mechanisms
 * - Error logging and reporting
 * - Fallback UI components
 * - Context-aware error handling
 * - Performance monitoring integration
 */

import React, { Component, createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedButton, EnhancedCard, EnhancedAlert } from '../ui/enhancedComponents';

// Error context for global error management
const ErrorContext = createContext({
  error: null,
  setError: () => {},
  clearError: () => {},
  errorHistory: [],
});

export const useError = () => useContext(ErrorContext);

// Error types with specific handling strategies
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown',
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Error classification helper
export const classifyError = (error) => {
  if (!error) return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.LOW };

  // Network errors
  if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
  }

  // Authentication errors
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    return { type: ERROR_TYPES.AUTHENTICATION, severity: ERROR_SEVERITY.HIGH };
  }

  // Authorization errors
  if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
    return { type: ERROR_TYPES.AUTHORIZATION, severity: ERROR_SEVERITY.HIGH };
  }

  // Not found errors
  if (error.message?.includes('404') || error.message?.includes('Not Found')) {
    return { type: ERROR_TYPES.NOT_FOUND, severity: ERROR_SEVERITY.LOW };
  }

  // Server errors
  if (error.message?.includes('500') || error.message?.includes('Server Error')) {
    return { type: ERROR_TYPES.SERVER, severity: ERROR_SEVERITY.HIGH };
  }

  // Validation errors
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.LOW };
  }

  // Default classification
  return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
};

// Error recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  REFRESH: 'refresh',
  REDIRECT: 'redirect',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
};

// Enhanced Error Boundary Component
export class EnhancedErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorHistory: [],
      recoveryAttempted: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(props, state) {
    // Reset error state if error boundary receives new props (for testing/development)
    if (props.resetError && state.hasError) {
      return { hasError: false, error: null, errorInfo: null };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    const { type, severity } = classifyError(error);

    this.setState({
      errorInfo,
      errorHistory: [
        ...this.state.errorHistory,
        {
          error: error.message,
          type,
          severity,
          timestamp: new Date().toISOString(),
          componentStack: errorInfo.componentStack,
        },
      ].slice(-10), // Keep last 10 errors
    }, () => {
      // Log error to monitoring service after state update
      this.logError(error, errorInfo, type, severity);

      // Call custom error handler if provided
      if (this.props.onErrorCaught) {
        this.props.onErrorCaught(error, errorInfo, type, severity);
      }
    });
  }

  logError = (error, errorInfo, type, severity) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      type,
      severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', errorData);
    }

    // Send to error monitoring service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorData,
      });
    }

    // Store in localStorage for debugging
    try {
      const existingErrorsStr = localStorage.getItem('errorHistory');
      if (existingErrorsStr) {
        const existingErrors = JSON.parse(existingErrorsStr);
        localStorage.setItem('errorHistory', JSON.stringify([
          ...existingErrors.slice(-9),
          errorData,
        ]));
      } else {
        localStorage.setItem('errorHistory', JSON.stringify([errorData]));
      }
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
      // Continue execution even if localStorage fails
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempted: true,
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getRecoveryStrategy = () => {
    const { error } = this.state;
    const { type, severity } = classifyError(error);

    if (type === ERROR_TYPES.NETWORK && severity === ERROR_SEVERITY.MEDIUM) {
      return RECOVERY_STRATEGIES.RETRY;
    }

    if (type === ERROR_TYPES.SERVER && severity === ERROR_SEVERITY.HIGH) {
      return RECOVERY_STRATEGIES.REFRESH;
    }

    if (type === ERROR_TYPES.NOT_FOUND) {
      return RECOVERY_STRATEGIES.REDIRECT;
    }

    return this.props.recoveryStrategy || RECOVERY_STRATEGIES.FALLBACK;
  };

  getErrorMessage = () => {
    const { error } = this.state;
    const { type } = classifyError(error);

    const messages = {
      [ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection.',
      [ERROR_TYPES.VALIDATION]: 'There was an error with the data provided.',
      [ERROR_TYPES.AUTHENTICATION]: 'Authentication required. Please log in again.',
      [ERROR_TYPES.AUTHORIZATION]: 'You don\'t have permission to access this resource.',
      [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
      [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
      [ERROR_TYPES.CLIENT]: 'An unexpected error occurred.',
      [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred.',
    };

    return this.props.customMessage || messages[type] || messages[ERROR_TYPES.UNKNOWN];
  };

  render() {
    if (this.state.hasError) {
      const strategy = this.getRecoveryStrategy();
      const message = this.getErrorMessage();

      // Custom fallback UI
      if (this.props.fallbackUI) {
        return this.props.fallbackUI({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.handleRetry,
          refresh: this.handleRefresh,
          goHome: this.handleGoHome,
        });
      }

      // Default error UI
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
        >
          <EnhancedCard className="max-w-lg w-full">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="text-6xl mb-4"
              >
                ⚠️
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h2>

              <p className="text-gray-600 mb-6">
                {message}
              </p>

              <EnhancedAlert variant="info" className="mb-6">
                <div className="text-sm">
                  Error ID: {this.state.error?.message?.substring(0, 8) || 'Unknown'}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2 text-left">
                      <summary className="cursor-pointer font-medium">
                        Technical details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {this.state.error?.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </EnhancedAlert>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {strategy === RECOVERY_STRATEGIES.RETRY && (
                  <EnhancedButton
                    onClick={this.handleRetry}
                    variant="primary"
                  >
                    Try Again
                  </EnhancedButton>
                )}

                {strategy === RECOVERY_STRATEGIES.REFRESH && (
                  <EnhancedButton
                    onClick={this.handleRefresh}
                    variant="secondary"
                  >
                    Refresh Page
                  </EnhancedButton>
                )}

                {strategy === RECOVERY_STRATEGIES.REDIRECT && (
                  <EnhancedButton
                    onClick={this.handleGoHome}
                    variant="outline"
                  >
                    Go to Home
                  </EnhancedButton>
                )}

                <EnhancedButton
                  onClick={() => window.history.back()}
                  variant="ghost"
                >
                  Go Back
                </EnhancedButton>
              </div>

              {this.state.errorHistory.length > 1 && (
                <div className="mt-6 text-sm text-gray-500">
                  This error has occurred {this.state.errorHistory.length} time(s)
                </div>
              )}
            </div>
          </EnhancedCard>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// Error Provider for global error management
export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [errorHistory, setErrorHistory] = useState([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addError = useCallback((err) => {
    const { type, severity } = classifyError(err);
    const errorEntry = {
      error: err,
      type,
      severity,
      timestamp: new Date().toISOString(),
    };

    setErrorHistory(prev => [...prev.slice(-9), errorEntry]);
    setError(errorEntry);
  }, []);

  return (
    <ErrorContext.Provider value={{ error, setError: addError, clearError, errorHistory }}>
      {children}
    </ErrorContext.Provider>
  );
};

// Async Error Boundary for handling async errors
export const AsyncErrorBoundary = ({ children, fallbackUI }) => {
  const [error, setError] = useState(null);

  const handleAsyncError = useCallback((err) => {
    setError(err);
  }, []);

  // Wrap children in error boundary
  return (
    <EnhancedErrorBoundary
      fallbackUI={fallbackUI}
      onErrorCaught={handleAsyncError}
    >
      {error ? fallbackUI : children}
    </EnhancedErrorBoundary>
  );
};

// Error Hook for functional components
export const useErrorHandler = () => {
  const { error, setError, clearError, errorHistory } = useError();

  const handleError = useCallback((err) => {
    setError(err);
  }, [setError]);

  let handleAsyncError = useCallback(async (asyncFn) => {
    try {
      return await asyncFn();
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);

  return {
    error,
    errorHistory,
    handleError,
    handleAsyncError,
    clearError,
  };
};

// Fallback component for specific feature failures
export const FeatureFallback = ({
  featureName,
  message,
  onRetry,
  onDismiss,
  isDismissible = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <EnhancedAlert variant="warning" dismissible={isDismissible} onDismiss={onDismiss}>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium mb-1">{featureName} unavailable</h4>
            <p className="text-sm">{message}</p>
          </div>
          {onRetry && (
            <EnhancedButton
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              Retry
            </EnhancedButton>
          )}
        </div>
      </EnhancedAlert>
    </motion.div>
  );
};

// Graceful degradation wrapper
export const GracefulDegradation = ({
  children,
  fallbackUI,
  featureName,
  isFeatureEnabled = true,
}) => {
  const [hasFailed, setHasFailed] = useState(false);

  if (!isFeatureEnabled || hasFailed) {
    return fallbackUI || <FeatureFallback featureName={featureName} message="This feature is currently unavailable." />;
  }

  return (
    <EnhancedErrorBoundary
      fallbackUI={({ retry }) => (
        <FeatureFallback
          featureName={featureName}
          message="This feature encountered an error."
          onRetry={retry}
        />
      )}
      onErrorCaught={() => setHasFailed(true)}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

// Network error boundary
export const NetworkErrorBoundary = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <EnhancedCard className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            You're offline
          </h2>
          <p className="text-gray-600 mb-6">
            Please check your internet connection and try again.
          </p>
          <EnhancedButton onClick={() => window.location.reload()}>
            Retry Connection
          </EnhancedButton>
        </EnhancedCard>
      </div>
    );
  }

  return children;
};

export default {
  EnhancedErrorBoundary,
  ErrorProvider,
  useError,
  useErrorHandler,
  AsyncErrorBoundary,
  FeatureFallback,
  GracefulDegradation,
  NetworkErrorBoundary,
  ERROR_TYPES,
  ERROR_SEVERITY,
  RECOVERY_STRATEGIES,
  classifyError,
};
