'use strict';

/**
 * artifact.js
 * ---------------------------------------------------------------------------
 * QAD's own immutable output: a CertificationRecord. Where Engineering's
 * Artifact is a generated department, QAD's Artifact is its judgment on
 * someone else's submission — the verdict, the rules that were checked,
 * and (on PASS) what gets committed to Platform Memory. Frozen on
 * construction for the same reason Engineering's artifacts are: a
 * certification decision must be tamper-proof after the fact, or the
 * whole audit trail is worthless.
 * ---------------------------------------------------------------------------
 */

const crypto = require('crypto');
const { ArtifactError } = require('./errors');
const { VERDICT } = require('./constants');

class CertificationRecord {
  /**
   * @param {Object} spec
   * @param {string} spec.contractId
   * @param {string} spec.departmentName
   * @param {string} spec.verdict - VERDICT.PASS or VERDICT.FAIL
   * @param {Array}  [spec.issues] - Issues found, if FAIL.
   * @param {Object} [spec.checkedRules] - Which rule sets ran (constitutional + department-specific).
   * @param {Object} [spec.knowledgeExtract] - Distilled substance of the certified
   *   submission (e.g. a generated department's specialist contributions) —
   *   this is what gets committed to Platform Memory as queryable content,
   *   not just a one-line summary label. Without this, a future specialist
   *   could never cite this certification as real precedent.
   */
  constructor(spec) {
    if (!spec || !spec.contractId || !spec.departmentName || !spec.verdict) {
      throw new ArtifactError('CertificationRecord requires contractId, departmentName, and verdict', { spec });
    }
    if (spec.verdict !== VERDICT.PASS && spec.verdict !== VERDICT.FAIL) {
      throw new ArtifactError(`Invalid verdict: ${spec.verdict}`);
    }

    this.id = `certification_${crypto.randomUUID()}`;
    this.contractId = spec.contractId;
    this.departmentName = spec.departmentName;
    this.verdict = spec.verdict;
    this.issues = Object.freeze([...(spec.issues || [])]);
    this.checkedRules = Object.freeze({ ...(spec.checkedRules || {}) });
    this.checksum = spec.checksum || null;
    this.knowledgeExtract = spec.knowledgeExtract ? Object.freeze({ ...spec.knowledgeExtract }) : null;
    this.createdAt = new Date().toISOString();
    Object.freeze(this);
  }

  summary() {
    return {
      id: this.id,
      contractId: this.contractId,
      departmentName: this.departmentName,
      verdict: this.verdict,
      issueCount: this.issues.length,
      createdAt: this.createdAt
    };
  }
}

module.exports = { CertificationRecord };
