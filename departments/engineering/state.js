'use strict';

/**
 * state.js
 * ---------------------------------------------------------------------------
 * Internal execution state for a single run of the Engineering pipeline.
 * State is temporary and scoped to one contract's lifecycle — it is never
 * the source of truth (Platform Memory is), and it is discarded once the
 * run completes. history.js is the append-only, durable record; state.js
 * is just "where are we right now."
 * ---------------------------------------------------------------------------
 */

const { STATUS } = require('./constants');

class ExecutionState {
  constructor(contractId) {
    this.contractId = contractId;
    this.status = STATUS.RECEIVED;
    this.currentProcessor = null;
    this.currentBuilder = null;
    this.activeWorkers = new Set();
    this.flags = {
      repairing: false,
      degraded: false
    };
    this.repairAttempts = 0;
    this.startedAt = new Date().toISOString();
    this.updatedAt = this.startedAt;
    this.timeline = [];
  }

  transition(status, meta = {}) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
    this.timeline.push({ status, at: this.updatedAt, meta });
    return this;
  }

  setProcessor(name) {
    this.currentProcessor = name;
    return this;
  }

  setBuilder(name) {
    this.currentBuilder = name;
    return this;
  }

  startWorker(role) {
    this.activeWorkers.add(role);
    return this;
  }

  finishWorker(role) {
    this.activeWorkers.delete(role);
    return this;
  }

  incrementRepairAttempt() {
    this.repairAttempts += 1;
    this.flags.repairing = true;
    return this.repairAttempts;
  }

  snapshot() {
    return {
      contractId: this.contractId,
      status: this.status,
      currentProcessor: this.currentProcessor,
      currentBuilder: this.currentBuilder,
      activeWorkers: Array.from(this.activeWorkers),
      flags: { ...this.flags },
      repairAttempts: this.repairAttempts,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      timelineLength: this.timeline.length
    };
  }
}

module.exports = { ExecutionState };
