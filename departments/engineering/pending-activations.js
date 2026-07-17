'use strict';

/**
 * pending-activations.js
 * ---------------------------------------------------------------------------
 * Holds certified, Platform-Memory-committed artifacts that are awaiting
 * the executive's explicit activation decision. This is a deliberate
 * constitutional checkpoint: Quality Assurance certifies TRUTH (the
 * artifact is correct and safe to trust), but ACTIVATION (making it live,
 * part of the company, distributable) is a business decision that belongs
 * to the executive, not to an automated pipeline. Separating "certified"
 * from "activated" is what makes that decision meaningful rather than
 * rubber-stamped after the fact.
 *
 * Default implementation is in-memory, scoped to one process — sufficient
 * for local development and the standalone test suite. A real multi-request
 * deployment (e.g. the dashboard running on Vercel, where the "create" and
 * "activate" clicks may hit different serverless instances) should inject
 * a persistent implementation instead — see
 * adapters/pending-activations-redis.js for the Vercel-ready equivalent,
 * which implements this exact same interface.
 * ---------------------------------------------------------------------------
 */

class InMemoryPendingActivations {
  constructor() {
    this._records = new Map();
  }

  async add(record) {
    this._records.set(record.artifactId, record);
    return record;
  }

  async get(artifactId) {
    return this._records.get(artifactId) || null;
  }

  async remove(artifactId) {
    this._records.delete(artifactId);
  }

  async list() {
    return Array.from(this._records.values());
  }
}

module.exports = { InMemoryPendingActivations };
