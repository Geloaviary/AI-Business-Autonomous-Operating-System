'use strict';

/**
 * learning.js
 * ---------------------------------------------------------------------------
 * QAD's own provisional learning log — feeds PredictionAnalyst. Like
 * every department's learning.js, this is local and provisional; nothing
 * here becomes organizational truth on its own (that would be circular for
 * QAD specifically, since QAD IS the thing that certifies truth — its own
 * learning stays QAD-internal, used only to get better at judging, never
 * auto-promoted to Platform Memory).
 * ---------------------------------------------------------------------------
 */

class LearningEngine {
  constructor({ events } = {}) {
    this.events = events;
    this._entries = [];
  }

  recordCertification({ departmentName, certificateId }) {
    return this._record('CERTIFICATION', { departmentName, certificateId });
  }

  recordRejection({ departmentName, issues }) {
    return this._record('REJECTION', { departmentName, issues });
  }

  recordEscalation({ departmentName, attempt }) {
    return this._record('ESCALATION', { departmentName, attempt });
  }

  _record(kind, payload) {
    const entry = { id: `qad_learning_${this._entries.length + 1}`, kind, payload, recordedAt: new Date().toISOString() };
    this._entries.push(entry);
    this.events?.publish('LearningRecorded', entry);
    return entry;
  }

  all() { return [...this._entries]; }

  summarizePatterns() {
    const rejectionsByDepartment = {};
    for (const entry of this._entries) {
      if (entry.kind === 'REJECTION') {
        rejectionsByDepartment[entry.payload.departmentName] = (rejectionsByDepartment[entry.payload.departmentName] || 0) + 1;
      }
    }
    return { rejectionsByDepartment, totalEntries: this._entries.length };
  }
}

module.exports = { LearningEngine };
