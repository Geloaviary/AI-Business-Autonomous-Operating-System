'use strict';

/**
 * knowledge.js
 * ---------------------------------------------------------------------------
 * QAD holds itself to the same constitutional standard it holds every
 * other department to. Its own certifications aren't the interesting
 * knowledge to preserve (that's already committed, per submission, by
 * whichever department produced it) — what's worth preserving is the
 * PATTERN across many certifications: what does QAD typically flag for a
 * given kind of department? That's genuinely reusable precedent Engineering
 * could consult before building the next one of that type — closing a
 * quality-feedback loop the platform didn't have before.
 * ---------------------------------------------------------------------------
 */

function transform({ departmentName, analytics }) {
  return {
    type: 'QualityPattern',
    subjectKey: `quality-pattern:${departmentName}`,
    departmentName,
    approvalRate: analytics.approvalRate(departmentName),
    commonViolationCategories: analytics.violationCategoryBreakdown(),
    producedAt: new Date().toISOString()
  };
}

module.exports = { transform };
