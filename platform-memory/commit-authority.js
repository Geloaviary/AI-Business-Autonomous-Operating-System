'use strict';

/**
 * commit-authority.js
 * ---------------------------------------------------------------------------
 * The platform constitution says "only the Quality Assurance Director may
 * commit organizational knowledge." Saying that in a comment doesn't
 * enforce it — anyone importing Platform Memory could call commit()
 * otherwise. This is the actual enforcement mechanism: Platform Memory
 * mints a single capability token at startup and hands it out exactly
 * once, to whoever composes it together with QAD (see index.js's
 * `grantCommitAuthority()`). Every commit() call must present that token;
 * without it, the call is rejected before it ever reaches storage.
 *
 * This is deliberately simple (a shared secret, not a full PKI) because
 * the threat model here is "a bug in some other department accidentally
 * calls commit()," not "an adversary is trying to forge credentials" — for
 * that threat model, this would need to be a real signed-token scheme.
 * Documented here so nobody mistakes this for more security than it is.
 * ---------------------------------------------------------------------------
 */

const crypto = require('crypto');
const { UnauthorizedCommitError } = require('./errors');

class CommitAuthority {
  constructor() {
    this._token = crypto.randomBytes(32).toString('hex');
    this._granted = false;
  }

  /** Called exactly once, by whoever wires QAD and Platform Memory together. */
  grant() {
    if (this._granted) {
      throw new UnauthorizedCommitError('Commit authority has already been granted once and cannot be re-issued');
    }
    this._granted = true;
    return this._token;
  }

  verify(presentedToken) {
    if (!presentedToken || presentedToken !== this._token) {
      throw new UnauthorizedCommitError('Invalid or missing commit authority token — only the Quality Assurance Director may commit to Platform Memory');
    }
    return true;
  }
}

module.exports = { CommitAuthority };
