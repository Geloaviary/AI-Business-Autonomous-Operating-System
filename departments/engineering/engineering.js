'use strict';

/**
 * engineering.js
 * ---------------------------------------------------------------------------
 * Continuous health monitoring for the Engineering Department: runtime,
 * workers, memory, events, queues, services, OpenAI connectivity, Platform
 * Memory connectivity, QAD connectivity, failures, resource usage.
 *
 * Constitutional rule: this module may REPORT issues but never modifies
 * source code or artifacts itself — remediation beyond simple self-healing
 * (e.g. clearing a stuck flag) is escalated, not silently patched into
 * generated output.
 * ---------------------------------------------------------------------------
 */

const config = require('./config');

class EngineeringHealth {
  /**
   * @param {Object} deps
   * @param {import('./runtime').EngineeringRuntime} deps.runtime
   * @param {import('./events').DepartmentEventBus} deps.events
   * @param {import('./memory').EngineeringMemory} deps.memory
   * @param {import('./adapters/openai').OpenAIAdapter} deps.openai
   * @param {Object} deps.qadClient
   */
  constructor({ runtime, events, memory, openai, qadClient }) {
    this.runtime = runtime;
    this.events = events;
    this.memory = memory;
    this.openai = openai;
    this.qadClient = qadClient;
    this.failureCount = 0;
    this._intervalHandle = null;

    this.events?.on('Failure', () => { this.failureCount += 1; });
  }

  async checkOpenAIConnectivity() {
    try {
      if (!this.openai) return { ok: false, reason: 'not configured' };
      await this.openai.complete('healthcheck', { role: 'HealthCheck' });
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  async checkPlatformMemoryConnectivity() {
    try {
      await this.memory.findRelevantKnowledge('healthcheck');
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  async checkQADConnectivity() {
    try {
      if (!this.qadClient || typeof this.qadClient.ping !== 'function') {
        return { ok: true, note: 'qadClient has no ping(); assuming reachable' };
      }
      await this.qadClient.ping();
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  checkRuntime() {
    return {
      status: this.runtime?.status || 'UNKNOWN',
      activeExecutions: this.runtime?.activeExecutionCount?.() ?? 0
    };
  }

  resourceUsage() {
    const mem = process.memoryUsage();
    return {
      rssMB: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
      uptimeSec: Math.round(process.uptime())
    };
  }

  determineOverallStatus() {
    if (this.failureCount >= config.health.unhealthyFailureThreshold) return 'UNHEALTHY';
    if (this.failureCount >= config.health.degradedFailureThreshold) return 'DEGRADED';
    return 'HEALTHY';
  }

  async runDiagnostics() {
    const [openaiHealth, memoryHealth, qadHealth] = await Promise.all([
      this.checkOpenAIConnectivity(),
      this.checkPlatformMemoryConnectivity(),
      this.checkQADConnectivity()
    ]);

    const report = {
      status: this.determineOverallStatus(),
      runtime: this.checkRuntime(),
      openai: openaiHealth,
      platformMemory: memoryHealth,
      qualityAssuranceDirector: qadHealth,
      resources: this.resourceUsage(),
      failureCount: this.failureCount,
      recentEvents: this.events?.recent(10) || [],
      checkedAt: new Date().toISOString()
    };

    this.events?.publish('HealthCheck', report);

    if (config.featureFlags.enableSelfHealing) {
      this._attemptSelfHeal(report);
    }

    return report;
  }

  _attemptSelfHeal(report) {
    // Conservative, reversible self-healing only: e.g. reset a stuck
    // "degraded" runtime flag if connectivity has since recovered.
    if (report.status === 'HEALTHY' && this.runtime?.clearDegradedFlag) {
      this.runtime.clearDegradedFlag();
    }
  }

  startHeartbeat(intervalMs = config.health.heartbeatIntervalMs) {
    if (this._intervalHandle) return;
    this._intervalHandle = setInterval(() => {
      this.runDiagnostics().catch(() => { /* diagnostics errors are self-contained */ });
    }, intervalMs);
    this._intervalHandle.unref?.();
  }

  stopHeartbeat() {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
  }
}

module.exports = { EngineeringHealth };
