'use strict';

/**
 * input.js
 * ---------------------------------------------------------------------------
 * Confirms a commit actually landed in Platform Memory before QAD
 * considers a submission COMMITTED. Same defensive pattern Engineering
 * uses for its own input.js: certifying and committing are two different
 * moments, and a crash between them shouldn't be silently treated as success.
 * ---------------------------------------------------------------------------
 */

class QADInput {
  /** @param {ReturnType<import('../../platform-memory').createPlatformMemory>} platformMemory */
  constructor(platformMemory) {
    this.platformMemory = platformMemory;
  }

  async confirmCommit(certificateId) {
    return this.platformMemory.confirmCommit(certificateId);
  }
}

module.exports = { QADInput };
