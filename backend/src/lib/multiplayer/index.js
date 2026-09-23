'use strict';
const EventEmitter = require('events');

class MultiplayerCoordinator extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.connections = new Map();
    this.rooms = new Map();
    this.messages = [];
    this.opts = opts;
  }

  addConnection(userId, connection) {
    if (!this.connections.has(userId)) this.connections.set(userId, []);
    this.connections.get(userId).push(connection);
    this.emit('connection', { userId, timestamp: new Date() });
  }

  removeConnection(userId, connection) {
    const conns = this.connections.get(userId) || [];
    const idx = conns.indexOf(connection);
    if (idx > -1) conns.splice(idx, 1);
    if (conns.length === 0) this.connections.delete(userId);
    this.emit('disconnect', { userId, timestamp: new Date() });
  }

  createRoom(roomId, opts = {}) {
    if (this.rooms.has(roomId)) throw new Error(`Room ${roomId} already exists`);
    this.rooms.set(roomId, {
      id: roomId,
      members: new Set(),
      state: opts.initialState || {},
      createdAt: new Date()
    });
  }

  joinRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    room.members.add(userId);
    this.emit('member_joined', { roomId, userId });
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.members.delete(userId);
    if (room.members.size === 0 && !this.opts.persistEmpty) {
      this.rooms.delete(roomId);
    }
    this.emit('member_left', { roomId, userId });
  }

  broadcastToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const msg = { ...message, roomId, timestamp: new Date() };
    this.messages.push(msg);

    for (const userId of room.members) {
      const conns = this.connections.get(userId) || [];
      for (const conn of conns) {
        conn.send(msg);
      }
    }
    this.emit('broadcast', msg);
  }

  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.members);
  }

  getRoomState(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.state : null;
  }

  updateRoomState(roomId, update) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    room.state = { ...room.state, ...update };
    this.emit('state_updated', { roomId, state: room.state });
  }
}

module.exports = { MultiplayerCoordinator };
