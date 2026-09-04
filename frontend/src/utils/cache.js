/**
 * Enterprise-Grade Caching and Offline Support
 *
 * Production-ready caching with:
 * - LocalStorage and SessionStorage wrappers
 * - Cache invalidation strategies (TTL, version-based)
 * - Stale-while-revalidate pattern
 * - Offline detection and handling
 * - Network status monitoring
 * - Cache management utilities
 * - API response caching
 * - IndexedDB integration for larger data
 */

import config from '../config/env';

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  ENABLED: config.CACHE_ENABLED,
  DEFAULT_TTL: config.CACHE_TTL_MS,
  PREFIX: 'ebdesign_cache_',
  VERSION: 'v1',
};

/**
 * Storage types
 */
const StorageType = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  MEMORY: 'memory',
};

/**
 * In-memory cache for fast access
 */
const memoryCache = new Map();

/**
 * Check if online
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * Get cache key with prefix and version
 */
function getCacheKey(key) {
  return `${CACHE_CONFIG.PREFIX}${CACHE_CONFIG.VERSION}_${key}`;
}

/**
 * Parse cache entry
 */
function parseCacheEntry(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Stringify cache entry
 */
function stringifyCacheEntry(entry) {
  try {
    return JSON.stringify(entry);
  } catch {
    return null;
  }
}

/**
 * Check if cache entry is expired
 */
function isExpired(entry) {
  if (!entry || !entry.timestamp) return true;
  const ttl = entry.ttl || CACHE_CONFIG.DEFAULT_TTL;
  return Date.now() - entry.timestamp > ttl;
}

/**
 * Get storage object
 */
function getStorage(type) {
  if (type === StorageType.MEMORY) {
    return memoryCache;
  }
  return type === StorageType.SESSION ? sessionStorage : localStorage;
}

/**
 * Set item in cache
 */
function setItem(key, value, options = {}) {
  if (!CACHE_CONFIG.ENABLED) return false;

  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    storage = StorageType.LOCAL,
    tags = [],
  } = options;

  const cacheKey = getCacheKey(key);
  const storageObj = getStorage(storage);

  const entry = {
    value,
    timestamp: Date.now(),
    ttl,
    tags,
    version: CACHE_CONFIG.VERSION,
  };

  try {
    if (storage === StorageType.MEMORY) {
      storageObj.set(cacheKey, entry);
    } else {
      storageObj.setItem(cacheKey, stringifyCacheEntry(entry));
    }
    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Get item from cache
 */
function getItem(key, storage = StorageType.LOCAL) {
  if (!CACHE_CONFIG.ENABLED) return null;

  const cacheKey = getCacheKey(key);
  const storageObj = getStorage(storage);

  try {
    let entry;

    if (storage === StorageType.MEMORY) {
      entry = storageObj.get(cacheKey);
    } else {
      const value = storageObj.getItem(cacheKey);
      entry = value ? parseCacheEntry(value) : null;
    }

    if (!entry) return null;

    // Check version
    if (entry.version !== CACHE_CONFIG.VERSION) {
      removeItem(key, storage);
      return null;
    }

    // Check expiration
    if (isExpired(entry)) {
      removeItem(key, storage);
      return null;
    }

    return entry.value;
  } catch (error) {

    return null;
  }
}

/**
 * Remove item from cache
 */
function removeItem(key, storage = StorageType.LOCAL) {
  const cacheKey = getCacheKey(key);
  const storageObj = getStorage(storage);

  try {
    if (storage === StorageType.MEMORY) {
      storageObj.delete(cacheKey);
    } else {
      storageObj.removeItem(cacheKey);
    }
    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Clear all cache
 */
function clearCache(storage = StorageType.LOCAL) {
  const storageObj = getStorage(storage);

  try {
    if (storage === StorageType.MEMORY) {
      storageObj.clear();
    } else {
      const keys = Object.keys(storageObj);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_CONFIG.PREFIX)) {
          storageObj.removeItem(key);
        }
      });
    }
    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Clear cache by tag
 */
function clearByTag(tag, storage = StorageType.LOCAL) {
  const storageObj = getStorage(storage);

  try {
    if (storage === StorageType.MEMORY) {
      for (const [key, entry] of storageObj.entries()) {
        if (entry.tags && entry.tags.includes(tag)) {
          storageObj.delete(key);
        }
      }
    } else {
      const keys = Object.keys(storageObj);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_CONFIG.PREFIX)) {
          const value = storageObj.getItem(key);
          const entry = parseCacheEntry(value);
          if (entry && entry.tags && entry.tags.includes(tag)) {
            storageObj.removeItem(key);
          }
        }
      });
    }
    return true;
  } catch (error) {

    return false;
  }
}

/**
 * Get cache size
 */
