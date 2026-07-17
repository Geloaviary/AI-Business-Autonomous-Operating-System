# Quality Assurance Director

**The constitutional guardian of BAOS.** A standalone department — a peer
to Engineering, not a folder inside it — responsible for certifying every
artifact any department produces before it can become organizational
truth in Platform Memory.

## Why this is a separate department, not part of Engineering

QAD's job is fundamentally different from Engineering's: Engineering
*builds*; QAD *judges*. Bundling QAD inside Engineering would mean every
future department's artifacts get certified by logic living inside one
specific department's folder — which contradicts the constitutional rule
that QAD is the shared authority every department, including Engineering,
submits to.

## What's here, and what isn't

**Generic by design.** `validators.js` runs the same constitutional checks
against any department's submission, branching on submission *shape*
(a file map vs. a business payload), never on department *name*. This is
a direct, deliberate fix for the biggest flaw found auditing a prior QAD
implementation: it hardcoded validation logic to 6 specific departments
from a different platform and had no way to certify anything else.
Departments that want extra domain-specific checks can opt in via
`registerDepartmentRules(departmentName, ruleFn)` — QAD never needs to
know a department's name in advance.

**Deterministic-first employees.** Unlike Engineering's generative AI
Workforce, QAD's employees (`agents/`) apply fixed rules and only consult
Platform Memory / OpenAI for genuinely ambiguous judgment calls. This
means certification keeps working even with no AI or network access —
appropriate for something this constitutionally load-bearing.

## The only place a commit authority token is used

Platform Memory enforces "only QAD may commit" via a capability token
(see `platform-memory/commit-authority.js`), granted exactly once. This
department is the only place in BAOS that ever calls
`platformMemory.grantCommitAuthority()` — see `index.js`.

## Usage

```js
const { createPlatformMemory } = require('../../platform-memory');
const { createQualityAssuranceDirector } = require('./index');

const platformMemory = createPlatformMemory();
const qad = createQualityAssuranceDirector({ platformMemory });
await qad.runtime.start();

const verdict = await qad.runtime.certify({
  departmentName: 'research',
  artifactId: 'artifact_123',
  payload: { findings: '...' },
  checksum: 'abc123'
});
// { verdict: 'PASS', certificateId: '...' } or
// { verdict: 'FAIL', issues: [...], repairPlan: {...}, escalated: false }
```

## Workflow

```
Submission -> Prediction (informational) -> Constitutional Audit ->
Department-Specific Review (if registered) -> Decision ->
  PASS: commit to Platform Memory, confirm the commit landed
  FAIL: issue a repair plan; escalate if attempts are exhausted
```
