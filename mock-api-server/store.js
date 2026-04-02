// store.js — In-memory registry with file persistence
const { v4: uuidv4 } = require('uuid');
const persistence = require('./persistence');

class EndpointStore {
  constructor() {
    this.endpoints = new Map();
    this._loadFromDisk();
  }

  _loadFromDisk() {
    const saved = persistence.load();
    saved.forEach(ep => this.endpoints.set(ep.id, ep));
    if (saved.length) console.log(`[Store] Loaded ${saved.length} endpoint(s) from disk`);
  }

  _persist() {
    persistence.save(this.endpoints);
  }

  add({ method, path, statusCode = 200, body = {}, delay = 0, description = '' }) {
    const id = uuidv4();
    const endpoint = {
      id,
      key: `${method.toUpperCase()} ${path.startsWith('/') ? path : '/' + path}`,
      method: method.toUpperCase(),
      path: path.startsWith('/') ? path : '/' + path,
      statusCode: parseInt(statusCode),
      body,
      delay: parseInt(delay),
      description,
      createdAt: new Date().toISOString(),
      hitCount: 0,
    };
    this.endpoints.set(id, endpoint);
    this._persist();
    return endpoint;
  }

  findByKey(method, path) {
    const key = `${method.toUpperCase()} ${path}`;
    for (const ep of this.endpoints.values()) {
      if (ep.key === key) return ep;
    }
    return null;
  }

  getAll()    { return Array.from(this.endpoints.values()); }
  getById(id) { return this.endpoints.get(id) || null; }

  update(id, updates) {
    const ep = this.endpoints.get(id);
    if (!ep) return null;
    ['statusCode','body','delay','description'].forEach(k => {
      if (updates[k] !== undefined) ep[k] = updates[k];
    });
    if (updates.method || updates.path) {
      ep.method = (updates.method || ep.method).toUpperCase();
      ep.path   = updates.path || ep.path;
      ep.key    = `${ep.method} ${ep.path}`;
    }
    this._persist();
    return ep;
  }

  delete(id) {
    const result = this.endpoints.delete(id);
    if (result) this._persist();
    return result;
  }

  incrementHit(id) {
    const ep = this.endpoints.get(id);
    if (ep) { ep.hitCount++; this._persist(); }
  }

  clear() { this.endpoints.clear(); this._persist(); }

  bulkImport(endpointDefs, mode = 'merge') {
    if (mode === 'replace') this.endpoints.clear();
    const added = [], skipped = [];
    endpointDefs.forEach(def => {
      const exists = this.findByKey(def.method, def.path);
      if (exists && mode === 'merge') skipped.push(`${def.method} ${def.path}`);
      else added.push(this.add(def));
    });
    return { added, skipped };
  }
}

module.exports = new EndpointStore();