function getCacheSize(storage = StorageType.LOCAL) {
  const storageObj = getStorage(storage);

  try {
    if (storage === StorageType.MEMORY) {
      return storageObj.size;
    }

    let size = 0;
    const keys = Object.keys(storageObj);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_CONFIG.PREFIX)) {
        size++;
      }
    });
    return size;
  } catch (error) {

    return 0;
  }
}

/**
 * Stale-while-revalidate pattern
 */
async function staleWhileRevalidate(key, fetchFn, options = {}) {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    storage = StorageType.LOCAL,
    tags = [],
    forceRefresh = false,
  } = options;

  // Return cached data immediately if available and not forcing refresh
  if (!forceRefresh) {
    const cached = getItem(key, storage);
    if (cached !== null) {
      // Revalidate in background
      fetchFn().then((freshData) => {
        setItem(key, freshData, { ttl, storage, tags });
      }).catch(() => {
        // Silently fail revalidation
      });
      return cached;
    }
  }

  // Fetch fresh data
  try {
    const freshData = await fetchFn();
    setItem(key, freshData, { ttl, storage, tags });
    return freshData;
  } catch (error) {
    // If fetch fails, try to return stale data
    const stale = getItem(key, storage);
    if (stale !== null) {

      return stale;
    }
    throw error;
  }
}

/**
 * Cache API responses
 */
const apiCache = {
  /**
   * Cache GET request
   */
  async get(url, fetchFn, options = {}) {
    const cacheKey = `api_${url}`;
    return staleWhileRevalidate(cacheKey, fetchFn, {
      ttl: options.ttl || CACHE_CONFIG.DEFAULT_TTL,
      storage: options.storage || StorageType.LOCAL,
      tags: ['api', ...(options.tags || [])],
    });
  },

  /**
   * Invalidate cache by URL pattern
   */
  invalidatePattern(pattern, storage = StorageType.LOCAL) {
    const storageObj = getStorage(storage);

    try {
      if (storage === StorageType.MEMORY) {
        for (const [key] of storageObj.entries()) {
          if (key.includes(pattern)) {
            storageObj.delete(key);
          }
        }
      } else {
        const keys = Object.keys(storageObj);
        keys.forEach((key) => {
          if (key.startsWith(CACHE_CONFIG.PREFIX) && key.includes(pattern)) {
            storageObj.removeItem(key);
          }
        });
      }
      return true;
    } catch (error) {

      return false;
    }
  },

  /**
   * Clear all API cache
   */
  clear(storage = StorageType.LOCAL) {
    return clearByTag('api', storage);
  },
};

/**
 * Network status monitoring
 */
const networkMonitor = {
  listeners: new Set(),

  /**
   * Add listener for network status changes
   */
  addListener(callback) {
    this.listeners.add(callback);
  },

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  },

  /**
   * Notify listeners
   */
  notifyListeners(online) {
    this.listeners.forEach((callback) => {
      try {
        callback(online);
      } catch (error) {

      }
    });
  },

  /**
   * Initialize network monitoring
   */
  init() {
    const handleOnline = () => this.notifyListeners(true);
    const handleOffline = () => this.notifyListeners(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};

/**
 * Offline queue for actions when offline
 */
const offlineQueue = {
  queue: [],
  maxQueueSize: 100,

  /**
   * Add action to queue
   */
  add(action) {
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift(); // Remove oldest
    }
    this.queue.push({
      ...action,
      timestamp: Date.now(),
    });
    this.saveQueue();
  },

  /**
   * Process queue when back online
   */
  async process(processFn) {
    if (!isOnline()) return 0;

    let processed = 0;
    const failed = [];

    for (const action of this.queue) {
      try {
        await processFn(action);
        processed++;
      } catch (error) {
        failed.push(action);
      }
    }

    this.queue = failed;
    this.saveQueue();

    return processed;
  },

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {

    }
  },

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const saved = localStorage.getItem('offline_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (error) {

    }
  },

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    this.saveQueue();
  },

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  },
};

// Load offline queue on initialization
offlineQueue.loadQueue();

/**
 * IndexedDB for larger data storage
 */
const indexedDBCache = {
  dbName: 'EBDesignCache',
  version: 1,
  db: null,

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  },

  /**
   * Set item in IndexedDB
   */
  async setItem(key, value, options = {}) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');

      const entry = {
        key,
        value,
        timestamp: Date.now(),
        ttl: options.ttl || CACHE_CONFIG.DEFAULT_TTL,
        tags: options.tags || [],
      };

      const request = store.put(entry);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get item from IndexedDB
   */
  async getItem(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check expiration
        if (isExpired(entry)) {
          this.removeItem(key);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Remove item from IndexedDB
   */
  async removeItem(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Clear IndexedDB
   */
  async clear() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * Cache utilities API
 */
const cache = {
  StorageType,
  isOnline,
  setItem,
  getItem,
  removeItem,
  clearCache,
  clearByTag,
  getCacheSize,
  staleWhileRevalidate,
  apiCache,
  networkMonitor,
  offlineQueue,
  indexedDBCache,
};

export default cache;
