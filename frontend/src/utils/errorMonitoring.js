/**
 * Error Monitoring and Logging Utility
 * 
 * Provides comprehensive error tracking, logging, and monitoring
 * for production-ready error handling and debugging
 */

class ErrorMonitoring {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.isOnline = navigator.onLine;
    this.activeUser = null;
    this.handleOnline = () => {
      this.isOnline = true;
      this.flushErrorQueue();
    };
    this.handleOffline = () => {
      this.isOnline = false;
    };
    
    // Initialize event listeners
    this.initializeErrorHandlers();
    this.initializeNetworkListeners();
  }

  initializeErrorHandlers() {
    // Global error handler
    this.handleWindowError = (message, source, lineno, colno, error) => {
      this.logError({
        type: 'javascript',
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    };

    // Unhandled promise rejection handler
    this.handleUnhandledRejection = (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    };

    // React error boundary will call this method
    this.handleReactError = (error, errorInfo) => {
      this.logError({
        type: 'react',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    };
    window.onerror = this.handleWindowError;
    window.onunhandledrejection = this.handleUnhandledRejection;
    window.logReactError = this.handleReactError;
  }

  initializeNetworkListeners() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  logError(errorData) {
    // Add to queue
    this.errorQueue.push(errorData);
    
    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorData);
    }

    // Try to send to server if online
    if (this.isOnline) {
      this.sendErrorToServer(errorData);
    }
  }

  async sendErrorToServer(errorData) {
    if (import.meta.env.DEV) return;

    try {
      // In production, send to your error monitoring service
      // For now, we'll use a local endpoint
      await fetch('/api/v1/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (error) {
      console.warn('Failed to send error to server:', error);
    }
  }

  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errorsToSend) {
      await this.sendErrorToServer(error);
    }
  }

  getErrorStats() {
    return {
      totalErrors: this.errorQueue.length,
      isOnline: this.isOnline,
      activeUser: this.activeUser,
      recentErrors: this.errorQueue.slice(-10)
    };
  }

  trackActiveUser(userId, sessionId) {
    this.activeUser = { userId, sessionId };
  }

  clearErrors() {
    this.errorQueue = [];
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (window.onerror === this.handleWindowError) window.onerror = null;
    if (window.onunhandledrejection === this.handleUnhandledRejection) window.onunhandledrejection = null;
    if (window.logReactError === this.handleReactError) delete window.logReactError;
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoring();

// Export convenience functions
export const logError = (error) => errorMonitoring.logError(error);
export const getErrorStats = () => errorMonitoring.getErrorStats();
export const clearErrors = () => errorMonitoring.clearErrors();
