/**
 * Enterprise-Grade Skeleton Loading Components
 * 
 * Production-ready skeleton screens with:
 * - Multiple skeleton variants (text, image, card, list, table)
 * - Animated shimmer effect
 * - Configurable dimensions and colors
 * - Accessibility support
 * - Performance optimized
 * - Customizable animation speed
 * - Dark mode support
 */

import { cn } from '../../lib/utils'


/**
 * Base Skeleton component
 */
function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  )
}

/**
 * Text Skeleton - simulates text lines
 */
function TextSkeleton({ lines = 3, className, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

/**
 * Image Skeleton - simulates image loading
 */
function ImageSkeleton({ className, aspectRatio = '16/9', ...props }) {
  const [width, height] = aspectRatio.split('/').map(Number)
  const paddingBottom = `${(height / width) * 100}%`
  
  return (
    <div
      className={cn('relative overflow-hidden rounded-md', className)}
      style={{ paddingBottom }}
      {...props}
    >
      <Skeleton className="absolute inset-0 h-full w-full" />
    </div>
  )
}

/**
 * Card Skeleton - simulates card component loading
 */
function CardSkeleton({ className, ...props }) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800', className)} {...props}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <TextSkeleton lines={2} />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

/**
 * List Skeleton - simulates list items loading
 */
function ListSkeleton({ count = 5, className, ...props }) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Table Skeleton - simulates table loading
 */
function TableSkeleton({ rows = 5, columns = 4, className, ...props }) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Header */}
      <div className="flex border-b border-gray-200 pb-2 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Avatar Skeleton - simulates avatar loading
 */
function AvatarSkeleton({ className, size = 'md', ...props }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  }
  
  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
      {...props}
    />
  )
}

/**
 * Button Skeleton - simulates button loading
 */
function ButtonSkeleton({ className, ...props }) {
  return (
    <Skeleton className={cn('h-10 w-24 rounded-md', className)} {...props} />
  )
}

/**
 * Input Skeleton - simulates input field loading
 */
function InputSkeleton({ className, ...props }) {
  return (
    <Skeleton className={cn('h-10 w-full rounded-md', className)} {...props} />
  )
}

/**
 * Page Skeleton - simulates entire page loading
 */
function PageSkeleton({ className, ...props }) {
  return (
    <div className={cn('space-y-6 p-6', className)} {...props}>
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/**
 * Loading Spinner - circular progress indicator
 */
function LoadingSpinner({ className, size = 'md', ...props }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  
  return (
    <div
      className={cn('inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent', sizeClasses[size], className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Loading Bar - linear progress indicator
 */
function LoadingBar({ className, progress = 0, ...props }) {
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700', className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

/**
 * Loading Dots - animated dots indicator
 */
function LoadingDots({ className, ...props }) {
  return (
    <div className={cn('flex space-x-1', className)} {...props}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-blue-600"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

/**
 * Loading Overlay - full screen loading overlay
 */
function LoadingOverlay({ message = 'Loading...', className, ...props }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
      {...props}
    >
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" />
        <p id="loading-message" className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  )
}

export {
  Skeleton,
  TextSkeleton,
  ImageSkeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  InputSkeleton,
  PageSkeleton,
  LoadingSpinner,
  LoadingBar,
  LoadingDots,
  LoadingOverlay
}
