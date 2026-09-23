'use strict';
const { EmailPasswordProvider } = require('./provider');

class AuthServer {
  constructor(opts = {}) {
    this.providers = new Map();
    this.sessions = new Map();
    this.defaultProvider = opts.defaultProvider || 'email-password';

    if (opts.emailPassword !== false) {
      this.providers.set('email-password', new EmailPasswordProvider());
    }
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  async authenticate(credentials, opts = {}) {
    const provider = this.providers.get(opts.provider || this.defaultProvider);
    if (!provider) throw new Error('Provider not found');

    const user = await provider.verify(credentials);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    this.sessions.set(sessionId, {
      userId: user.userId,
      email: user.email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (opts.ttl || 7*24*60*60*1000)),
      provider: opts.provider || this.defaultProvider
    });

    return { sessionId, user };
  }

  async getSession(sessionId) {
    const sess = this.sessions.get(sessionId);
    if (!sess) throw new Error('Session not found');
    if (sess.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      throw new Error('Session expired');
    }
    return sess;
  }

  async logout(sessionId) {
    this.sessions.delete(sessionId);
  }

  async register(credentials, opts = {}) {
    const provider = this.providers.get(opts.provider || this.defaultProvider);
    if (!provider) throw new Error('Provider not found');
    if (!provider.registerUser) throw new Error('Provider does not support registration');

    return await provider.registerUser(credentials.email, credentials.password);
  }
}

module.exports = { AuthServer };
