/**
 * Production-Grade Error Handler
 * 
 * Centralized error handling with:
 * - Error classification
 * - User-friendly error messages
 * - Error logging and monitoring
 * - Error recovery strategies
 * - Performance tracking
 */

export class ErrorHandler {
  constructor() {
    this.errorLog = []
    this.errorCallbacks = new Map()
    this.maxLogSize = 1000
  }

  /**
   * Classify error type for appropriate handling
   */
  classifyError(error) {
    if (error.response) {
      // HTTP error response
      const status = error.response.status
      if (status >= 500) return 'server'
      if (status === 401) return 'auth'
      if (status === 403) return 'permission'
      if (status === 404) return 'notFound'
      if (status === 429) return 'rateLimit'
      return 'http'
    } else if (error.request) {
      // Network error
      return 'network'
    } else if (error.code === 'ECONNABORTED') {
      return 'timeout'
    } else {
      // JavaScript error
      return 'javascript'
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error, errorType) {
    const messages = {
      server: 'Server error occurred. Please try again later.',
      auth: 'Your session has expired. Please log in again.',
      permission: 'You don\'t have permission to perform this action.',
      notFound: 'The requested resource was not found.',
      rateLimit: 'Too many requests. Please wait and try again.',
      http: 'An error occurred with your request.',
      network: 'Network error. Please check your connection.',
      timeout: 'Request timed out. Please try again.',
      javascript: 'An unexpected error occurred.',
    }

    // Try to get message from error response
    if (error.response?.data?.message) {
      return error.response.data.message
    }

    return messages[errorType] || messages.javascript
  }

  /**
   * Log error for monitoring
   */
  logError(error, errorType, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // Add to log
    this.errorLog.push(errorEntry)
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }

    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoring(errorEntry)
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorEntry)
    }
  }

  /**
   * Send error to monitoring service
   */
  sendToMonitoring(errorEntry) {
    // In production, send to error tracking service
    // This is a placeholder for actual monitoring integration
    try {
      // Example: Send to Sentry, LogRocket, or custom monitoring
      if (window.Sentry) {
        window.Sentry.captureException(errorEntry)
      }
    } catch (e) {
      console.error('Failed to send error to monitoring:', e)
    }
  }

  /**
   * Register error callback for specific error types
   */
  registerCallback(errorType, callback) {
    this.errorCallbacks.set(errorType, callback)
  }

  /**
   * Handle error with recovery strategy
   */
  handleError(error, context = {}) {
    const errorType = this.classifyError(error)
    const userMessage = this.getUserMessage(error, errorType)

    // Log error
    this.logError(error, errorType, context)

    // Call registered callback if exists
    const callback = this.errorCallbacks.get(errorType)
    if (callback) {
      callback(error, context)
    }

    // Return user-friendly response
    return {
      success: false,
      error: userMessage,
      type: errorType,
      recoverable: this.isRecoverable(errorType),
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(errorType) {
    const recoverableTypes = ['network', 'timeout', 'rateLimit', 'server']
    return recoverableTypes.includes(errorType)
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {}
    this.errorLog.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1
    })
    return {
      total: this.errorLog.length,
      byType: stats,
      recent: this.errorLog.slice(-10),
    }
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = []
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler()

// Global error event listeners
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, {
      source: 'unhandledRejection',
      promise: event.promise,
    })
  })

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, {
      source: 'uncaughtError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })
}

/**
 * React Error Boundary compatible error handler
 */
export function handleReactError(error, errorInfo) {
  errorHandler.handleError(error, {
    source: 'reactErrorBoundary',
    componentStack: errorInfo.componentStack,
  })
}

/**
 * API error handler wrapper
 */
export function withErrorHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handled = errorHandler.handleError(error, {
        function: fn.name,
        args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
      })
      
      // In development, throw to show in console
      if (import.meta.env.DEV) {
        throw error
      }
      
      // In production, return handled error
      return handled
    }
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.maxMetrics = 100
  }

  startMeasure(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    })
  }

  endMeasure(name) {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.endTime = performance.now()
      metric.duration = metric.endTime - metric.startTime
      this.metrics.set(name, metric)
      
      // Log slow operations
      if (metric.duration > 1000) {
        console.warn(`Slow operation: ${name} took ${metric.duration.toFixed(2)}ms`)
      }
    }
  }

  getMetrics() {
    const result = {}
    this.metrics.forEach((value, key) => {
      result[key] = value.duration
    })
    return result
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()
