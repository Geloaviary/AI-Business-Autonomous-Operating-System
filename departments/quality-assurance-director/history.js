'use strict';

/**
 * history.js
 * ---------------------------------------------------------------------------
 * Append-only audit trail of every certification decision QAD has ever
 * made — pass, fail, repair, escalation. This is the actual "audit
 * manager" concept done correctly: a plain, working, append-only log,
 * rather than the tangle of duplicate/undefined functions found auditing
 * the previous implementation's equivalent file.
 * ---------------------------------------------------------------------------
 */

class HistoryLog {
  constructor() {
    this._records = [];
  }

  record(kind, payload) {
    const entry = Object.freeze({
      id: `qad_history_${this._records.length + 1}`,
      kind, // 'CERTIFICATION' | 'REJECTION' | 'REPAIR_PLAN' | 'ESCALATION'
      payload,
      at: new Date().toISOString()
    });
    this._records.push(entry);
    return entry;
  }

  all() { return [...this._records]; }

  forDepartment(departmentName) {
    return this._records.filter((r) => r.payload?.departmentName === departmentName);
  }
}

module.exports = { HistoryLog };
