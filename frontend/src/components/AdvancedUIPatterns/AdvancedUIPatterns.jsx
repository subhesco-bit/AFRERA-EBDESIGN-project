/**
 * Advanced UI Patterns System
 * Production-level advanced UI patterns for enhanced user experience
 * 
 * Features:
 * - Skeleton screens for loading states
 * - Progressive loading for large content
 * - Optimistic updates for instant feedback
 * - Infinite scroll with virtualization
 * - Pull-to-refresh functionality
 * - Staggered animations
 * - Content placeholder patterns
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ============================================
// SKELETON SCREENS
// ============================================

// Base skeleton component
export const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  animation = 'pulse' 
}) => {
  const variantStyles = {
    text: { height: '1rem', borderRadius: '0.25rem' },
    circular: { width: '3rem', height: '3rem', borderRadius: '50%' },
    rectangular: { height: '10rem', borderRadius: '0.5rem' },
    avatar: { width: '2.5rem', height: '2.5rem', borderRadius: '50%' },
    button: { height: '2.5rem', borderRadius: '0.5rem', width: '8rem' },
    input: { height: '2.5rem', borderRadius: '0.375rem' },
    card: { height: '12rem', borderRadius: '0.75rem' }
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const style = {
    width: width || '100%',
    height: height || variantStyles[variant]?.height,
    ...variantStyles[variant]
  };

  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
};

// Skeleton card component
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <div className="flex items-start space-x-4">
      <Skeleton variant="avatar" />
      <div className="flex-1 space-y-3">
        <Skeleton width="60%" />
        <Skeleton width="80%" />
        <Skeleton width="40%" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton width="100%" />
      <Skeleton width="90%" />
      <Skeleton width="70%" />
    </div>
  </div>
);

// Skeleton list component
export const SkeletonList = ({ count = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

// Skeleton table component
export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`w-full ${className}`}>
    {/* Header */}
    <div className="flex space-x-4 mb-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={`header-${index}`} width="20%" height="2rem" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4 mb-3">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} width="20%" height="2.5rem" />
        ))}
      </div>
    ))}
  </div>
);

// Skeleton form component
export const SkeletonForm = ({ fields = 5, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton width="30%" height="1rem" />
        <Skeleton height="2.5rem" />
      </div>
    ))}
    <Skeleton width="40%" height="2.5rem" className="mt-6" />
  </div>
);

// ============================================
// PROGRESSIVE LOADING
// ============================================

// Progressive image loader
export const ProgressiveImage = ({
  src,
  placeholder,
  alt,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        {...props}
      />
    </div>
  );
};

