'use strict';

/**
 * validators.js
 * ---------------------------------------------------------------------------
 * Internal validation. Checks schemas, contracts, architecture, dependencies,
 * quality, and completeness. Only validated artifacts may proceed toward
 * submission to the Quality Assurance Director. This is Engineering's own
 * quality bar — QAD's certification is a separate, higher, organizational
 * authority and is never bypassed just because validators.js passed.
 * ---------------------------------------------------------------------------
 */

const { MANDATORY_FILES } = require('./constants');
const { ValidationError } = require('./errors');

function checkSchema(files) {
  const errors = [];
  for (const [filePath, content] of Object.entries(files)) {
    if (typeof content !== 'string') {
      errors.push(`File "${filePath}" content must be a string`);
    }
    if (content !== undefined && content.length === 0) {
      errors.push(`File "${filePath}" is empty`);
    }
  }
  return errors;
}

function checkContract(contract, plan) {
  const errors = [];
  if (!contract.isSatisfiedBy({ departmentName: plan.departmentName })) {
    errors.push('Generated plan does not satisfy the originating contract');
  }
  return errors;
}

function checkArchitecture(plan) {
  const errors = [];
  if (!plan.departmentName) errors.push('Architecture plan is missing a department name');
  if (!Array.isArray(plan.mandatoryFiles) || plan.mandatoryFiles.length === 0) {
    errors.push('Architecture plan is missing mandatory file list');
  }
  return errors;
}

function checkDependencies(files) {
  const errors = [];
  const missing = MANDATORY_FILES.filter(f => !(f in files));
  if (missing.length > 0) {
    errors.push(`Missing mandatory constitutional files: ${missing.join(', ')}`);
  }
  return errors;
}

function checkQuality(files) {
  const errors = [];
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.endsWith('.js') && /TODO|FIXME/.test(content)) {
      errors.push(`File "${filePath}" contains an unresolved TODO/FIXME`);
    }
  }
  return errors;
}

function checkCompleteness(plan, files) {
  const errors = [];
  if (plan.optionalDirectories.includes('ui') && !Object.keys(files).some(f => f.startsWith('ui/'))) {
    errors.push('Plan requires a UI directory but no ui/* files were generated');
  }
  return errors;
}

/**
 * Runs the full validation suite. Returns a structured report; never throws
 * for expected validation failures (throwing is reserved for programmer
 * errors, e.g. malformed input). Manager decides what to do with FAIL.
 */
function validateArtifactCandidate({ contract, plan, files }) {
  if (!contract || !plan || !files) {
    throw new ValidationError('validateArtifactCandidate requires contract, plan, and files');
  }

  const categorized = {
    schema: checkSchema(files),
    contract: checkContract(contract, plan),
    architecture: checkArchitecture(plan),
    dependencies: checkDependencies(files),
    quality: checkQuality(files),
    completeness: checkCompleteness(plan, files)
  };

  const issues = [];
  for (const [category, errors] of Object.entries(categorized)) {
    for (const message of errors) {
      issues.push({ category, message });
    }
  }

  // Surface missing mandatory files individually so repair.js can act file-by-file.
  const missing = MANDATORY_FILES.filter(f => !(f in files));
  for (const missingFile of missing) {
    issues.push({ category: 'dependencies', message: `Missing ${missingFile}`, missingFile });
  }

  return {
    passed: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  validateArtifactCandidate,
  checkSchema,
  checkContract,
  checkArchitecture,
  checkDependencies,
  checkQuality,
  checkCompleteness
};
