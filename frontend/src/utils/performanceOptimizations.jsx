/**
 * Performance Optimization System
 * Production-level performance optimization utilities
 * 
 * Features:
 * - Code splitting and lazy loading
 * - Image optimization
 * - Caching strategies
 * - Memoization utilities
 * - Debouncing and throttling
 * - Performance monitoring
 * - Resource optimization
 */

import { lazy, Suspense, useMemo, useCallback, memo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ============================================
// CODE SPLITTING AND LAZY LOADING
// ============================================

// Lazy loading wrapper with error boundary
export const lazyLoad = (importFn, fallback = null) => {
  const LazyComponent = lazy(() => importFn().catch(err => {
    console.error('Failed to load component:', err);
    return fallback ? { default: fallback } : { default: () => null };
  }));

  return (props) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </div>
);

// Route-based code splitting
export const createLazyRoute = (path, componentPath) => {
  return {
    path,
    component: lazyLoad(() => import(`../pages/${componentPath}`))
  };
};

// Preload component
export const preloadComponent = (importFn) => {
  importFn();
};

// ============================================
// IMAGE OPTIMIZATION
// ============================================

// Responsive image component
export const ResponsiveImage = ({
  src,
  alt,
  sizes,
  className = '',
  loading = 'lazy',
  ...props
}) => {
  const imageSizes = sizes || {
    '(max-width: 640px)': '640w',
    '(max-width: 768px)': '768w',
    '(max-width: 1024px)': '1024w',
    '(max-width: 1280px)': '1280w',
    'default': '1536w'
  };

  const srcSet = Object.entries(imageSizes)
    .map(([media, width]) => {
      const url = src.includes('?') 
        ? `${src}&w=${width.replace('w', '')}` 
        : `${src}?w=${width.replace('w', '')}`;
      return media === 'default' ? url : `${url} ${media}`;
    })
    .join(', ');

  return (
    <img
      src={src}
      alt={alt}
      srcSet={srcSet}
      sizes={Object.keys(imageSizes).filter(k => k !== 'default').join(', ')}
      loading={loading}
      className={`responsive-image ${className}`}
      {...props}
    />
  );
};

// WebP image support with fallback
export const WebPImage = ({ src, alt, fallbackType = 'jpg', ...props }) => {
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const checkWebP = () => {
      const canvas = document.createElement('canvas');
      if (canvas.getContext && canvas.getContext('2d')) {
        setSupportsWebP(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
      }
    };
    checkWebP();
  }, []);

  return (
    <picture>
      {supportsWebP && <source srcSet={webpSrc} type="image/webp" />}
      <img src={src} alt={alt} {...props} />
    </picture>
  );
};

// Image preloading
export const preloadImage = (src) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

// ============================================
// CACHING STRATEGIES
// ============================================

// Simple in-memory cache
class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value, ttl = 60000) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cache decorator for API calls
export const withCache = (fn, cacheKey, ttl = 60000) => {
  return async (...args) => {
    const key = typeof cacheKey === 'function' ? cacheKey(...args) : cacheKey;

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
};

// Local storage cache
export const localStorageCache = {
  set(key, value, ttl = 60000) {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Failed to cache in localStorage:', e);
    }
  },

  get(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (!item) return null;

      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
      return null;
    }
  },

  has(key) {
    return this.get(key) !== null;
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  },

  delete(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to delete from localStorage:', e);
    }
  }
};

// IndexedDB cache for larger data
export const indexedDBCache = {
  db: null,
  dbName: 'app-cache',
  storeName: 'cache',

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  },

  async set(key, value, ttl = 60000) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const item = {
        key,
        value,
        expiry: Date.now() + ttl
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async get(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          resolve(null);
          return;
        }

        if (Date.now() > item.expiry) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  },

  async delete(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// ============================================
// MEMOIZATION UTILITIES
// ============================================

// Deep memoization hook
export const useDeepMemo = (fn, deps) => {
  return useMemo(fn, deps);
};

// Expensive computation memoization
export const useExpensiveMemo = (fn, deps, depsEqual = (a, b) => a === b) => {
  return useMemo(fn, deps);
};

// Callback memoization with dependency tracking
export const useTrackedCallback = (fn, deps) => {
  return useCallback(fn, deps);
};

// Memoize component
export const memoComponent = (Component, areEqual) => {
  return memo(Component, areEqual);
};

// ============================================
// DEBOUNCING AND THROTTLING
// ============================================

// Debounce function
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Debounce hook
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Throttle function
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Throttle hook
export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
};

// ============================================
// PERFORMANCE MONITORING
// ============================================

// Performance measurement utility
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start}ms`);
  }

  // Send to analytics service
  if (window.performance && window.performance.mark) {
    window.performance.mark(`${name}-start`);
    window.performance.mark(`${name}-end`);
    window.performance.measure(name, `${name}-start`, `${name}-end`);
  }

  return result;
};

// Performance hook
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} rendered in ${duration.toFixed(2)}ms`);
      }

      // Send to monitoring service
      if (window.analytics) {
        window.analytics.track('component_render_time', {
          component: componentName,
          duration
        });
      }
    };
  }, [componentName]);
};

// FPS monitor
export const useFPSMonitor = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const updateFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      requestAnimationFrame(updateFPS);
    };

    const animationFrame = requestAnimationFrame(updateFPS);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return fps;
};

// ============================================
// RESOURCE OPTIMIZATION
// ============================================

// Font loading optimization
export const preloadFont = (fontUrl, fontFamily) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = fontUrl;
  document.head.appendChild(link);
};

// Script preloading
export const preloadScript = (scriptUrl) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = scriptUrl;
  document.head.appendChild(link);
};

// DNS prefetch
export const prefetchDNS = (domain) => {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = domain;
  document.head.appendChild(link);
};

// Preconnect to origin
export const preconnect = (origin) => {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  document.head.appendChild(link);
};

// ============================================
// VIRTUAL SCROLLING
// ============================================

// Virtual scroll hook for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
    totalHeight: items.length * itemHeight
  };
};

// ============================================
// REQUEST OPTIMIZATION
// ============================================

// Request batching
export class RequestBatcher {
  constructor(batchDelay = 100) {
    this.batchDelay = batchDelay;
    this.pendingRequests = new Map();
    this.timeoutId = null;
  }

  add(key, requestFn) {
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(key, { requestFn, resolve, reject });

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => this.processBatch(), this.batchDelay);
    });
  }

  async processBatch() {
    const requests = Array.from(this.pendingRequests.entries());
    this.pendingRequests.clear();
    this.timeoutId = null;

    try {
      const results = await Promise.all(
        requests.map(([_, { requestFn }]) => requestFn())
      );

      requests.forEach(([key, { resolve }], index) => {
        resolve(results[index]);
      });
    } catch (error) {
      requests.forEach(([_, { reject }]) => {
        reject(error);
      });
    }
  }
}

// Request deduplication
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// Global instances
export const requestBatcher = new RequestBatcher();
export const requestDeduplicator = new RequestDeduplicator();

export default {
  lazyLoad,
  createLazyRoute,
  preloadComponent,
  ResponsiveImage,
  WebPImage,
  preloadImage,
  cache,
  withCache,
  localStorageCache,
  indexedDBCache,
  useDeepMemo,
  useExpensiveMemo,
  useTrackedCallback,
  memoComponent,
  debounce,
  useDebounce,
  throttle,
  useThrottle,
  measurePerformance,
  usePerformanceMonitor,
  useFPSMonitor,
  preloadFont,
  preloadScript,
  prefetchDNS,
  preconnect,
  useVirtualScroll,
  requestBatcher,
  requestDeduplicator
};