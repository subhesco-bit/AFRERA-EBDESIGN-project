/**
 * WebSocket Server
 * Real-time tracking and notifications for AFRERA platform
 */

const WebSocket = require('ws');
const { logger } = require('../utils/logger');
const { verifyJWT } = require('../middleware/auth');

class SocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.rooms = new Map(); // roomName -> Set of userIds
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(ws, req) {
    try {
      // Extract token from query parameters
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = await verifyJWT(token);
      const userId = decoded.userId;

      if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store connection
      this.clients.set(userId, ws);
      ws.userId = userId;

      logger.info(`WebSocket connected: userId=${userId}`);

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Successfully connected to AFRERA real-time service'
      });

      // Handle messages from client
      ws.on('message', (data) => {
        this.handleMessage(userId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for userId=${userId}:`, error);
      });

    } catch (error) {
      logger.error('WebSocket connection error', { error: error.message, stack: error.stack });
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Handle incoming messages from client
   */
  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'join_room':
          this.joinRoom(userId, message.room);
          break;
        case 'leave_room':
          this.leaveRoom(userId, message.room);
          break;
        case 'ping':
          this.sendToUser(userId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        case 'subscribe_tracking':
          this.subscribeTracking(userId, message.shipmentId);
          break;
        case 'unsubscribe_tracking':
          this.unsubscribeTracking(userId, message.shipmentId);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', { error: error.message, stack: error.stack });
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(userId) {
    // Remove from all rooms
    for (const [roomName, roomMembers] of this.rooms.entries()) {
      if (roomMembers.has(userId)) {
        roomMembers.delete(userId);
        if (roomMembers.size === 0) {
          this.rooms.delete(roomName);
        }
      }
    }

    // Remove client connection
    this.clients.delete(userId);

    logger.info(`WebSocket disconnected: userId=${userId}`);
  }

  /**
   * Join a room
   */
  joinRoom(userId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(userId);

    logger.debug(`User ${userId} joined room: ${roomName}`);
  }

  /**
   * Leave a room
   */
  leaveRoom(userId, roomName) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(userId);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }

    logger.debug(`User ${userId} left room: ${roomName}`);
  }

  /**
   * Subscribe to shipment tracking updates
   */
  subscribeTracking(userId, shipmentId) {
    const roomName = `tracking:${shipmentId}`;
    this.joinRoom(userId, roomName);
    logger.debug(`User ${userId} subscribed to tracking: ${shipmentId}`);
  }

  /**
   * Unsubscribe from shipment tracking updates
   */
  unsubscribeTracking(userId, shipmentId) {
    let roomName = `tracking:${shipmentId}`;
    this.leaveRoom(userId, roomName);
    logger.debug(`User ${userId} unsubscribed from tracking: ${shipmentId}`);
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Send message to all users in a room
   */
  sendToRoom(roomName, message) {
    const roomMembers = this.rooms.get(roomName);
    if (!roomMembers) return 0;

    let sentCount = 0;
    for (const userId of roomMembers) {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to all connected users
   */
  broadcast(message) {
    let sentCount = 0;
    for (const userId of this.clients.keys()) {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  /**
   * Send notification to user
   */
  sendNotification(userId, notification) {
    return this.sendToUser(userId, {
      type: 'notification',
      timestamp: new Date().toISOString(),
      data: notification
    });
  }

  /**
   * Send shipment tracking update
   */
  sendTrackingUpdate(shipmentId, update) {
    let roomName = `tracking:${shipmentId}`;
    return this.sendToRoom(roomName, {
      type: 'tracking_update',
      timestamp: new Date().toISOString(),
      shipment_id: shipmentId,
      data: update
    });
  }

  /**
   * Send order status update
   */
  sendOrderUpdate(orderId, update) {
    let roomName = `order:${orderId}`;
    return this.sendToRoom(roomName, {
      type: 'order_update',
      timestamp: new Date().toISOString(),
      order_id: orderId,
      data: update
    });
  }

  /**
   * Send price alert
   */
  sendPriceAlert(productId, priceData) {
    let roomName = `product:${productId}`;
    return this.sendToRoom(roomName, {
      type: 'price_alert',
      timestamp: new Date().toISOString(),
      product_id: productId,
      data: priceData
    });
  }

  /**
   * Send weather alert
   */
  sendWeatherAlert(location, weatherData) {
    let roomName = `weather:${location}`;
    return this.sendToRoom(roomName, {
      type: 'weather_alert',
      timestamp: new Date().toISOString(),
      location,
      data: weatherData
    });
  }

  /**
   * Send government announcement
   */
  sendGovernmentAnnouncement(announcement) {
    return this.broadcast({
      type: 'government_announcement',
      timestamp: new Date().toISOString(),
      data: announcement
    });
  }

  /**
   * Get connected users count
   */
  getConnectedCount() {
    return this.clients.size;
  }

  /**
   * Get room members count
   */
  getRoomCount(roomName) {
    return this.rooms.get(roomName)?.size || 0;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    return this.clients.has(userId);
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (const ws of this.clients.values()) {
      ws.close();
    }
    this.clients.clear();
    this.rooms.clear();
    logger.info('All WebSocket connections closed');
  }
}

// Export singleton instance
const socketServer = new SocketServer();

module.exports = socketServer;
