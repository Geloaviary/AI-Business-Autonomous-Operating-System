'use strict';

/**
 * agents/index.js
 * ---------------------------------------------------------------------------
 * QAD's employees. Deliberately different in character from Engineering's
 * AI Workforce: Engineering's job is generative (build something new), so
 * its employees are creative agents. QAD's job is judicial (decide whether
 * something meets the standard), so its employees are deterministic rule
 * appliers first, and only consult Platform Memory / OpenAI for genuinely
 * ambiguous cases the rules don't resolve — matching the platform's own
 * knowledge strategy (certified memory first, provisional AI second).
 * This also means QAD keeps working correctly even with no AI/network
 * access at all, which matters for something this constitutionally load-
 * bearing: certification should never become unavailable because an
 * external API is down.
 * ---------------------------------------------------------------------------
 */

const { runConstitutionalChecks, runDepartmentChecks } = require('../validators');
const { ROLES } = require('../constants');

/** Sets overall certification policy — the standards every other role applies. */
class ChiefComplianceOfficer {
  constructor() { this.role = ROLES.CHIEF_COMPLIANCE_OFFICER; }
  principles() {
    return [
      'Every department is held to the same constitutional baseline, regardless of name',
      'Department-specific rules are opt-in, never assumed',
      'A rejection must always come with a reason and, where possible, a repair plan',
      'Repeated failure escalates to a human decision rather than looping forever'
    ];
  }
}

/** Runs the generic constitutional rule layer — works for any department, seen or unseen. */
class ConstitutionalAuditor {
  constructor() { this.role = ROLES.CONSTITUTIONAL_AUDITOR; }
  audit(submission, { mandatoryFiles } = {}) {
    return runConstitutionalChecks(submission, { mandatoryFiles });
  }
}

/** Runs a department's own registered rules, if any. Silent no-op otherwise. */
class DepartmentLiaison {
  constructor(registry) { this.role = ROLES.DEPARTMENT_LIAISON; this.registry = registry; }
  review(submission) {
    return runDepartmentChecks(submission, this.registry);
  }
}

/** Decides when repeated failure stops being a retry problem and becomes a human problem. */
class EscalationOfficer {
  constructor(config) { this.role = ROLES.ESCALATION_OFFICER; this.config = config; }
  shouldEscalate(attempt) {
    return attempt >= this.config.escalation.maxAttemptsBeforeEscalation;
  }
}

/** Keeps the permanent audit trail — every decision, pass or fail, forever. Thin wrapper over history.js. */
class QualityHistorian {
  constructor(history) { this.role = ROLES.QUALITY_HISTORIAN; this.history = history; }
  record(kind, payload) { return this.history.record(kind, payload); }
}

/**
 * Flags submissions likely to fail, based on learned patterns from past
 * rejections — informational only, never blocks a submission on its own.
 * Requires a minimum sample size (config.prediction.minSampleSize) before
 * making any claim, so it doesn't confidently predict from noise.
 */
class PredictionAnalyst {
  constructor(learning, config) {
    this.role = ROLES.PREDICTION_ANALYST;
    this.learning = learning;
    this.config = config;
  }

  assess(submission) {
    if (!this.config.prediction.enabled) return { available: false };

    const priorFailures = this.learning.all().filter(
      (entry) => entry.kind === 'REJECTION' && entry.payload.departmentName === submission.departmentName
    );

    if (priorFailures.length < this.config.prediction.minSampleSize) {
      return { available: false, reason: 'insufficient historical sample', sampleSize: priorFailures.length };
    }

    const categoryCounts = {};
    for (const failure of priorFailures) {
      for (const issue of failure.payload.issues || []) {
        categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
      }
    }
    const mostCommon = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      available: true,
      sampleSize: priorFailures.length,
      mostLikelyIssueCategory: mostCommon ? mostCommon[0] : null,
      confidence: mostCommon ? mostCommon[1] / priorFailures.length : 0
    };
  }
}

module.exports = {
  ChiefComplianceOfficer,
  ConstitutionalAuditor,
  DepartmentLiaison,
  EscalationOfficer,
  QualityHistorian,
  PredictionAnalyst
};