// Progressive content loader
export const ProgressiveContent = ({
  content,
  chunks = 3,
  delay = 200,
  className = ''
}) => {
  const [visibleChunks, setVisibleChunks] = useState(1);
  const contentChunks = useMemo(() => {
    if (typeof content === 'string') {
      const chunkSize = Math.ceil(content.length / chunks);
      return Array.from({ length: chunks }, (_, i) =>
        content.slice(i * chunkSize, (i + 1) * chunkSize)
      );
    }
    return Array.isArray(content) ? content : [content];
  }, [content, chunks]);

  useEffect(() => {
    if (visibleChunks < contentChunks.length) {
      const timer = setTimeout(() => {
        setVisibleChunks(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [visibleChunks, contentChunks.length, delay]);

  return (
    <div className={className}>
      {contentChunks.slice(0, visibleChunks).map((chunk, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {chunk}
        </motion.div>
      ))}
      {visibleChunks < contentChunks.length && (
        <Skeleton className="mt-4" />
      )}
    </div>
  );
};

// Progressive list loader
export const ProgressiveList = ({
  items,
  batchSize = 10,
  renderItem,
  className = ''
}) => {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [ref, inView] = useInView();

  useEffect(() => {
    if (inView && visibleCount < items.length) {
      setVisibleCount(prev => Math.min(prev + batchSize, items.length));
    }
  }, [inView, visibleCount, items.length, batchSize]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
      {visibleCount < items.length && (
        <div ref={ref} className="py-8">
          <SkeletonList count={2} />
        </div>
      )}
    </div>
  );
};

// ============================================
// OPTIMISTIC UPDATES
// ============================================

// Optimistic update hook
export const useOptimisticUpdate = (initialData, updateFn) => {
  const [data, setData] = useState(initialData);
  const [optimisticData, setOptimisticData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (updateData) => {
    setIsUpdating(true);
    setError(null);

    // Apply optimistic update
    const previousData = data;
    const predictedData = updateFn(data, updateData);
    setOptimisticData(predictedData);
    setData(predictedData);

    try {
      // Perform actual update
      const result = await updateData.apiCall();
      setData(result);
      setOptimisticData(null);
      return result;
    } catch (err) {
      // Revert on error
      setData(previousData);
      setOptimisticData(null);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [data, updateFn]);

  return {
    data: optimisticData || data,
    update,
    isUpdating,
    error,
    isOptimistic: !!optimisticData
  };
};

// Optimistic list operations
export const useOptimisticList = (initialItems, addItemFn, removeItemFn, updateItemFn) => {
  const [items, setItems] = useState(initialItems);
  const [optimisticItems, setOptimisticItems] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const add = useCallback(async (item) => {
    setIsUpdating(true);
    setError(null);

    const previousItems = items;
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId, isOptimistic: true };
    const newItems = [...items, optimisticItem];
    
    setOptimisticItems(newItems);
    setItems(newItems);

    try {
      const result = await addItemFn(item);
      setItems(prev => prev.map(i => i.id === tempId ? result : i));
      setOptimisticItems(null);
      return result;
    } catch (err) {
      setItems(previousItems);
      setOptimisticItems(null);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [items, addItemFn]);

  const remove = useCallback(async (itemId) => {
    setIsUpdating(true);
    setError(null);

    const previousItems = items;
    const newItems = items.filter(item => item.id !== itemId);
    
    setOptimisticItems(newItems);
    setItems(newItems);

    try {
      await removeItemFn(itemId);
      setOptimisticItems(null);
    } catch (err) {
      setItems(previousItems);
      setOptimisticItems(null);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [items, removeItemFn]);

  const update = useCallback(async (itemId, updates) => {
    setIsUpdating(true);
    setError(null);

    const previousItems = items;
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates, isOptimistic: true } : item
    );
    
    setOptimisticItems(newItems);
    setItems(newItems);

    try {
      const result = await updateItemFn(itemId, updates);
      setItems(prev => prev.map(i => i.id === itemId ? result : i));
      setOptimisticItems(null);
      return result;
    } catch (err) {
      setItems(previousItems);
      setOptimisticItems(null);
      setError(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [items, updateItemFn]);

  return {
    items: optimisticItems || items,
    add,
    remove,
    update,
    isUpdating,
    error,
    isOptimistic: !!optimisticItems
  };
};

// Optimistic UI component
export const OptimisticUI = ({ 
  children, 
  isOptimistic, 
  className = '' 
}) => (
  <div className={`${isOptimistic ? 'opacity-70' : ''} ${className}`}>
    {children}
    {isOptimistic && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )}
  </div>
);

// ============================================
// INFINITE SCROLL
// ============================================

// Infinite scroll hook
export const useInfiniteScroll = (fetchFn, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const { ref, inView } = useInView({
    threshold: options.threshold || 0.1
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchFn(page, options.limit || 20);
      
      setData(prev => [...prev, ...newData]);
      setHasMore(newData.length >= (options.limit || 20));
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, loading, hasMore, options]);

  useEffect(() => {
    loadMore();
  }, []); // Initial load

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    await loadMore();
  }, [loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    sentinelRef: ref
  };
};

// Infinite scroll list component
export const InfiniteScrollList = ({
  fetchFn,
  renderItem,
  className = '',
  options = {}
}) => {
  const { data, loading, error, hasMore, sentinelRef } = useInfiniteScroll(fetchFn, options);

  return (
    <div className={className}>
      {data.map((item, index) => renderItem(item, index))}
      
      {error && (
        <div className="text-center py-8 text-red-500">
          Failed to load data. <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      {loading && <SkeletonList count={3} />}
      
      {hasMore && <div ref={sentinelRef} className="h-4" />}
      
      {!hasMore && data.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more items to load
        </div>
      )}
    </div>
  );
};

// ============================================
// PULL-TO-REFRESH
// ============================================

// Pull to refresh hook
export const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (containerRef.current.scrollTop === 0 && startY.current) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
        setIsPulling(distance >= threshold);
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setIsPulling(false);
    startY.current = 0;
  }, [isPulling, isRefreshing, onRefresh]);

  return {
    containerRef,
    pullDistance,
    isPulling,
    isRefreshing,
    pullToRefreshProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};

// Pull to refresh indicator
export const PullToRefreshIndicator = ({ pullDistance, threshold, isRefreshing }) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className="flex items-center justify-center py-4 transition-transform"
      style={{ transform: `translateY(${pullDistance}px)` }}
    >
      <motion.div
        animate={{ rotate: isRefreshing ? 360 : rotation }}
        transition={{ duration: isRefreshing ? 1 : 0 }}
        className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
      />
      <span className="ml-2 text-sm text-gray-600">
        {isRefreshing ? 'Refreshing...' : progress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  );
};

// ============================================
// STAGGERED ANIMATIONS
// ============================================

// Staggered children animation
export const StaggeredAnimation = ({ 
  children, 
  staggerDelay = 0.1, 
  className = '' 
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * staggerDelay }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Staggered list animation
export const StaggeredList = ({ 
  items, 
  renderItem, 
  staggerDelay = 0.05, 
  className = '' 
}) => (
  <div className={className}>
    {items.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * staggerDelay }}
      >
        {renderItem(item, index)}
      </motion.div>
    ))}
  </div>
);

// ============================================
// CONTENT PLACEHOLDER PATTERNS
// ============================================

// Empty state placeholder
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = ''
}) => (
  <div className={`text-center py-12 ${className}`}>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-6xl mb-4"
    >
      {icon}
    </motion.div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4">{description}</p>
    {action && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {action}
      </motion.div>
    )}
  </div>
);

// Error state placeholder
export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An error occurred while loading data',
  onRetry,
  className = ''
}) => (
  <div className={`text-center py-12 ${className}`}>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="text-6xl mb-4"
    >
      ⚠️
    </motion.div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4">{description}</p>
    {onRetry && (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </motion.button>
    )}
  </div>
);

