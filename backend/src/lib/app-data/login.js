'use strict';
const { LoginStatus } = require('./types');
const { LoginError } = require('./errors');

class LoginManager {
  constructor() {
    this.sessions = new Map();
    this.users = new Map();
  }

  async login(email, password, opts = {}) {
    if (!email || !password) throw new LoginError('Email and password required');
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.sessions.set(sessionId, {
      userId: email,
      email,
      status: LoginStatus.LOGGED_IN,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (opts.ttl || 7*24*60*60*1000)),
      metadata: opts.metadata || {}
    });
    return { sessionId, email, status: LoginStatus.LOGGED_IN };
  }

  async logout(sessionId) {
    if (!this.sessions.has(sessionId)) throw new LoginError('Session not found');
    this.sessions.delete(sessionId);
  }

  async validateSession(sessionId) {
    const sess = this.sessions.get(sessionId);
    if (!sess) throw new LoginError('Session not found');
    if (sess.expiresAt < new Date()) throw new LoginError('Session expired');
    return sess;
  }

  async getCurrentUser(sessionId) {
    const sess = await this.validateSession(sessionId);
    return { email: sess.email, userId: sess.userId };
  }

  async refreshSession(sessionId, opts = {}) {
    const sess = await this.validateSession(sessionId);
    sess.expiresAt = new Date(Date.now() + (opts.ttl || 7*24*60*60*1000));
    return sess;
  }

  getSessionStatus(sessionId) {
    const sess = this.sessions.get(sessionId);
    return sess ? sess.status : LoginStatus.LOGGED_OUT;
  }
}

module.exports = { LoginManager };
