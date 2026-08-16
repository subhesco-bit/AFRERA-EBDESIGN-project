/**
 * Enterprise-Grade Route Loading States
 * 
 * Production-ready loading states for routes with:
 * - Skeleton screens
 * - Progress indicators
 * - Loading animations
 * - Context-aware loading
 * - Customizable loading UI
 * - Accessibility support
 */

import { Suspense } from 'react'

import { useLocation } from 'react-router-dom'
import { LoadingSpinner, PageSkeleton, CardSkeleton } from './ui/Skeleton'

/**
 * Default Route Loading Component
 */
export function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Page Skeleton Loading Component
 * Shows a skeleton of the page structure
 */
export function PageLoadingFallback({ route }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <PageSkeleton />
    </div>
  )
}

/**
 * Card Loading Component
 * For routes that display card-based content
 */
export function CardLoadingFallback({ count = 3 }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Smart Route Loading Component
 * Selects appropriate loading UI based on route type
 */
export function SmartRouteLoading({ route }) {
  const location = useLocation()

  // Determine loading type based on route
  const getLoadingType = () => {
    if (route?.path?.startsWith('/marketplace')) {
      return 'card'
    }
    if (route?.path?.startsWith('/products/')) {
      return 'page'
    }
    if (route?.path?.startsWith('/dashboard')) {
      return 'page'
    }
    if (route?.path?.startsWith('/farmer-')) {
      return 'page'
    }
    return 'default'
  }

  const loadingType = getLoadingType()

  switch (loadingType) {
    case 'card':
      return <CardLoadingFallback count={6} />
    case 'page':
      return <PageLoadingFallback route={route} />
    default:
      return <RouteLoadingFallback />
  }
}

/**
 * Route Suspense Wrapper
 * Wraps routes with Suspense and custom loading fallback
 */
export function RouteSuspense({ children, fallback, route }) {
  const loadingFallback = fallback || <SmartRouteLoading route={route} />

  return (
    <Suspense fallback={loadingFallback}>
      {children}
    </Suspense>
  )
}

/**
 * Progressive Loading Component
 * Shows incremental loading states
 */
export function ProgressiveLoading({ steps = ['Loading', 'Preparing', 'Almost there'] }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1
        }
        clearInterval(interval)
        return prev
      })
    }, 800)

    return () => clearInterval(interval)
  }, [steps])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          {steps[currentStep]}...
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i <= currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Route Preloader Component
 * Preloads routes for better performance
 */
export function RoutePreloader({ preloadRoutes = [] }) {
  useEffect(() => {
    // Preload routes when idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadRoutes.forEach((route) => {
          // Trigger lazy import
          import(`../pages/${route}.jsx`).catch(() => {
            // Ignore preload errors
          })
        })
      })
    }
  }, [preloadRoutes])

  return null
}

/**
 * Loading Overlay Component
 * Shows loading overlay over existing content
 */
export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}

/**
 * Inline Loading Component
 * For loading within a specific section
 */
export function InlineLoading({ size = 'md', message }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <LoadingSpinner size={size} />
        {message && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  )
}
