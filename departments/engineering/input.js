'use strict';

/**
 * input.js
 * ---------------------------------------------------------------------------
 * input.js is the ONLY path through which Engineering receives confirmation
 * that an artifact has been committed to Certified Platform Memory and is
 * cleared for department activation. It does not write to Platform Memory
 * (only QAD does that) — it listens for / polls the commit confirmation and
 * hands activation authority back to the manager.
 * ---------------------------------------------------------------------------
 */

const { MemoryAccessError } = require('./errors');

class EngineeringInput {
  /**
   * @param {Object} deps
   * @param {Object} deps.platformMemoryClient - Must expose an async
   *   `confirmCommit(certificateId)` returning { committed: boolean, committedAt? }.
   * @param {import('./events').DepartmentEventBus} deps.events
   */
  constructor({ platformMemoryClient, events }) {
    this.platformMemoryClient = platformMemoryClient;
    this.events = events;
  }

  async awaitCommitConfirmation(certificateId) {
    if (!this.platformMemoryClient) {
      throw new MemoryAccessError('EngineeringInput requires a platformMemoryClient');
    }
    const result = await this.platformMemoryClient.confirmCommit(certificateId);
    if (result.committed) {
      this.events?.publish('MemoryCommitted', { certificateId, committedAt: result.committedAt });
    }
    return result;
  }
}

module.exports = { EngineeringInput };
