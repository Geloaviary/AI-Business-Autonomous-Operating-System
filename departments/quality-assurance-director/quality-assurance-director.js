'use strict';

/**
 * quality-assurance-director.js
 * ---------------------------------------------------------------------------
 * Self health monitoring — the same role engineering.js plays for
 * Engineering, and every department's own self-named health file plays
 * for itself. Named after this department, per the constitutional
 * convention every BAOS department follows.
 * ---------------------------------------------------------------------------
 */

const config = require('./config');

class QualityAssuranceDirectorHealth {
  constructor({ events, memory, platformMemory } = {}) {
    this.events = events;
    this.memory = memory;
    this.platformMemory = platformMemory;
    this.failureCount = 0;
    this.events?.on('Failure', () => { this.failureCount += 1; });
  }

  async checkPlatformMemoryConnectivity() {
    try {
      if (!this.platformMemory) return { ok: false, reason: 'not configured' };
      await this.platformMemory.health();
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  determineOverallStatus() {
    if (this.failureCount >= config.health.unhealthyFailureThreshold) return 'UNHEALTHY';
    if (this.failureCount >= config.health.degradedFailureThreshold) return 'DEGRADED';
    return 'HEALTHY';
  }

  async runDiagnostics() {
    const platformMemory = await this.checkPlatformMemoryConnectivity();
    const report = {
      status: this.determineOverallStatus(),
      platformMemory,
      failureCount: this.failureCount,
      checkedAt: new Date().toISOString()
    };
    this.events?.publish('HealthCheck', report);
    return report;
  }
}

module.exports = { QualityAssuranceDirectorHealth };
