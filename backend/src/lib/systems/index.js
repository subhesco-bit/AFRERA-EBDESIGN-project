'use strict';
class SystemsCatalog {
  constructor(opts = {}) {
    this.systems = new Map();
    this.registry = {};
  }

  registerSystem(id, definition) {
    if (!id) throw new Error('System id required');

    this.systems.set(id, {
      id,
      name: definition.name || id,
      category: definition.category || 'general',
      description: definition.description || '',
      capabilities: definition.capabilities || [],
      dependencies: definition.dependencies || [],
      status: definition.status || 'active',
      config: definition.config || {}
    });

    this.registry[id] = this.systems.get(id);
  }

  getSystem(id) {
    return this.systems.get(id) || null;
  }

  findByCat(category) {
    const result = [];
    for (const [id, sys] of this.systems) {
      if (sys.category === category) result.push(sys);
    }
    return result;
  }

  findByCapability(cap) {
    const result = [];
    for (const [id, sys] of this.systems) {
      if (sys.capabilities.includes(cap)) result.push(sys);
    }
    return result;
  }

  getAll() {
    const result = [];
    for (const [id, sys] of this.systems) {
      result.push(sys);
    }
    return result;
  }

  getRegistry() {
    return this.registry;
  }

  getSystemDependencies(id) {
    const sys = this.systems.get(id);
    if (!sys) throw new Error(`System ${id} not found`);
    return sys.dependencies;
  }

  getDependents(id) {
    const deps = [];
    for (const [sysId, sys] of this.systems) {
      if (sys.dependencies.includes(id)) deps.push(sysId);
    }
    return deps;
  }

  validateDependencies() {
    const errors = [];
    for (const [id, sys] of this.systems) {
      for (const dep of sys.dependencies) {
        if (!this.systems.has(dep)) {
          errors.push(`System ${id} depends on ${dep} which does not exist`);
        }
      }
    }
    return errors;
  }
}

module.exports = { SystemsCatalog };
