'use strict';

/**
 * constants.js
 * ---------------------------------------------------------------------------
 * QAD is a standalone department of BAOS — a peer to Engineering, not a
 * folder inside it. Its job is fundamentally different from Engineering's:
 * Engineering BUILDS things, QAD JUDGES things. That difference shapes
 * every file in this department.
 * ---------------------------------------------------------------------------
 */

const DEPARTMENT_NAME = 'quality-assurance-director';
const DEPARTMENT_VERSION = '0.1.0';

const STATUS = Object.freeze({
  RECEIVED: 'RECEIVED',
  AUDITING: 'AUDITING',
  DEPARTMENT_REVIEW: 'DEPARTMENT_REVIEW',
  DECIDING: 'DECIDING',
  CERTIFIED: 'CERTIFIED',
  REJECTED: 'REJECTED',
  ESCALATED: 'ESCALATED',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED'
});

const VERDICT = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL'
});

const ROLES = Object.freeze({
  CHIEF_COMPLIANCE_OFFICER: 'ChiefComplianceOfficer',
  CONSTITUTIONAL_AUDITOR: 'ConstitutionalAuditor',
  DEPARTMENT_LIAISON: 'DepartmentLiaison',
  REPAIR_COORDINATOR: 'RepairCoordinator',
  ESCALATION_OFFICER: 'EscalationOfficer',
  QUALITY_HISTORIAN: 'QualityHistorian',
  PREDICTION_ANALYST: 'PredictionAnalyst'
});

// Same mandatory constitutional file set every BAOS department implements —
// QAD is a department too, and holds itself to the same standard it holds
// every other department to.
const MANDATORY_FILES = Object.freeze([
  'README.md', 'index.js', 'manager.js', 'runtime.js', 'ui-builder.js',
  'contract.js', 'artifact.js', 'knowledge.js', 'views.js', 'output.js', 'input.js', 'validators.js',
  'repair.js', 'learning.js', 'memory.js', 'history.js', 'analytics.js',
  'metrics.js', 'state.js', 'service.js', 'registry.js', 'events.js',
  'config.js', 'constants.js', 'errors.js', 'package.json'
]);

function selfHealthFile() {
  return `${DEPARTMENT_NAME}.js`;
}

module.exports = {
  DEPARTMENT_NAME,
  DEPARTMENT_VERSION,
  STATUS,
  VERDICT,
  ROLES,
  MANDATORY_FILES,
  selfHealthFile
};
