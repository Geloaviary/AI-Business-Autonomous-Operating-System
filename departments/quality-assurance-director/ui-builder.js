'use strict';

/**
 * ui-builder.js
 * ---------------------------------------------------------------------------
 * Decides what QAD's own dashboard surface needs. QAD's "UI" is the
 * Quality Assurance Center in the Executive Interface — this module
 * produces the data shape that view needs, not markup.
 * ---------------------------------------------------------------------------
 */

class UIOrchestrator {
  buildDashboardData({ metrics, recentCertifications }) {
    return {
      title: 'Quality Assurance Director',
      metrics,
      recentCertifications
    };
  }
}

module.exports = { UIOrchestrator };
