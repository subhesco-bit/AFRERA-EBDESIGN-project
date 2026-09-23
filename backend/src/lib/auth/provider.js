'use strict';
const crypto = require('crypto');

class AuthProvider {
  constructor(opts = {}) {
    this.name = opts.name || 'provider';
    this.config = opts.config || {};
  }

  async verify(credentials) {
    throw new Error('verify() must be implemented');
  }

  async getUserProfile(id) {
    throw new Error('getUserProfile() must be implemented');
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyToken(token, secret) {
    const hash = crypto.createHmac('sha256', secret).update(token).digest('hex');
    return hash;
  }
}

class EmailPasswordProvider extends AuthProvider {
  constructor(opts = {}) {
    super(opts);
    this.name = 'email-password';
    this.users = new Map();
  }

  async verify(credentials) {
    const { email, password } = credentials;
    if (!email || !password) throw new Error('Email and password required');

    const user = this.users.get(email);
    if (!user) throw new Error('User not found');

    const hashedAttempt = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedAttempt !== user.passwordHash) throw new Error('Invalid password');

    return { userId: user.id, email, verified: true };
  }

  async registerUser(email, password) {
    if (this.users.has(email)) throw new Error('User already exists');
    const id = `user_${Date.now()}`;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    this.users.set(email, { id, email, passwordHash, createdAt: new Date() });
    return { userId: id, email };
  }

  async getUserProfile(email) {
    const user = this.users.get(email);
    if (!user) throw new Error('User not found');
    const { passwordHash, ...profile } = user;
    return profile;
  }
}

module.exports = { AuthProvider, EmailPasswordProvider };
