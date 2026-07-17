'use strict';

/**
 * errors.js
 * ---------------------------------------------------------------------------
 * Domain-specific error hierarchy. Generic Error is never thrown directly
 * anywhere else in this department — every failure mode gets a named class
 * so that engineering.js, repair.js, and analytics.js can reason about
 * *why* something failed, not just that it failed.
 * ---------------------------------------------------------------------------
 */

class BaosError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends BaosError {}
class ContractError extends BaosError {}
class BuildError extends BaosError {}
class ArtifactError extends BaosError {}
class DependencyError extends BaosError {}
class PromptError extends BaosError {}
class RepairExhaustedError extends BaosError {}
class QADCertificationError extends BaosError {}
class MemoryAccessError extends BaosError {}
class RegistryError extends BaosError {}
class ConfigError extends BaosError {}

module.exports = {
  BaosError,
  ValidationError,
  ContractError,
  BuildError,
  ArtifactError,
  DependencyError,
  PromptError,
  RepairExhaustedError,
  QADCertificationError,
  MemoryAccessError,
  RegistryError,
  ConfigError
};
