'use strict';

/**
 * registry.js
 * ---------------------------------------------------------------------------
 * Dependency registry, with one job that matters constitutionally: letting
 * departments register their OWN validation rules without QAD ever needing
 * to hardcode department names. This is the direct fix for the biggest
 * architectural flaw found auditing the previous QAD implementation — it
 * only knew how to validate 6 hardcoded departments from a different
 * platform. This registry means QAD works generically for any department
 * out of the box, and a department can OPT IN to extra domain-specific
 * checks by registering into the 'department-rules' namespace — QAD never
 * needs to know that department's name in advance.
 * ---------------------------------------------------------------------------
 */

const { RegistryError } = require('./errors');

class Registry {
  constructor() {
    this._entries = new Map();
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

  /** Convenience for the common case: does this department have custom rules registered? */
  hasDepartmentRules(departmentName) {
    return this.has('department-rules', departmentName);
  }

  registerDepartmentRules(departmentName, ruleFn) {
    return this.register('department-rules', departmentName, ruleFn);
  }

  resolveDepartmentRules(departmentName) {
    return this.resolve('department-rules', departmentName);
  }
}

module.exports = { Registry };
