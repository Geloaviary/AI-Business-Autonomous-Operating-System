'use strict';

/**
 * runtime.js
 * ---------------------------------------------------------------------------
 * Runtime lifecycle for QAD. The single public entry point other
 * departments' output.js modules actually call.
 * ---------------------------------------------------------------------------
 */

class Runtime {
  constructor({ manager }) {
    this.manager = manager;
    this.status = 'STOPPED';
  }

  async start() { this.status = 'RUNNING'; return this.status; }
  async stop() { this.status = 'STOPPED'; return this.status; }

  /** What every other department's output.js calls. */
  async certify(submission) {
    if (this.status !== 'RUNNING') await this.start();
    return this.manager.certify(submission);
  }
}

module.exports = { Runtime };
