'use strict';

/**
 * views.js
 * ---------------------------------------------------------------------------
 * Produces consumer-specific views of Engineering's own knowledge — computed
 * once, at commit time, by the department that actually understands the
 * knowledge's structure. This is what makes a department's exported ZIP
 * genuinely self-contained: Research doesn't need an external "translation
 * service" to explain its knowledge to Revenue — Research's own views.js
 * already knows how to speak Revenue's language, because Research built it.
 *
 * Engineering's knowledge (a DepartmentStaffingPattern) has exactly one
 * concrete consumer today — Engineering itself, consulting precedent the
 * next time it builds a similar department (see
 * agents/index.js's WorkforceResearchAnalyst). The `default` view exists
 * for any other consumer that doesn't need Engineering-specific depth — a
 * dashboard summary, for instance.
 * ---------------------------------------------------------------------------
 */

function buildViews(knowledge) {
  return {
    /** Full detail — what WorkforceResearchAnalyst actually needs to reuse a staffing pattern. */
    engineering: {
      departmentName: knowledge.departmentName,
      roles: knowledge.roles,
      workforceSource: knowledge.workforceSource
    },
    /** A summary suitable for any consumer that just wants to know what exists, not the full staffing detail. */
    default: {
      departmentName: knowledge.departmentName,
      roleCount: (knowledge.roles || []).reduce((sum, r) => sum + (r.count || 1), 0),
      summary: `${knowledge.departmentName} staffing pattern (${(knowledge.roles || []).length} roles)`
    }
  };
}

module.exports = { buildViews };