// Loading state placeholder
export const LoadingState = ({ message = 'Loading...', className = '' }) => (
  <div className={`text-center py-12 ${className}`}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
    />
    <p className="text-gray-500">{message}</p>
  </div>
);

// ============================================
// COMBINED PATTERNS
// ============================================

// Combined skeleton + progressive loading
export const ProgressiveSkeleton = ({
  content,
  skeleton,
  delay = 1000,
  className = ''
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Combined infinite scroll + skeleton
export const InfiniteScrollWithSkeleton = ({
  fetchFn,
  renderItem,
  skeletonComponent,
  className = '',
  options = {}
}) => {
  const { data, loading, error, hasMore, sentinelRef } = useInfiniteScroll(fetchFn, options);

  return (
    <div className={className}>
      {data.map((item, index) => renderItem(item, index))}
      
      {loading && skeletonComponent}
      
      {error && <ErrorState onRetry={() => window.location.reload()} />}
      
      {hasMore && <div ref={sentinelRef} className="h-4" />}
      
      {!hasMore && data.length === 0 && !loading && (
        <EmptyState
          icon="📋"
          title="No items found"
          description="There are no items to display"
        />
      )}
    </div>
  );
};

export default {
  // Skeleton screens
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  SkeletonForm,
  
  // Progressive loading
  ProgressiveImage,
  ProgressiveContent,
  ProgressiveList,
  
  // Optimistic updates
  useOptimisticUpdate,
  useOptimisticList,
  OptimisticUI,
  
  // Infinite scroll
  useInfiniteScroll,
  InfiniteScrollList,
  
  // Pull to refresh
  usePullToRefresh,
  PullToRefreshIndicator,
  
  // Staggered animations
  StaggeredAnimation,
  StaggeredList,
  
  // Content placeholders
  EmptyState,
  ErrorState,
  LoadingState,
  
  // Combined patterns
  ProgressiveSkeleton,
  InfiniteScrollWithSkeleton
};