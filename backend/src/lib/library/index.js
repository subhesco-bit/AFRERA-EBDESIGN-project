'use strict';
const EventEmitter = require('events');

class LibraryCatalog extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.catalog = new Map();
    this.index = new Map();
    this.tags = new Map();
    this.config = opts.config || {};
  }

  add(id, entry) {
    if (this.catalog.has(id)) throw new Error(`Entry ${id} already exists`);

    const item = {
      id,
      name: entry.name || id,
      type: entry.type || 'module',
      category: entry.category || 'general',
      description: entry.description || '',
      version: entry.version || '1.0.0',
      tags: entry.tags || [],
      metadata: entry.metadata || {},
      addedAt: new Date()
    };

    this.catalog.set(id, item);

    // Index by type and category
    this.updateIndex(id, item);

    // Index by tags
    for (const tag of item.tags) {
      if (!this.tags.has(tag)) this.tags.set(tag, []);
      this.tags.get(tag).push(id);
    }

    this.emit('entry:added', { id, type: item.type });
  }

  updateIndex(id, item) {
    const key = `${item.type}:${item.category}`;
    if (!this.index.has(key)) this.index.set(key, []);
    this.index.get(key).push(id);
  }

  get(id) {
    return this.catalog.get(id) || null;
  }

  findByType(type) {
    const result = [];
    for (const [id, entry] of this.catalog) {
      if (entry.type === type) result.push(entry);
    }
    return result;
  }

  findByCategory(category) {
    const result = [];
    for (const [id, entry] of this.catalog) {
      if (entry.category === category) result.push(entry);
    }
    return result;
  }

  findByTag(tag) {
    const ids = this.tags.get(tag) || [];
    return ids.map(id => this.catalog.get(id)).filter(Boolean);
  }

  search(query) {
    const q = query.toLowerCase();
    const result = [];
    for (const [id, entry] of this.catalog) {
      if (id.toLowerCase().includes(q) ||
          entry.name.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q)) {
        result.push(entry);
      }
    }
    return result;
  }

  getAll() {
    const result = [];
    for (const [id, entry] of this.catalog) {
      result.push(entry);
    }
    return result;
  }

  getStatistics() {
    const stats = {
      total: this.catalog.size,
      byType: {},
      byCategory: {}
    };

    for (const entry of this.catalog.values()) {
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      stats.byCategory[entry.category] = (stats.byCategory[entry.category] || 0) + 1;
    }

    return stats;
  }

  remove(id) {
    const entry = this.catalog.get(id);
    if (!entry) throw new Error(`Entry ${id} not found`);

    this.catalog.delete(id);

    // Remove from index
    const key = `${entry.type}:${entry.category}`;
    const idx = this.index.get(key) || [];
    idx.splice(idx.indexOf(id), 1);

    // Remove from tags
    for (const tag of entry.tags) {
      const tagged = this.tags.get(tag) || [];
      tagged.splice(tagged.indexOf(id), 1);
    }

    this.emit('entry:removed', { id });
  }
}

module.exports = { LibraryCatalog };
