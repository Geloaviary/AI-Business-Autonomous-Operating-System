'use strict';

/**
 * memory.js
 * ---------------------------------------------------------------------------
 * Engineering's READ interface to Platform Memory — the standalone,
 * shared organizational service (see platform-memory/), not something
 * Engineering owns or stubs internally anymore. This module is a thin,
 * Engineering-flavored wrapper around the real client injected into it.
 *
 * Constitutional rule: this file may only READ certified knowledge.
 * Writing certified knowledge is exclusively the Quality Assurance
 * Director's job, via its own output.js — Engineering never has write
 * access to Platform Memory at all, enforced by Platform Memory's own
 * commit-authority token, not just by this file's discipline.
 * ---------------------------------------------------------------------------
 */

const { MemoryAccessError } = require('./errors');

class EngineeringMemory {
  /** @param {ReturnType<import('../../platform-memory').createPlatformMemory>} platformMemory */
  constructor(platformMemory) {
    if (!platformMemory) {
      throw new MemoryAccessError('EngineeringMemory requires a platformMemory instance');
    }
    this.platformMemory = platformMemory;
  }

  async findRelevantKnowledge(topic) {
    if (!topic) throw new MemoryAccessError('findRelevantKnowledge requires a topic');
    try {
      return await this.platformMemory.query({ departmentName: 'engineering', topic });
    } catch (err) {
      throw new MemoryAccessError('Failed to query Platform Memory', { cause: err.message });
    }
  }

  /**
   * Precise lookup for a department's staffing pattern, using Platform
   * Memory's Version pillar rather than fuzzy topic search — this is what
   * WorkforceResearchAnalyst actually calls. Returns the latest certified
   * version, or null if this exact department name has never been staffed
   * before (the archetype library and OpenAI are the fallbacks for that).
   */
  async findStaffingPattern(departmentName) {
    if (!departmentName) throw new MemoryAccessError('findStaffingPattern requires a departmentName');
    try {
      const latest = await this.platformMemory.latestVersion(`staffing-pattern:${departmentName}`);
      return latest?.content?.knowledge || null;
    } catch (err) {
      throw new MemoryAccessError('Failed to query Platform Memory', { cause: err.message });
    }
  }

  async findArchitecturePatterns() {
    return this.platformMemory.query({ category: this.platformMemory.categories.ARCHITECTURE_PATTERN });
  }

  async findLessonsLearned() {
    return this.platformMemory.query({ category: this.platformMemory.categories.LESSON_LEARNED });
  }
}

module.exports = { EngineeringMemory };
