'use strict';

/**
 * metrics.js
 * ---------------------------------------------------------------------------
 * Engineering KPIs: build success rate, average generation time, QAD
 * approval rate, portability score, maintainability score. Thin layer on
 * top of analytics.js — metrics.js answers "what number do we show on the
 * dashboard right now," analytics.js answers "why."
 * ---------------------------------------------------------------------------
 */

const { MANDATORY_FILES } = require('./constants');

class Metrics {
  constructor({ analytics, history }) {
    this.analytics = analytics;
    this.history = history;
  }

  qadApprovalRate() {
    const all = this.history?.all() || [];
    const submissions = all.filter(r => r.kind === 'BUILD' && 'qadVerdict' in (r.payload || {}));
    if (submissions.length === 0) return null;
    const passed = submissions.filter(r => r.payload.qadVerdict === 'PASS').length;
    return passed / submissions.length;
  }

  /** Portability: fraction of mandatory files present relative to the constitutional set. */
  portabilityScore(fileMap) {
    if (!fileMap) return null;
    const present = MANDATORY_FILES.filter(f => f in fileMap).length;
    return present / MANDATORY_FILES.length;
  }

  /** Maintainability heuristic: penalize very large files and TODO markers. */
  maintainabilityScore(fileMap) {
    if (!fileMap) return null;
    const files = Object.values(fileMap);
    if (files.length === 0) return null;
    let penalty = 0;
    for (const content of files) {
      if (content.length > 20000) penalty += 1;
      if (/TODO|FIXME/.test(content)) penalty += 1;
    }
    return Math.max(0, 1 - penalty / (files.length * 2));
  }

  snapshot(fileMap) {
    return {
      buildSuccessRate: this.analytics?.buildSuccessRate() ?? null,
      averageGenerationTimeMs: this.analytics?.averageGenerationTimeMs() ?? null,
      qadApprovalRate: this.qadApprovalRate(),
      portabilityScore: this.portabilityScore(fileMap),
      maintainabilityScore: this.maintainabilityScore(fileMap),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { Metrics };
