'use strict';

/**
 * errors.js
 * ---------------------------------------------------------------------------
 * Named error hierarchy for Platform Memory. UnauthorizedCommitError is the
 * one that matters most constitutionally — see commit-authority.js — every
 * other error here is standard operational failure handling.
 * ---------------------------------------------------------------------------
 */

class PlatformMemoryError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class UnauthorizedCommitError extends PlatformMemoryError {}
class ValidationError extends PlatformMemoryError {}
class StorageError extends PlatformMemoryError {}
class ConfigError extends PlatformMemoryError {}

module.exports = {
  PlatformMemoryError,
  UnauthorizedCommitError,
  ValidationError,
  StorageError,
  ConfigError
};
