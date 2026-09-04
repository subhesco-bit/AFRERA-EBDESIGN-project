/**
 * Real-Time Updates and Notification System
 * Production-level real-time functionality with WebSocket integration
 *
 * Features:
 * - WebSocket connection management
 * - Real-time data synchronization
 * - Push notifications
 * - Toast notification system
 * - Event-driven architecture
 * - Connection state management
 * - Automatic reconnection
 * - Message queuing
 */

import { io } from 'socket.io-client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedToast } from '../components/ui/enhancedComponents';

// WebSocket connection states
export const CONNECTION_STATE = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Notification priorities
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Real-time service class
class RealTimeService {
  constructor() {
    this.socket = null;
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageQueue = [];
    this.eventHandlers = new Map();
    this.connectionCallbacks = new Set();
  }

  connect(url, options = {}) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.connectionState = CONNECTION_STATE.CONNECTING;
    this.notifyConnectionStateChange();

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      ...options,
    });

    this.socket.on('connect', () => {
      this.connectionState = CONNECTION_STATE.CONNECTED;
      this.reconnectAttempts = 0;
      this.notifyConnectionStateChange();
      this.processMessageQueue();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = CONNECTION_STATE.DISCONNECTED;
      this.notifyConnectionStateChange();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.connectionState = CONNECTION_STATE.RECONNECTING;
      this.reconnectAttempts = attemptNumber;
      this.notifyConnectionStateChange();
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState = CONNECTION_STATE.ERROR;
      this.notifyConnectionStateChange();
    });

    this.socket.on('error', (error) => {
      this.connectionState = CONNECTION_STATE.ERROR;
      this.notifyConnectionStateChange();
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = CONNECTION_STATE.DISCONNECTED;
      this.notifyConnectionStateChange();
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
      if (this.eventHandlers.get(event).size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.messageQueue.push({ event, data });
    }
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const { event, data } = this.messageQueue.shift();
      this.socket.emit(event, data);
    }
  }

  getConnectionState() {
    return this.connectionState;
  }

  onConnectionStateChange(callback) {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  notifyConnectionStateChange() {
    this.connectionCallbacks.forEach(callback => {
      callback(this.connectionState);
    });
  }
}

// Global real-time service instance
export const realTimeService = new RealTimeService();

// Hook for real-time connection
export const useRealTimeConnection = (url, options = {}) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const service = realTimeService.connect(url, options);

    const unsubscribe = realTimeService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setReconnectAttempts(realTimeService.reconnectAttempts);
    });

    return () => {
      unsubscribe();
      realTimeService.disconnect();
    };
  }, [url, JSON.stringify(options)]);

  return { connectionState, reconnectAttempts };
};

// Hook for real-time events
export const useRealTimeEvent = (event, handler, dependencies = []) => {
  useEffect(() => {
    realTimeService.on(event, handler);
    return () => realTimeService.off(event, handler);
  }, [event, handler, ...dependencies]);
};

// Hook for real-time data with automatic updates
export const useRealTimeData = (initialData, eventName, transformFn = (data) => data) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useRealTimeEvent(eventName, (newData) => {
    try {
      setIsLoading(true);
      const transformedData = transformFn(newData);
      setData(transformedData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  });

  const updateData = useCallback((newData) => {
    setData(newData);
    realTimeService.emit(eventName, newData);
  }, [eventName]);

  return { data, updateData, isLoading, error };
};

// Notification system
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.requestPermission();
  }

  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  add(notification) {
    const id = Date.now();
    const enhancedNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(enhancedNotification);
    this.notifyListeners();

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon || '/favicon.ico',
        tag: notification.type,
      });
    }

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  remove(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  clear() {
    this.notifications = [];
    this.notifyListeners();
  }

  getNotifications() {
    return [...this.notifications];
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.getNotifications());
    });
  }

  // Convenience methods
  success(message, options = {}) {
    return this.add({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: 'Success',
      message,
      priority: NOTIFICATION_PRIORITY.NORMAL,
      duration: 3000,
      ...options,
    });
  }

  error(message, options = {}) {
    return this.add({
      type: NOTIFICATION_TYPES.ERROR,
      title: 'Error',
      message,
      priority: NOTIFICATION_PRIORITY.HIGH,
      duration: 5000,
      ...options,
    });
  }

  warning(message, options = {}) {
    return this.add({
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Warning',
      message,
      priority: NOTIFICATION_PRIORITY.NORMAL,
      duration: 4000,
      ...options,
    });
  }

  info(message, options = {}) {
    return this.add({
      type: NOTIFICATION_TYPES.INFO,
      title: 'Info',
      message,
      priority: NOTIFICATION_PRIORITY.LOW,
      duration: 3000,
      ...options,
    });
  }
}

