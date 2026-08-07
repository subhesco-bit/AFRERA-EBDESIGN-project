/**
 * WebSocket Integration
 * Exports WebSocket server and helper functions
 */

const socketServer = require('./socketServer');

/**
 * Initialize WebSocket server with HTTP server
 */
function initializeWebSocket(server) {
  socketServer.initialize(server);
}

module.exports = {
  initializeWebSocket,
  socketServer
};
