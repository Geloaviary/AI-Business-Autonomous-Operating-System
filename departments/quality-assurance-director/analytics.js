'use strict';

/**
 * analytics.js
 * ---------------------------------------------------------------------------
 * Derives insight from history.js: approval rates, per-department
 * reliability, common violation categories. The good idea from the
 * audited implementation's metrics/ subfolder (department/global/trend/
 * violation breakdowns) — done as working code instead of files that
 * throw ReferenceError on load.
 * ---------------------------------------------------------------------------
 */

class Analytics {
  constructor({ history, learning } = {}) {
    this.history = history;
    this.learning = learning;
  }

  approvalRate(departmentName) {
    const records = departmentName ? this.history.forDepartment(departmentName) : this.history.all();
    const decisions = records.filter((r) => r.kind === 'CERTIFICATION' || r.kind === 'REJECTION');
    if (decisions.length === 0) return null;
    const passed = decisions.filter((r) => r.kind === 'CERTIFICATION').length;
    return passed / decisions.length;
  }

  violationCategoryBreakdown() {
    const counts = {};
    for (const record of this.history.all()) {
      if (record.kind !== 'REJECTION') continue;
      for (const issue of record.payload.issues || []) {
        counts[issue.category] = (counts[issue.category] || 0) + 1;
      }
    }
    return counts;
  }

  departmentReliability() {
    const departments = new Set(this.history.all().map((r) => r.payload?.departmentName).filter(Boolean));
    const result = {};
    for (const dept of departments) {
      result[dept] = this.approvalRate(dept);
    }
    return result;
  }

  escalationRate() {
    const all = this.history.all();
    const decisions = all.filter((r) => r.kind === 'CERTIFICATION' || r.kind === 'REJECTION');
    const escalations = all.filter((r) => r.kind === 'ESCALATION');
    if (decisions.length === 0) return 0;
    return escalations.length / decisions.length;
  }
}

module.exports = { Analytics };
