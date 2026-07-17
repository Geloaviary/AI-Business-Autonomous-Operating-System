'use strict';

/**
 * runtime.js
 * ---------------------------------------------------------------------------
 * Runtime lifecycle for the Engineering Department: start/stop, tracks
 * in-flight executions, and provides the execution queue that manager.js
 * pulls work from. This is the "is the department alive and doing work"
 * layer, distinct from manager.js which is "how does one request actually
 * get processed."
 * ---------------------------------------------------------------------------
 */

const { STATUS } = require('./constants');

class EngineeringRuntime {
  constructor({ manager, events }) {
    this.manager = manager;
    this.events = events;
    this.status = 'STOPPED';
    this._active = new Map(); // contractId -> state snapshot
    this._degraded = false;
  }

  async start() {
    this.status = 'RUNNING';
    return this.status;
  }

  async stop() {
    this.status = 'STOPPED';
    return this.status;
  }

  activeExecutionCount() {
    return this._active.size;
  }

  clearDegradedFlag() {
    this._degraded = false;
  }

  /**
   * Submit a business request to the department. This is the single public
   * entry point external callers (e.g. the Executive Dashboard) use.
   */
  async submitRequest(requestSpec) {
    if (this.status !== 'RUNNING') {
      await this.start();
    }
    const { contract, execution } = await this.manager.intake(requestSpec);
    this._active.set(contract.id, execution.state.snapshot());

    try {
      const result = await this.manager.execute(contract, execution);
      return result;
    } finally {
      this._active.delete(contract.id);
    }
  }

  snapshot() {
    return {
      status: this.status,
      activeExecutions: Array.from(this._active.values()),
      degraded: this._degraded
    };
  }
}

module.exports = { EngineeringRuntime };
