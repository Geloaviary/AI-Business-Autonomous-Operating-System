'use strict';

/**
 * artifact.js
 * ---------------------------------------------------------------------------
 * An Artifact is the immutable unit of work Engineering produces. Once
 * created, an Artifact is never mutated — repair.js always produces a NEW
 * artifact (with a lineage pointer to its predecessor), never edits an
 * existing one. This immutability is constitutional: it's what lets QAD and
 * Platform Memory trust that certified history is tamper-proof.
 * ---------------------------------------------------------------------------
 */

const crypto = require('crypto');
const { ArtifactError } = require('./errors');
const { STATUS } = require('./constants');

class Artifact {
  /**
   * @param {Object} spec
   * @param {string} spec.contractId
   * @param {string} spec.departmentName - The department this artifact builds/represents.
   * @param {Object} spec.files - Map of relative filePath -> file content.
   * @param {Object} spec.architecture - Architecture plan that produced these files.
   * @param {string[]} spec.contributors - AI Workforce roles involved.
   * @param {string} [spec.parentArtifactId] - Set when this artifact is a repair of another.
   */
  constructor(spec) {
    if (!spec || !spec.departmentName || !spec.files) {
      throw new ArtifactError('Artifact requires departmentName and files', { spec });
    }

    this.id = `artifact_${crypto.randomUUID()}`;
    this.contractId = spec.contractId || null;
    this.departmentName = spec.departmentName;
    this.files = Object.freeze({ ...spec.files });
    this.architecture = Object.freeze(spec.architecture || {});
    this.contributors = Object.freeze([...(spec.contributors || [])]);
    this.parentArtifactId = spec.parentArtifactId || null;
    this.status = STATUS.BUILDING;
    this.createdAt = new Date().toISOString();
    this.checksum = this._computeChecksum();
    Object.freeze(this);
  }

  _computeChecksum() {
    const hash = crypto.createHash('sha256');
    const orderedKeys = Object.keys(this.files).sort();
    for (const key of orderedKeys) {
      hash.update(key);
      hash.update(this.files[key]);
    }
    return hash.digest('hex');
  }

  fileCount() {
    return Object.keys(this.files).length;
  }

  summary() {
    return {
      id: this.id,
      departmentName: this.departmentName,
      fileCount: this.fileCount(),
      contributors: this.contributors,
      parentArtifactId: this.parentArtifactId,
      checksum: this.checksum,
      createdAt: this.createdAt
    };
  }

  /**
   * Because Artifacts are frozen/immutable, "changing status" returns a new
   * lightweight status record rather than mutating the artifact itself.
   */
  withStatus(status) {
    return { artifactId: this.id, status, at: new Date().toISOString() };
  }
}

module.exports = { Artifact };
