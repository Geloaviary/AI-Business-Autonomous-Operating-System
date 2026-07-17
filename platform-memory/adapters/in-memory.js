'use strict';

/**
 * adapters/in-memory.js
 * ---------------------------------------------------------------------------
 * Default Platform Memory storage: scoped to one process, gone on restart.
 * Fine for local development and the standalone test suite; a real
 * deployment injects adapters/redis.js instead. Both implement the exact
 * same interface (ledgerGet/ledgerSet/knowledgePush/knowledgeAll), which is
 * the entire point — storage.js and index.js never know which is in use.
 * ---------------------------------------------------------------------------
 */

class InMemoryStorage {
  constructor() {
    this._ledger = new Map();
    this._knowledge = [];
    this._relationships = []; // { certificateIdA, certificateIdB, relationshipType }
  }

  async ledgerSet(certificateId, record) {
    this._ledger.set(certificateId, record);
  }

  async ledgerGet(certificateId) {
    return this._ledger.get(certificateId) || null;
  }

  async knowledgePush(entry) {
    this._knowledge.unshift(entry);
  }

  async knowledgeAll() {
    return [...this._knowledge];
  }

  async relationshipAdd(certificateIdA, certificateIdB, relationshipType) {
    this._relationships.push({ certificateIdA, certificateIdB, relationshipType });
  }

  /** Every relationship edge touching this certificate, from either side. */
  async relationshipsFor(certificateId) {
    const edges = [];
    for (const r of this._relationships) {
      if (r.certificateIdA === certificateId) edges.push({ otherCertificateId: r.certificateIdB, relationshipType: r.relationshipType });
      else if (r.certificateIdB === certificateId) edges.push({ otherCertificateId: r.certificateIdA, relationshipType: r.relationshipType });
    }
    return edges;
  }
}

module.exports = { InMemoryStorage };
