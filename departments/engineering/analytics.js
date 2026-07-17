'use strict';

/**
 * analytics.js
 * ---------------------------------------------------------------------------
 * Engineering performance analytics. Measures generation time, quality,
 * build success, repair frequency, and AI utilization by reading from
 * history.js (durable record) and events.js (live stream). Analytics never
 * writes to Platform Memory directly — meaningful findings are proposed as
 * learning.js entries for eventual QAD certification.
 * ---------------------------------------------------------------------------
 */

class Analytics {
  constructor({ history, learning, openaiAdapter } = {}) {
    this.history = history;
    this.learning = learning;
    this.openaiAdapter = openaiAdapter;
  }

  buildSuccessRate() {
    const builds = this.history?.all().filter(r => r.kind === 'BUILD') || [];
    if (builds.length === 0) return null;
    const successes = builds.filter(r => r.payload.outcome === 'SUCCESS').length;
    return successes / builds.length;
  }

  averageGenerationTimeMs() {
    const builds = this.history?.all().filter(r => r.kind === 'BUILD' && typeof r.payload.durationMs === 'number') || [];
    if (builds.length === 0) return null;
    const total = builds.reduce((sum, r) => sum + r.payload.durationMs, 0);
    return total / builds.length;
  }

  repairFrequency() {
    const all = this.history?.all() || [];
    const builds = all.filter(r => r.kind === 'BUILD').length;
    const repairs = all.filter(r => r.kind === 'REPAIR').length;
    if (builds === 0) return 0;
    return repairs / builds;
  }

  aiUtilization() {
    return this.openaiAdapter ? this.openaiAdapter.stats() : { callCount: 0 };
  }

  qualitySnapshot() {
    return {
      buildSuccessRate: this.buildSuccessRate(),
      averageGenerationTimeMs: this.averageGenerationTimeMs(),
      repairFrequency: this.repairFrequency(),
      learningPatterns: this.learning ? this.learning.summarizePatterns() : null,
      aiUtilization: this.aiUtilization(),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { Analytics };
