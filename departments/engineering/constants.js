'use strict';

/**
 * constants.js
 * ---------------------------------------------------------------------------
 * Shared, immutable constants for the Engineering Department.
 * No business logic lives here — only names, keys, and fixed values that the
 * rest of the department (and every future department cloned from this
 * reference implementation) must agree on.
 * ---------------------------------------------------------------------------
 */

const DEPARTMENT_NAME = 'engineering';
const DEPARTMENT_TITLE = 'Engineering Department';
const DEPARTMENT_VERSION = '0.1.0';

// Lifecycle statuses an artifact/request can be in.
const STATUS = Object.freeze({
  RECEIVED: 'RECEIVED',
  ANALYZING: 'ANALYZING',
  PLANNING: 'PLANNING',
  BUILDING: 'BUILDING',
  VALIDATING: 'VALIDATING',
  SUBMITTED_TO_QAD: 'SUBMITTED_TO_QAD',
  CERTIFIED: 'CERTIFIED',
  REJECTED: 'REJECTED',
  REPAIRING: 'REPAIRING',
  COMMITTED: 'COMMITTED',
  ACTIVE: 'ACTIVE',
  PACKAGED: 'PACKAGED',
  FAILED: 'FAILED'
});

// Roles within the AI Workforce (see agents/).
const ROLES = Object.freeze({
  CHIEF_ARCHITECT: 'ChiefArchitect',
  PROJECT_ARCHITECT: 'ProjectArchitect',
  SENIOR_SOFTWARE_ENGINEER: 'SeniorSoftwareEngineer',
  BACKEND_ENGINEER: 'BackendEngineer',
  FRONTEND_ENGINEER: 'FrontendEngineer',
  FULL_STACK_ENGINEER: 'FullStackEngineer',
  DATABASE_ENGINEER: 'DatabaseEngineer',
  SECURITY_ENGINEER: 'SecurityEngineer',
  QA_ENGINEER: 'QAEngineer',
  DOCUMENTATION_ENGINEER: 'DocumentationEngineer',
  DEPLOYMENT_ENGINEER: 'DeploymentEngineer',
  REPAIR_ENGINEER: 'RepairEngineer',
  CONSTITUTIONAL_ENGINEER: 'ConstitutionalEngineer',
  WORKFORCE_RESEARCH_ANALYST: 'WorkforceResearchAnalyst',
  WORKFORCE_ENGINEER: 'WorkforceEngineer'
});

// Mandatory files every constitutional department (including this one) must contain.
// NOTE: each department additionally requires a self-named health file
// (e.g. `research.js` for the Research department, `engineering.js` for
// this one) — that filename is department-specific, so it is computed by
// ProjectArchitect per-plan rather than hardcoded in this shared list.
const MANDATORY_FILES = Object.freeze([
  'README.md', 'index.js', 'manager.js', 'runtime.js', 'ui-builder.js',
  'contract.js', 'artifact.js', 'knowledge.js', 'views.js', 'output.js', 'input.js', 'validators.js',
  'repair.js', 'learning.js', 'memory.js', 'history.js', 'analytics.js',
  'metrics.js', 'state.js', 'service.js', 'registry.js', 'events.js',
  'config.js', 'constants.js', 'errors.js', 'package.json'
]);

/** The self-named health/monitoring file every department must also have. */
function selfHealthFile(departmentName) {
  return `${departmentName}.js`;
}

const OPTIONAL_DIRECTORIES = Object.freeze([
  'adapters', 'builders', 'processors', 'schemas', 'templates', 'prompts',
  'learning', 'tests', 'agents', 'ui'
]);

const KNOWLEDGE_SOURCE = Object.freeze({
  PLATFORM_MEMORY: 'PLATFORM_MEMORY',
  OPENAI: 'OPENAI'
});

const QAD_VERDICT = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL'
});

module.exports = {
  DEPARTMENT_NAME,
  DEPARTMENT_TITLE,
  DEPARTMENT_VERSION,
  STATUS,
  ROLES,
  MANDATORY_FILES,
  selfHealthFile,
  OPTIONAL_DIRECTORIES,
  KNOWLEDGE_SOURCE,
  QAD_VERDICT
};
