/**
 * Push Notifications Utility
 * 
 * Provides push notification functionality for web, mobile, and desktop
 * using the Web Push API and service workers
 */

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.permission = 'default';
  }

  get isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Get current subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      // Get current permission
      this.permission = Notification.permission;

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async subscribeToPush() {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Convert VAPID key to Uint8Array
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      console.log('Successfully subscribed to push notifications');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush() {
    if (!this.subscription) {
      console.warn('No active subscription to unsubscribe from');
      return;
    }

    try {
      await this.subscription.unsubscribe();
      
      // Remove subscription from server
      await this.removeSubscriptionFromServer(this.subscription);

      this.subscription = null;
      console.log('Successfully unsubscribed from push notifications');
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch('/api/v1/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      throw error;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  getSubscriptionStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isSubscribed: !!this.subscription,
      subscription: this.subscription
    };
  }

  async showLocalNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Export convenience functions
export const initializePushNotifications = () => pushNotificationManager.initialize();
export const requestNotificationPermission = () => pushNotificationManager.requestPermission();
export const subscribeToPush = () => pushNotificationManager.subscribeToPush();
export const unsubscribeFromPush = () => pushNotificationManager.unsubscribeFromPush();
export const showNotification = (title, options) => pushNotificationManager.showLocalNotification(title, options);
export const getSubscriptionStatus = () => pushNotificationManager.getSubscriptionStatus();
