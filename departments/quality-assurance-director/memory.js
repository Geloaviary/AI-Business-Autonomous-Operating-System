'use strict';

/**
 * memory.js
 * ---------------------------------------------------------------------------
 * QAD's READ interface to Platform Memory — used for precedent (has a
 * similar submission been certified before?) and consistency (are we
 * applying the same standard we applied last time?). QAD is the only
 * department allowed to WRITE to Platform Memory (see output.js), but for
 * reading, it's a client like any other department.
 * ---------------------------------------------------------------------------
 */

const { MemoryAccessError } = require('./errors');

class QADMemory {
  /** @param {ReturnType<import('../../platform-memory').createPlatformMemory>} platformMemory */
  constructor(platformMemory) {
    this.platformMemory = platformMemory;
  }

  async findPriorCertifications(departmentName) {
    if (!departmentName) throw new MemoryAccessError('findPriorCertifications requires a departmentName');
    return this.platformMemory.query({ departmentName });
  }

  async organizationalGrowth() {
    return this.platformMemory.growth();
  }
}

module.exports = { QADMemory };
