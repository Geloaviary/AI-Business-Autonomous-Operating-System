'use strict';

/**
 * registry.js
 * ---------------------------------------------------------------------------
 * Dependency registry. Registers processors, builders, adapters, and AI
 * agent roles so that manager.js (and only manager.js) can orchestrate
 * them without every module reaching out and importing each other
 * directly — this is what keeps the department decoupled and portable.
 * ---------------------------------------------------------------------------
 */

const { RegistryError } = require('./errors');

class Registry {
  constructor() {
    this._entries = new Map(); // namespace -> Map(name -> instance/factory)
  }

  _namespace(ns) {
    if (!this._entries.has(ns)) this._entries.set(ns, new Map());
    return this._entries.get(ns);
  }

  register(namespace, name, value) {
    const bucket = this._namespace(namespace);
    if (bucket.has(name)) {
      throw new RegistryError(`"${name}" is already registered in namespace "${namespace}"`);
    }
    bucket.set(name, value);
    return this;
  }

  resolve(namespace, name) {
    const bucket = this._entries.get(namespace);
    if (!bucket || !bucket.has(name)) {
      throw new RegistryError(`No entry "${name}" registered in namespace "${namespace}"`);
    }
    return bucket.get(name);
  }

  has(namespace, name) {
    const bucket = this._entries.get(namespace);
    return !!bucket && bucket.has(name);
  }

  list(namespace) {
    const bucket = this._entries.get(namespace);
    return bucket ? Array.from(bucket.keys()) : [];
  }

  namespaces() {
    return Array.from(this._entries.keys());
  }
}

module.exports = { Registry };
