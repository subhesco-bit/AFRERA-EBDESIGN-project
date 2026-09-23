'use strict';
const EventEmitter = require('events');

class OSLayer extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.services = new Map();
    this.boot = new Map();
    this.store = new Map();
    this.config = opts.config || {};
  }

  registerService(name, service) {
    if (this.services.has(name)) throw new Error(`Service ${name} already registered`);
    this.services.set(name, service);
    this.emit('service:registered', { name, timestamp: new Date() });
  }

  async startService(name) {
    const svc = this.services.get(name);
    if (!svc) throw new Error(`Service ${name} not found`);
    if (typeof svc.start === 'function') await svc.start();
    this.boot.set(name, { status: 'started', timestamp: new Date() });
    this.emit('service:started', { name });
  }

  async stopService(name) {
    const svc = this.services.get(name);
    if (!svc) throw new Error(`Service ${name} not found`);
    if (typeof svc.stop === 'function') await svc.stop();
    this.boot.delete(name);
    this.emit('service:stopped', { name });
  }

  async bootstrap(serviceNames = []) {
    const toStart = serviceNames.length > 0 ? serviceNames : Array.from(this.services.keys());
    for (const name of toStart) {
      try {
        await this.startService(name);
      } catch (err) {
        this.emit('boot:error', { name, error: err.message });
      }
    }
    this.emit('boot:complete', { count: this.boot.size });
  }

  getServiceStatus(name) {
    return this.boot.get(name) || { status: 'not_started' };
  }

  getAllServices() {
    const result = {};
    for (const [name, svc] of this.services) {
      result[name] = this.getServiceStatus(name);
    }
    return result;
  }

  getBootStatus() {
    const booted = Array.from(this.boot.keys());
    const total = this.services.size;
    return { booted: booted.length, total, status: booted.length === total ? 'ready' : 'booting' };
  }
}

module.exports = { OSLayer };
