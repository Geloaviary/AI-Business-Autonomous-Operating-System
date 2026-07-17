'use strict';

/**
 * learning.js
 * ---------------------------------------------------------------------------
 * Captures engineering knowledge: architecture lessons, successful prompts,
 * repair lessons, optimization history. This knowledge is REUSABLE but is
 * NOT automatically organizational truth — per platform constitution,
 * learning only becomes certified Platform Memory knowledge after passing
 * through the Quality Assurance Director. Until then it lives here as
 * Engineering's own local, provisional learning log.
 * ---------------------------------------------------------------------------
 */

class LearningEngine {
  constructor({ events } = {}) {
    this.events = events;
    this._entries = [];
  }

  recordSuccess({ contractId, artifactId, plan, durationMs }) {
    return this._record('SUCCESS', {
      contractId, artifactId,
      departmentName: plan?.departmentName,
      durationMs
    });
  }

  recordFailure({ contractId, error }) {
    return this._record('FAILURE', {
      contractId,
      errorName: error?.name,
      errorMessage: error?.message
    });
  }

  recordRepairLesson({ artifactId, actions }) {
    return this._record('REPAIR_LESSON', { artifactId, actions });
  }

  recordOptimization({ suggestion, context }) {
    return this._record('OPTIMIZATION', { suggestion, context });
  }

  recordPromptImprovement({ role, before, after, reason }) {
    return this._record('PROMPT_IMPROVEMENT', { role, before, after, reason });
  }

  _record(kind, payload) {
    const entry = {
      id: `learning_${this._entries.length + 1}`,
      kind,
      payload,
      certified: false,
      recordedAt: new Date().toISOString()
    };
    this._entries.push(entry);
    this.events?.publish('LearningRecorded', entry);
    return entry;
  }

  /** Provisional entries ready to be proposed to QAD for certification. */
  uncertified() {
    return this._entries.filter(e => !e.certified);
  }

  markCertified(entryId) {
    const entry = this._entries.find(e => e.id === entryId);
    if (entry) entry.certified = true;
    return entry;
  }

  all() {
    return [...this._entries];
  }

  /** Simple pattern surfacing: repeated failure error names, common repair actions. */
  summarizePatterns() {
    const failureCounts = {};
    for (const e of this._entries) {
      if (e.kind === 'FAILURE') {
        failureCounts[e.payload.errorName] = (failureCounts[e.payload.errorName] || 0) + 1;
      }
    }
    return { recurringFailures: failureCounts, totalEntries: this._entries.length };
  }
}

module.exports = { LearningEngine };
