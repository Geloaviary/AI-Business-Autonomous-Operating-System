'use strict';

/**
 * knowledge.js
 * ---------------------------------------------------------------------------
 * Transforms a certified artifact into organizational knowledge — BEFORE
 * submission to the Quality Assurance Director, not after. This is the
 * direct fix for a real design flaw: Platform Memory used to receive a raw
 * artifact summary and QAD's manager.js had to guess at what was "worth
 * remembering" from it. That guessing is business logic, and Platform
 * Memory (and QAD, which is domain-agnostic by design — see
 * quality-assurance-director/validators.js) is the wrong place for it.
 * Only Engineering understands what's actually reusable about a department
 * it just built: not the source code itself, but the STAFFING PATTERN —
 * which roles a department like this one needs, and why.
 *
 * Engineering Artifact (a generated department)
 *   -> DepartmentStaffingPattern knowledge (this file's job)
 *   -> consumer-specific views (views.js's job)
 *   -> submitted to QAD as already-formed knowledge, which QAD certifies
 *      and Platform Memory stores opaquely, understanding none of it.
 *
 * This closes a real loop: WorkforceResearchAnalyst's Platform-Memory
 * precedent check (see agents/index.js) can only find well-structured
 * precedent because this file is what produces it in the first place.
 * ---------------------------------------------------------------------------
 */

function transform({ plan, artifact }) {
  const workforcePlan = plan.workforcePlan || { roles: [], source: 'UNKNOWN' };

  return {
    type: 'DepartmentStaffingPattern',
    subjectKey: `staffing-pattern:${plan.departmentName}`,
    departmentName: plan.departmentName,
    roles: workforcePlan.roles,
    workforceSource: workforcePlan.source,
    capabilities: plan.capabilities || [],
    artifactChecksum: artifact.checksum,
    producedAt: new Date().toISOString()
  };
}

module.exports = { transform };
