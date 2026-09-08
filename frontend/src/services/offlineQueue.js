class OfflineQueue {
  constructor() {
    this.queueName = 'afrera-offline-queue';
    this.queue = this.loadQueue();
  }

  loadQueue() {
    try {
      const stored = localStorage.getItem(this.queueName);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      return [];
    }
  }

  saveQueue() {
    try {
      localStorage.setItem(this.queueName, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  add(operation) {
    const queuedItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      operation,
      status: 'pending',
      retryCount: 0,
    };

    this.queue.push(queuedItem);
    this.saveQueue();

    // Register sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('offline-sync');
      }).catch((error) => {
        console.error('Sync registration failed:', error);
      });
    }

    return queuedItem.id;
  }

  remove(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
  }

  updateStatus(id, status, error = null) {
    const item = this.queue.find(item => item.id === id);
    if (item) {
      item.status = status;
      item.error = error;
      if (status === 'failed') {
        item.retryCount++;
      }
      this.saveQueue();
    }
  }

  getPendingItems() {
    return this.queue.filter(item => item.status === 'pending');
  }

  getFailedItems() {
    return this.queue.filter(item => item.status === 'failed');
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  async processQueue(api) {
    const pendingItems = this.getPendingItems();

    for (const item of pendingItems) {
      try {
        const { operation } = item;

        // Execute the operation
        let response;
        switch (operation.method) {
          case 'POST':
            response = await api.post(operation.url, operation.data);
            break;
          case 'PUT':
            response = await api.put(operation.url, operation.data);
            break;
          case 'DELETE':
            response = await api.delete(operation.url);
            break;
          case 'PATCH':
            response = await api.patch(operation.url, operation.data);
            break;
          default:
            throw new Error(`Unsupported method: ${operation.method}`);
        }

        // Remove successful operations
        this.remove(item.id);

      } catch (error) {
        console.error(`Failed to process queued item ${item.id}:`, error);
        this.updateStatus(item.id, 'failed', error.message);

        // Max retries reached
        if (item.retryCount >= 3) {
          this.updateStatus(item.id, 'abandoned');
        }
      }
    }
  }

  getQueueSize() {
    return this.queue.length;
  }

  getQueueStatus() {
    return {
      total: this.queue.length,
      pending: this.getPendingItems().length,
      failed: this.getFailedItems().length,
      abandoned: this.queue.filter(item => item.status === 'abandoned').length,
    };
  }
}

// Singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;
