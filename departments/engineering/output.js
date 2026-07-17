'use strict';

/**
 * output.js
 * ---------------------------------------------------------------------------
 * output.js is the ONLY submission path to the Quality Assurance Director.
 * No other module in this department may call QAD directly. This keeps
 * certification a single, auditable choke point.
 * ---------------------------------------------------------------------------
 */

const { QADCertificationError } = require('./errors');

class EngineeringOutput {
  /**
   * @param {Object} deps
   * @param {Object} deps.qadClient - Must expose an async `certify(submission)`
   *   returning { verdict: 'PASS'|'FAIL', issues?, certificateId? }.
   * @param {import('./events').DepartmentEventBus} deps.events
   */
  constructor({ qadClient, events }) {
    if (!qadClient) throw new QADCertificationError('EngineeringOutput requires a qadClient');
    this.qadClient = qadClient;
    this.events = events;
  }

  async submit(artifact, contract, { knowledge, views } = {}) {
    const submission = {
      artifactId: artifact.id,
      departmentName: artifact.departmentName,
      contractId: contract.id,
      files: artifact.files,
      checksum: artifact.checksum,
      knowledge,
      views,
      submittedAt: new Date().toISOString()
    };

    this.events?.publish('ArtifactSubmitted', { artifactId: artifact.id });

    const verdict = await this.qadClient.certify(submission);

    if (verdict.verdict === 'PASS') {
      this.events?.publish('QADCertified', { artifactId: artifact.id, certificateId: verdict.certificateId });
    } else {
      this.events?.publish('QADRejected', { artifactId: artifact.id, issues: verdict.issues });
    }

    return verdict;
  }
}

module.exports = { EngineeringOutput };
