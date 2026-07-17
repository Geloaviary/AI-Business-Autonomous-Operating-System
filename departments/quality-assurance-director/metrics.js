'use strict';

/**
 * metrics.js
 * ---------------------------------------------------------------------------
 * Dashboard-facing KPIs — thin layer over analytics.js, matching the
 * Quality Assurance Center page's needs directly.
 * ---------------------------------------------------------------------------
 */

class Metrics {
  constructor({ analytics, history } = {}) {
    this.analytics = analytics;
    this.history = history;
  }

  snapshot() {
    const all = this.history.all();
    const total = all.filter((r) => r.kind === 'CERTIFICATION' || r.kind === 'REJECTION').length;
    const passed = all.filter((r) => r.kind === 'CERTIFICATION').length;

    return {
      totalSubmissions: total,
      certified: passed,
      rejected: total - passed,
      approvalRate: this.analytics.approvalRate(),
      escalationRate: this.analytics.escalationRate(),
      violationCategoryBreakdown: this.analytics.violationCategoryBreakdown(),
      departmentReliability: this.analytics.departmentReliability(),
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { Metrics };
