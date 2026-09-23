'use strict';
const { AuthProvider, EmailPasswordProvider } = require('./provider');
const { AuthServer } = require('./server');
const { createAuthMiddleware, createGateMiddleware } = require('./middleware');

// Singleton instance
let authServer = null;

function getAuthServer() {
  if (!authServer) authServer = new AuthServer();
  return authServer;
}

function initializeAuthServer(opts = {}) {
  authServer = new AuthServer(opts);
  return authServer;
}

module.exports = {
  AuthProvider,
  EmailPasswordProvider,
  AuthServer,
  createAuthMiddleware,
  createGateMiddleware,
  getAuthServer,
  initializeAuthServer
};