// Global notification system instance
export const notificationSystem = new NotificationSystem();

// Hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe(setNotifications);
    setNotifications(notificationSystem.getNotifications());
    return unsubscribe;
  }, []);

  return {
    notifications,
    add: notificationSystem.add.bind(notificationSystem),
    remove: notificationSystem.remove.bind(notificationSystem),
    markAsRead: notificationSystem.markAsRead.bind(notificationSystem),
    markAllAsRead: notificationSystem.markAllAsRead.bind(notificationSystem),
    clear: notificationSystem.clear.bind(notificationSystem),
    unreadCount: notificationSystem.getUnreadCount(),
    success: notificationSystem.success.bind(notificationSystem),
    error: notificationSystem.error.bind(notificationSystem),
    warning: notificationSystem.warning.bind(notificationSystem),
    info: notificationSystem.info.bind(notificationSystem),
  };
};

// Toast notification component
export const ToastContainer = () => {
  const { notifications, remove } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <EnhancedToast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => remove(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Real-time data sync hook
export const useRealTimeSync = (resource, initialData, syncInterval = 30000) => {
  const [data, setData] = useState(initialData);
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Callers provide a verified canonical API path; there is no generic
      // backend resource endpoint.
      if (typeof resource !== 'string' || !resource.startsWith('/api/v1/')) {
        throw new Error('useRealTimeSync requires a canonical /api/v1/ resource path');
      }
      const response = await fetch(resource);
      const newData = await response.json();
      setData(newData);
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [resource]);

  useEffect(() => {
    // Initial sync
    syncData();

    // Set up interval sync
    const interval = setInterval(syncData, syncInterval);

    // Listen for real-time updates
    const unsubscribe = realTimeService.on(`${resource}:update`, (newData) => {
      setData(newData);
      setLastSync(new Date());
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [resource, syncInterval, syncData]);

  return { data, syncData, lastSync, isSyncing };
};

// Connection status indicator component
export const ConnectionStatusIndicator = () => {
  const { connectionState } = useRealTimeConnection(process.env.REACT_APP_WS_URL);

  const statusConfig = {
    [CONNECTION_STATE.CONNECTING]: { color: 'yellow', text: 'Connecting...' },
    [CONNECTION_STATE.CONNECTED]: { color: 'green', text: 'Connected' },
    [CONNECTION_STATE.DISCONNECTED]: { color: 'red', text: 'Disconnected' },
    [CONNECTION_STATE.RECONNECTING]: { color: 'yellow', text: 'Reconnecting...' },
    [CONNECTION_STATE.ERROR]: { color: 'red', text: 'Connection Error' },
  };

  const config = statusConfig[connectionState] || statusConfig[CONNECTION_STATE.DISCONNECTED];

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full bg-${config.color}-500 animate-pulse`} />
      <span className="text-sm text-gray-600">{config.text}</span>
    </div>
  );
};

// Event-driven state management
export const useEventBus = () => {
  const [events, setEvents] = useState([]);

  const emit = useCallback((eventName, payload) => {
    const event = { id: Date.now(), name: eventName, payload, timestamp: new Date() };
    setEvents(prev => [...prev, event]);
    realTimeService.emit(eventName, payload);
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    return realTimeService.on(eventName, handler);
  }, []);

  return { events, emit, subscribe };
};

export default {
  realTimeService,
  notificationSystem,
  useRealTimeConnection,
  useRealTimeEvent,
  useRealTimeData,
  useNotifications,
  ToastContainer,
  useRealTimeSync,
  ConnectionStatusIndicator,
  useEventBus,
  CONNECTION_STATE,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
};
