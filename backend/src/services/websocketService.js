/**
 * WebSocket Service for Real-time Updates
 * Enhanced Socket.IO integration for live data synchronization
 */

const { Server } = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.eventHandlers = new Map();
  }

  /**
   * Attach an existing Socket.IO server (avoids a second Server on the same HTTP port).
   */
  attach(io) {
  // Validate inputs
  if (!io) throw new Error('Missing required parameter');

    this.io = io;
    this.setupEventHandlers();
    return this.io;
  }

  /**
   * Initialize WebSocket service with HTTP server
   */
  initialize(httpServer) {
    try {
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.setupEventHandlers();
      console.log('WebSocket service initialized successfully');
      return this.io;
    } catch (error) {
      console.error('Error initializing WebSocket service:', error);
      throw new Error('Failed to initialize WebSocket service');
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, {
        connectedAt: new Date(),
        userId: socket.handshake.query.userId || null,
        rooms: []
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to real-time updates',
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Handle room subscriptions
      socket.on('join-room', (data) => {
        const { room } = data;
        socket.join(room);
        this.connectedClients.get(socket.id).rooms.push(room);
        socket.emit('room-joined', { room, timestamp: new Date().toISOString() });
        console.log(`Socket ${socket.id} joined room: ${room}`);
      });

      // Handle room departures
      socket.on('leave-room', (data) => {
        const { room } = data;
        socket.leave(room);
        const clientData = this.connectedClients.get(socket.id);
        if (clientData) {
          clientData.rooms = clientData.rooms.filter(r => r !== room);
        }
        socket.emit('room-left', { room, timestamp: new Date().toISOString() });
        console.log(`Socket ${socket.id} left room: ${room}`);
      });

      // Handle custom events
      socket.on('subscribe-updates', (data) => {
        const { channels } = data;
        channels.forEach(channel => {
          socket.join(channel);
        });
        socket.emit('updates-subscribed', { channels, timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', socket.id, error);
      });
    });
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send event to specific room
   */
  sendToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send event to specific client
   */
  sendToClient(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send real-time order updates
   */
  sendOrderUpdate(orderData) {
    this.sendToRoom('orders', 'order-update', orderData);
    this.broadcast('order-update', orderData);
  }

  /**
   * Send real-time inventory updates
   */
  sendInventoryUpdate(inventoryData) {
    this.sendToRoom('inventory', 'inventory-update', inventoryData);
  }

  /**
   * Send real-time notification
   */
  sendNotification(notification) {
    const { userId, type, message, data } = notification;
    
    if (userId) {
      this.sendToRoom(`user-${userId}`, 'notification', {
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    } else {
      this.broadcast('notification', {
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send real-time farmer updates
   */
  sendFarmerUpdate(farmerData) {
    this.sendToRoom('farmers', 'farmer-update', farmerData);
  }

  /**
   * Send real-time AI updates
   */
  sendAIUpdate(aiData) {
    this.sendToRoom('ai', 'ai-update', aiData);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  /**
   * Get rooms for a specific client
   */
  getClientRooms(socketId) {
    const clientData = this.connectedClients.get(socketId);
    return clientData ? clientData.rooms : [];
  }

  /**
   * Get all connected clients info
   */
  getAllClientsInfo() {
    const clients = [];
    this.connectedClients.forEach((data, socketId) => {
      clients.push({
        socketId,
        userId: data.userId,
        connectedAt: data.connectedAt,
        rooms: data.rooms
      });
    });
    return clients;
  }
}

module.exports = new WebSocketService();