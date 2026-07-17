'use strict';

/**
 * events.js
 * ---------------------------------------------------------------------------
 * Department event definitions + a lightweight, dependency-free event bus.
 * Every constitutional transition (build started, validation failed,
 * package generated, etc.) is emitted here so that engineering.js
 * (health/monitoring), analytics.js, and the dashboard can all observe
 * the department without being coupled to manager.js internals.
 * ---------------------------------------------------------------------------
 */

const { EventEmitter } = require('events');

const EVENT_NAMES = Object.freeze({
  REQUEST_RECEIVED: 'RequestReceived',
  ANALYSIS_STARTED: 'AnalysisStarted',
  ANALYSIS_COMPLETED: 'AnalysisCompleted',
  ARCHITECTURE_PLANNED: 'ArchitecturePlanned',
  BUILD_STARTED: 'BuildStarted',
  WORKER_ASSIGNED: 'WorkerAssigned',
  WORKER_COMPLETED: 'WorkerCompleted',
  BUILD_COMPLETED: 'BuildCompleted',
  VALIDATION_STARTED: 'ValidationStarted',
  VALIDATION_PASSED: 'ValidationPassed',
  VALIDATION_FAILED: 'ValidationFailed',
  ARTIFACT_SUBMITTED: 'ArtifactSubmitted',
  QAD_CERTIFIED: 'QADCertified',
  QAD_REJECTED: 'QADRejected',
  REPAIR_STARTED: 'RepairStarted',
  REPAIR_COMPLETED: 'RepairCompleted',
  MEMORY_COMMITTED: 'MemoryCommitted',
  DEPARTMENT_ACTIVATED: 'DepartmentActivated',
  PACKAGE_GENERATED: 'PackageGenerated',
  LEARNING_RECORDED: 'LearningRecorded',
  HEALTH_CHECK: 'HealthCheck',
  FAILURE: 'Failure'
});

/**
 * DepartmentEventBus
 * A scoped EventEmitter with a bounded history buffer so engineering.js
 * can inspect "what just happened" without an external message broker.
 */
class DepartmentEventBus extends EventEmitter {
  constructor({ historyLimit = 500 } = {}) {
    super();
    this.setMaxListeners(100);
    this._history = [];
    this._historyLimit = historyLimit;
  }

  publish(eventName, payload = {}) {
    const record = {
      event: eventName,
      payload,
      at: new Date().toISOString()
    };
    this._history.push(record);
    if (this._history.length > this._historyLimit) {
      this._history.shift();
    }
    this.emit(eventName, record);
    this.emit('*', record);
    return record;
  }

  recent(limit = 50) {
    return this._history.slice(-limit);
  }
}

module.exports = {
  EVENT_NAMES,
  DepartmentEventBus
};
