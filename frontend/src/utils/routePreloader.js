/**
 * Enterprise-Grade Route Preloader
 * 
 * Production-ready route preloading with:
 * - Intelligent preloading strategies
 * - Priority-based loading
 * - Network-aware preloading
 * - Memory management
 * - Intersection Observer for viewport-based preloading
 * - Predictive preloading
 */

import { useEffect, useRef } from 'react'


/**
 * Preload strategies
 */
const PreloadStrategy = {
  NONE: 'none',
  HOVER: 'hover',
  VIEWPORT: 'viewport',
  IDLE: 'idle',
  IMMEDIATE: 'immediate'
}

/**
 * Preload priority levels
 */
const PreloadPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
}

/**
 * Route preloader cache
 */
const preloadCache = new Map()

/**
 * Preload a route component
 */
async function preloadRoute(routePath, priority = PreloadPriority.MEDIUM) {
  // Check if already preloaded
  if (preloadCache.has(routePath)) {
    return preloadCache.get(routePath)
  }

  try {
    // Dynamic import based on route path
    const component = await import(`../pages/${routePath}.jsx`)
    preloadCache.set(routePath, component)
    return component
  } catch (error) {
    
    return null
  }
}

/**
 * Clear preload cache
 */
function clearPreloadCache() {
  preloadCache.clear()
}

/**
 * Get preload cache size
 */
function getPreloadCacheSize() {
  return preloadCache.size
}

/**
 * Hook for route preloading
 */
export function useRoutePreloader(routes = [], strategy = PreloadStrategy.IDLE) {
  const preloadedRef = useRef(new Set())

  useEffect(() => {
    if (strategy === PreloadStrategy.NONE) return

    const preloadRoutes = async () => {
      for (const route of routes) {
        if (preloadedRef.current.has(route.path)) continue

        // Skip if route doesn't have preload flag
        if (!route.preload && strategy !== PreloadStrategy.IMMEDIATE) continue

        // Priority-based preloading
        const priority = route.priority || PreloadPriority.MEDIUM

        // Skip low priority routes for immediate strategy
        if (strategy === PreloadStrategy.IMMEDIATE && priority < PreloadPriority.HIGH) {
          continue
        }

        await preloadRoute(route.component.name, priority)
        preloadedRef.current.add(route.path)
      }
    }

    if (strategy === PreloadStrategy.IMMEDIATE) {
      preloadRoutes()
    } else if (strategy === PreloadStrategy.IDLE && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => preloadRoutes())
    }

    return () => {
      // Cleanup if needed
    }
  }, [routes, strategy])

  return { preloaded: preloadedRef.current }
}

/**
 * Hook for hover-based preloading
 */
export function useHoverPreload(routePath) {
  const preloadTimeoutRef = useRef(null)

  const handleMouseEnter = () => {
    preloadTimeoutRef.current = setTimeout(() => {
      preloadRoute(routePath, PreloadPriority.HIGH)
    }, 200) // 200ms delay to avoid unnecessary preloads
  }

  const handleMouseLeave = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current)
    }
  }

  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
}

/**
 * Hook for viewport-based preloading
 */
export function useViewportPreload(routes = [], threshold = 0.1) {
  const observerRef = useRef(null)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const routePath = entry.target.dataset.route
            if (routePath) {
              preloadRoute(routePath, PreloadPriority.MEDIUM)
            }
          }
        })
      },
      { threshold }
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [threshold])

  const observeElement = (element, routePath) => {
    if (observerRef.current && element) {
      element.dataset.route = routePath
      observerRef.current.observe(element)
    }
  }

  const unobserveElement = (element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element)
    }
  }

  return { observeElement, unobserveElement }
}

/**
 * Predictive preloader based on user behavior
 */
export function usePredictivePreloader() {
  const navigationHistory = useRef([])

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      navigationHistory.current.push({
        path: currentPath,
        timestamp: Date.now()
      })

      // Keep only last 10 entries
      if (navigationHistory.current.length > 10) {
        navigationHistory.current.shift()
      }

      // Predict next likely routes based on history
      predictAndPreload()
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const predictAndPreload = () => {
    const history = navigationHistory.current
    if (history.length < 2) return

    // Simple prediction: preload routes that were visited after current route
    const currentPath = history[history.length - 1].path
    
    // Find patterns in navigation history
    const patterns = findNavigationPatterns(history)
    
    // Preload likely next routes
    patterns.forEach((pattern) => {
      if (pattern.nextRoute && pattern.confidence > 0.5) {
        preloadRoute(pattern.nextRoute, PreloadPriority.LOW)
      }
    })
  }

  return { navigationHistory: navigationHistory.current }
}

/**
 * Find navigation patterns in history
 */
function findNavigationPatterns(history) {
  const patterns = []
  const patternMap = new Map()

  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i].path
    const next = history[i + 1].path

    const key = `${current}->${next}`
    const count = (patternMap.get(key) || 0) + 1
    patternMap.set(key, count)

    patterns.push({
      currentRoute: current,
      nextRoute: next,
      count,
      confidence: count / history.length
    })
  }

  return patterns.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Network-aware preloader
 */
export function useNetworkAwarePreloader(routes = []) {
  useEffect(() => {
    const checkNetworkAndPreload = async () => {
      if (!('connection' in navigator)) return

      const connection = navigator.connection
      const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                              connection.effectiveType === '2g' ||
                              connection.saveData

      if (isSlowConnection) {
        // Only preload critical routes on slow connections
        const criticalRoutes = routes.filter(r => r.priority === PreloadPriority.CRITICAL)
        for (const route of criticalRoutes) {
          await preloadRoute(route.component.name, PreloadPriority.CRITICAL)
        }
      } else {
        // Preload all routes on fast connections
        for (const route of routes) {
          await preloadRoute(route.component.name, route.priority || PreloadPriority.MEDIUM)
        }
      }
    }

    checkNetworkAndPreload()
  }, [routes])

  return null
}

/**
 * Memory-aware preloader
 */
export function useMemoryAwarePreloader(maxCacheSize = 10) {
  useEffect(() => {
    const checkMemoryAndClear = () => {
      if (preloadCache.size > maxCacheSize) {
        // Remove oldest entries
        const entries = Array.from(preloadCache.entries())
        const toRemove = entries.slice(0, entries.length - maxCacheSize)
        
        toRemove.forEach(([key]) => {
          preloadCache.delete(key)
        })
      }
    }

    const interval = setInterval(checkMemoryAndClear, 30000) // Check every 30s

    return () => clearInterval(interval)
  }, [maxCacheSize])

  return { cacheSize: preloadCache.size }
}

/**
 * Comprehensive route preloader component
 */
export function RoutePreloader({ routes, strategy = PreloadStrategy.IDLE }) {
  useRoutePreloader(routes, strategy)
  useNetworkAwarePreloader(routes)
  useMemoryAwarePreloader()
  usePredictivePreloader()

  return null
}

export {
  PreloadStrategy,
  PreloadPriority,
  preloadRoute,
  clearPreloadCache,
  getPreloadCacheSize
}
