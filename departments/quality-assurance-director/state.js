'use strict';

/**
 * state.js
 * ---------------------------------------------------------------------------
 * Per-submission execution state. Temporary, discarded once a certification
 * decision is finalized — history.js is the durable record.
 * ---------------------------------------------------------------------------
 */

const { STATUS } = require('./constants');

class ExecutionState {
  constructor(contractId) {
    this.contractId = contractId;
    this.status = STATUS.RECEIVED;
    this.attempt = 0;
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

  incrementAttempt() {
    this.attempt += 1;
    return this.attempt;
  }

  snapshot() {
    return {
      contractId: this.contractId,
      status: this.status,
      attempt: this.attempt,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      timelineLength: this.timeline.length
    };
  }
}

module.exports = { ExecutionState };
