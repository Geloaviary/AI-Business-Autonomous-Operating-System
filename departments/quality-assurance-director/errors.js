'use strict';

/**
 * errors.js
 * ---------------------------------------------------------------------------
 * Named error hierarchy for the Quality Assurance Director.
 * ---------------------------------------------------------------------------
 */

class QADError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ContractError extends QADError {}
class ArtifactError extends QADError {}
class ValidationError extends QADError {}
class RepairExhaustedError extends QADError {}
class EscalationError extends QADError {}
class MemoryAccessError extends QADError {}
class RegistryError extends QADError {}
class ConfigError extends QADError {}
class CommitError extends QADError {}

module.exports = {
  QADError,
  ContractError,
  ArtifactError,
  ValidationError,
  RepairExhaustedError,
  EscalationError,
  MemoryAccessError,
  RegistryError,
  ConfigError,
  CommitError
};
