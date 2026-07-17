'use strict';

/**
 * contract.js
 * ---------------------------------------------------------------------------
 * A Contract is the formal, structural agreement between a Human Business
 * Request and what Engineering promises to deliver. It is created at intake
 * and referenced through the entire lifecycle so that validators.js and the
 * Quality Assurance Director can verify the final artifact actually
 * satisfies what was promised.
 * ---------------------------------------------------------------------------
 */

const crypto = require('crypto');
const { ContractError } = require('./errors');

const REQUIRED_FIELDS = ['businessObjective', 'requestedBy'];

class Contract {
  /**
   * @param {Object} spec
   * @param {string} spec.businessObjective - Plain-language business request,
   *   e.g. "Create a Procurement Department."
   * @param {string} spec.requestedBy - Human executive or system actor.
   * @param {string[]} [spec.capabilities] - Desired capabilities/features.
   * @param {Object}   [spec.constraints] - Non-functional constraints (budget, timeline, compliance).
   * @param {string}   [spec.targetDepartmentName] - Explicit department name if known.
   */
  constructor(spec) {
    for (const field of REQUIRED_FIELDS) {
      if (!spec || !spec[field]) {
        throw new ContractError(`Contract is missing required field: ${field}`, { spec });
      }
    }

    this.id = `contract_${crypto.randomUUID()}`;
    this.businessObjective = spec.businessObjective;
    this.requestedBy = spec.requestedBy;
    this.capabilities = spec.capabilities || [];
    this.constraints = spec.constraints || {};
    this.targetDepartmentName = spec.targetDepartmentName || null;
    this.createdAt = new Date().toISOString();
    this.acceptanceCriteria = this._deriveAcceptanceCriteria(spec);
    Object.freeze(this.capabilities);
    Object.freeze(this.constraints);
  }

  _deriveAcceptanceCriteria(spec) {
    // Baseline constitutional acceptance criteria every department must meet,
    // plus anything explicitly requested.
    const baseline = [
      'Implements the mandatory constitutional file structure',
      'Never writes directly to Platform Memory',
      'Submits only immutable artifacts to the Quality Assurance Director',
      'Passes internal validation before submission to QAD'
    ];
    return [...baseline, ...(spec.acceptanceCriteria || [])];
  }

  /**
   * Verify a proposed artifact summary structurally satisfies this contract.
   * Deep quality judgment is QAD's job — this is a structural sanity check.
   */
  isSatisfiedBy(artifactSummary) {
    if (!artifactSummary) return false;
    if (this.targetDepartmentName &&
        artifactSummary.departmentName !== this.targetDepartmentName) {
      return false;
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      businessObjective: this.businessObjective,
      requestedBy: this.requestedBy,
      capabilities: this.capabilities,
      constraints: this.constraints,
      targetDepartmentName: this.targetDepartmentName,
      acceptanceCriteria: this.acceptanceCriteria,
      createdAt: this.createdAt
    };
  }
}

module.exports = { Contract };
