'use strict';

/**
 * contract.js
 * ---------------------------------------------------------------------------
 * QAD's Contract wraps an incoming certification request. Where
 * Engineering's Contract represents "build this," QAD's Contract
 * represents "judge this" — the submission a department is asking QAD to
 * certify, plus enough context to track it through audit, department
 * review, decision, and (if needed) repair and escalation.
 * ---------------------------------------------------------------------------
 */

const crypto = require('crypto');
const { ContractError } = require('./errors');

class Contract {
  /**
   * @param {Object} spec
   * @param {string} spec.departmentName - Which department submitted this.
   * @param {string} [spec.artifactId] - The submitting department's own artifact ID, if any.
   * @param {Object} spec.submission - The actual submission payload to certify
   *   (Engineering's is a file map; a generic department's is a payload —
   *   QAD's contract doesn't care which, that's validators.js's job).
   */
  constructor(spec) {
    if (!spec || !spec.departmentName || spec.submission === undefined) {
      throw new ContractError('Contract requires departmentName and submission', { spec });
    }
    this.id = `qad_contract_${crypto.randomUUID()}`;
    this.departmentName = spec.departmentName;
    this.artifactId = spec.artifactId || null;
    this.submission = spec.submission;
    this.createdAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      departmentName: this.departmentName,
      artifactId: this.artifactId,
      createdAt: this.createdAt
    };
  }
}

module.exports = { Contract };
