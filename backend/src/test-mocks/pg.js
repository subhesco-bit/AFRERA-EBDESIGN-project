let nextId = 1;

class MockClient {
  constructor(pool) { this.pool = pool; }
  async query(text, params) {
    const q = (text || '').toString().toUpperCase();
    if (q.includes('RETURNING ID')) {
      const id = nextId++;
      return { rows: [{ id }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  release() { /* noop */ }
}

class Pool {
  constructor() { this._ended = false; }
  async connect() { return new MockClient(this); }
  async query(text, params) {
    const q = (text || '').toString().toUpperCase();
    if (q.includes('RETURNING ID')) {
      const id = nextId++;
      return { rows: [{ id }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  async end() { this._ended = true; }
}

module.exports = { Pool };
