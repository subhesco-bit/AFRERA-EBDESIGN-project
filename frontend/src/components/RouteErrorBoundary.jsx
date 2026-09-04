/**
 * Enterprise-Grade Route Error Boundary
 *
 * Production-ready error handling for routes with:
 * - Per-route error isolation
 * - Custom error UI
 * - Error recovery options
 * - Error logging
 * - Fallback routes
 * - User-friendly error messages
 */

import { Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logError } from '../utils/errorMonitoring';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/Skeleton';

/**
 * Route Error Boundary Component
 * Catches errors in route components and provides recovery options
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo,
    });

    // Log error to monitoring service
    logError(error, {
      componentStack: errorInfo.componentStack,
      route: this.props.route?.path || 'unknown',
      retryCount: this.state.retryCount,
    });

    // Track error in analytics
    if (window.analytics) {
      window.analytics.trackError(error, {
        route: this.props.route?.path,
      });
    }
  }

  handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, route, maxRetries = 3 } = this.props;

    if (hasError) {
      // Check if max retries exceeded
      if (retryCount >= maxRetries) {
        return fallback || <ErrorFallback error={error} route={route} onGoHome={this.handleGoHome} onGoBack={this.handleGoBack} />;
      }

      // Show retry option
      return (
        <ErrorWithRetry
          error={error}
          route={route}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onGoBack={this.handleGoBack}
          retryCount={retryCount}
        />
      );
    }

    return children;
  }
}

/**
 * Error Fallback Component
 * Displays when max retries are exceeded
 */
function ErrorFallback({ error, route, onGoHome, onGoBack }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {route?.title ? `Error loading ${route.title}` : 'An unexpected error occurred while loading this page.'}
          </p>

          {error?.message && import.meta.env.DEV && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onGoBack} variant="outline">
              Go Back
            </Button>
            <Button onClick={onGoHome}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error with Retry Component
 * Shows error with retry option
 */
function ErrorWithRetry({ error, route, onRetry, onGoHome, onGoBack, retryCount }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
            <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Error
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {route?.title ? `Failed to load ${route.title}` : 'There was a problem loading this page.'}
          </p>

          {error?.message && import.meta.env.DEV && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onRetry} variant="primary">
              Try Again ({retryCount + 1}/3)
            </Button>
            <Button onClick={onGoBack} variant="outline">
              Go Back
            </Button>
            <Button onClick={onGoHome} variant="ghost">
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook-based Error Boundary for functional components
 */
export function useRouteErrorBoundary() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleError = (error) => {
    logError(error, {
      route: location.pathname,
    });

    // Navigate to error page
    navigate('/error', {
      state: {
        error: error.message,
        route: location.pathname,
      },
    });
  };

  return { handleError };
}

/**
 * Error Page Component
 * Dedicated error page for route errors
 */
export function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const errorState = location.state;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Page Error
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorState?.error || 'An unexpected error occurred.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Not Found Page Component
 * 404 error page
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(-1)} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Unauthorized Page Component
 * 403 error page
 */
export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
            <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
