'use strict';
const EventEmitter = require('events');

class ModuleEngine extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.modules = new Map();
    this.loaded = new Map();
    this.dependencies = new Map();
    this.config = opts.config || {};
  }

  registerModule(manifest) {
    if (!manifest.id) throw new Error('Module must have id');
    if (this.modules.has(manifest.id)) throw new Error(`Module ${manifest.id} already registered`);

    this.modules.set(manifest.id, {
      id: manifest.id,
      name: manifest.name || manifest.id,
      version: manifest.version || '1.0.0',
      category: manifest.category || 'unknown',
      status: manifest.status || 'WIRED',
      dependencies: manifest.dependencies || [],
      services: manifest.services || [],
      metadata: manifest
    });

    if (manifest.dependencies) {
      this.dependencies.set(manifest.id, manifest.dependencies);
    }

    this.emit('module:registered', { id: manifest.id });
  }

  async loadModule(id) {
    if (this.loaded.has(id)) return this.loaded.get(id);

    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Module ${id} not found`);

    // Load dependencies first
    for (const dep of mod.dependencies) {
      await this.loadModule(dep);
    }

    this.loaded.set(id, { ...mod, loadedAt: new Date() });
    this.emit('module:loaded', { id, timestamp: new Date() });
    return this.loaded.get(id);
  }

  async unloadModule(id) {
    const dependents = this.getDependents(id);
    for (const dep of dependents) {
      await this.unloadModule(dep);
    }
    this.loaded.delete(id);
    this.emit('module:unloaded', { id });
  }

  getDependents(id) {
    const deps = [];
    for (const [modId, modDeps] of this.dependencies) {
      if (modDeps.includes(id)) deps.push(modId);
    }
    return deps;
  }

  getLoadedModules() {
    const result = {};
    for (const [id, mod] of this.loaded) {
      result[id] = { name: mod.name, version: mod.version, status: mod.status };
    }
    return result;
  }

  getModule(id) {
    return this.modules.get(id) || null;
  }

  getAllModules() {
    const result = [];
    for (const [id, mod] of this.modules) {
      result.push({ id, ...mod });
    }
    return result;
  }
}

module.exports = { ModuleEngine };
