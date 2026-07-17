# Platform Memory

**The institutional brain of BAOS.** Single source of organizational truth,
shared by every department. Not owned by Engineering, not owned by any
department — core platform infrastructure that departments connect to.

## Constitutional rules enforced here

- **Every department may read.** `query()` and `confirmCommit()` require no
  special authority.
- **Only the Quality Assurance Director may write.** `commit()` requires a
  capability token, minted once by `grantCommitAuthority()` and handed to
  QAD at composition time (see `commit-authority.js`). This isn't just
  documented convention — presenting an invalid or missing token throws
  `UnauthorizedCommitError` before storage is ever touched.

## Usage

```js
const { createPlatformMemory } = require('./platform-memory');

const platformMemory = createPlatformMemory();

// Composition step — done once, wiring QAD to Platform Memory:
const commitToken = platformMemory.grantCommitAuthority();
const qad = createQualityAssuranceDirector({ platformMemory, commitToken });

// Every department gets read access, no token needed:
const priorArt = await platformMemory.query({ departmentName: 'research' });
```

## Storage backends

- `adapters/in-memory.js` — default, process-scoped, fine for local dev and tests.
- `adapters/redis.js` — Upstash Redis-backed, for real persistence across
  serverless cold starts. Inject via `createPlatformMemory({ storage })`.

## Knowledge categories

See `constants.js` — taken directly from the platform vision: Engineering
Artifacts, Research Reports, Business Strategies, Content, Analytics,
Revenue Intelligence, UI Standards, Architecture Patterns, Supplier
Intelligence, Product Intelligence, Market Intelligence, Lessons Learned,
Best Practices, Department Definitions.
