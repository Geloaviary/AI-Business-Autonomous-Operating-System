'use strict';

/**
 * history.js
 * ---------------------------------------------------------------------------
 * Engineering execution history. Records builds, generations, upgrades,
 * repairs. History is append-only — entries are never edited or removed,
 * only ever added to, so it can serve as a trustworthy audit trail.
 * ---------------------------------------------------------------------------
 */

class HistoryLog {
  constructor() {
    this._records = [];
  }

  record(kind, payload) {
    const entry = Object.freeze({
      id: `history_${this._records.length + 1}`,
      kind, // 'BUILD' | 'GENERATION' | 'UPGRADE' | 'REPAIR'
      payload,
      at: new Date().toISOString()
    });
    this._records.push(entry);
    return entry;
  }

  recordBuild(details) { return this.record('BUILD', details); }
  recordGeneration(details) { return this.record('GENERATION', details); }
  recordUpgrade(details) { return this.record('UPGRADE', details); }
  recordRepair(details) { return this.record('REPAIR', details); }

  all() {
    return [...this._records];
  }

  forContract(contractId) {
    return this._records.filter(r => r.payload && r.payload.contractId === contractId);
  }

  since(isoTimestamp) {
    return this._records.filter(r => r.at >= isoTimestamp);
  }
}

module.exports = { HistoryLog };
