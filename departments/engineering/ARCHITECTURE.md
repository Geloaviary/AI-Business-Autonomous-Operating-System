# BAOS Engineering Department — Architecture Documentation

**Author's note (from the AI CTO):** this document explains *why* the
Engineering Department is built the way it is — not just what each file
does. Treat it as the design record a real CTO would leave for the next
engineer who has to extend this system, or clone it into a new department.

---

## 1. The organizing metaphor is load-bearing, not decorative

Every module in this codebase maps to something a real engineering
organization has: a manager, specialized engineers, a QA process, a
documentation writer, institutional memory, health monitoring. This isn't
just naming flavor — it's the actual decomposition boundary:

- `agents/` are **employees**: each one has a single responsibility and a
  `perform(task)` method, the same way a real hire has a job description
  and does the work in front of them, not everyone else's.
- `manager.js` is the **only** module allowed to coordinate multiple
  agents/processors/builders in one workflow. Nothing else is allowed to
  reach across those boundaries. This mirrors how, in a real org, only a
  manager is expected to synthesize input from Architecture, Backend,
  Security, and QA into one decision — an individual contributor shouldn't
  have to.
- `output.js` is Engineering's **sole liaison** to the Quality Assurance
  Director, the same way a real company routes external certification
  through one accountable owner rather than letting every engineer submit
  work independently.

This matters architecturally because it gives us a *test* for where new
code belongs: "which employee would do this in a real company?" resolves
ambiguity that a purely technical decomposition (e.g. "utils/") would not.

## 2. Why artifacts are immutable

`artifact.js` freezes every instance on construction. This wasn't a
defensive-programming reflex — it's a direct consequence of a specific
constitutional requirement: certified history must be tamper-proof.

If artifacts were mutable, a "repair" could silently rewrite what was
originally submitted to QAD, which would make the QAD certification
worthless as an audit record — you could never trust that what's in
Platform Memory is what was actually reviewed. Instead, `repair.js`
**always produces a new Artifact** with a `parentArtifactId` pointing at
its predecessor. The lineage chain is the audit trail. This costs a small
amount of memory (old artifacts aren't garbage collected mid-run) in
exchange for an invariant we never have to re-verify: any Artifact you
hold a reference to is exactly what it was when it was built.

## 3. Why Engineering never writes to Platform Memory directly

This is enforced at three independent layers, deliberately redundant —
and since the restructure into standalone `platform-memory/` and
`departments/quality-assurance-director/` packages, the enforcement is
stronger than convention:

1. **API surface**: `memory.js` (Engineering's interface) only exposes
   `findRelevantKnowledge`, `findArchitecturePatterns`, `findLessonsLearned`
   — all reads. There is no `write` or `commit` method to even call.
2. **A real capability token, not just an API boundary**: Platform Memory's
   `commit()` requires a token from `commit-authority.js`, minted once and
   granted exclusively to QAD at composition time
   (`platformMemory.grantCommitAuthority()`, called only inside
   `quality-assurance-director/index.js`). Engineering never holds this
   token and structurally cannot call `commit()` successfully even if it
   tried — presenting no token or a forged one throws
   `UnauthorizedCommitError` before storage is ever touched. This closed a
   real gap in the previous single-process design, where "only QAD calls
   commit()" was true only because nothing else happened to call it.
3. **Confirmation, not assumption**: `input.js` doesn't just assume a
   commit happened after QAD says PASS — it calls
   `awaitCommitConfirmation(certificateId)` and only allows the manager to
   proceed to `ACTIVE` once Platform Memory itself confirms the write
   landed. This closes a real failure mode: QAD could certify an artifact
   and then crash before the commit persists. Without this confirmation
   step, Engineering could activate a department whose certified knowledge
   was never actually saved.

The organizational reason this matters: Platform Memory is supposed to be
the *one* trustworthy record every department can build on. If any
department could write to it directly, "certified" would stop meaning
anything, because you'd never know whether a given entry passed review or
was just written by whichever department got there first.

## 4. Why processors and builders are separate layers

`processors/` decide *what* should happen; `builders/` *make it happen* as
concrete files. This split exists because the two have different failure
modes and different reasons to change:

- A processor changes when the **business logic of quality** changes — e.g.
  "should a missing UI directory fail validation?"
- A builder changes when the **output format** changes — e.g. "the
  manifest should now include a semver range instead of a pinned version."

Mixing them means a change to file-naming conventions risks breaking
architectural decision logic, and vice versa. Keeping them apart also
enforces a useful constitutional rule directly in the dependency graph:
processors never import builders. If a processor needed to import a
builder, that would be a sign it's trying to make a decision *and*
materialize it in one step, which is exactly the coupling this split
prevents.

`manager.js` is the only place the two layers are wired together, which
also makes it the only place you need to look to understand the full
pipeline order.

## 5. Why knowledge lookup is Platform-Memory-first, OpenAI-fallback

`agents/base-agent.js`'s `consultKnowledge()` always tries
`memory.findRelevantKnowledge()` before falling back to
`openai.completeJSON()`. This isn't just cost optimization — it's the
mechanism by which BAOS is supposed to get *more autonomous over time*.
Early on, Platform Memory is empty, so every agent leans on OpenAI (marked
`provisional`). As certified knowledge accumulates, agents increasingly
find what they need locally, and OpenAI usage should trend down for
well-trodden problems while remaining available for genuinely novel ones.
If this ordering were reversed (or agents called OpenAI unconditionally),
Platform Memory would never actually get used, and the "institutional
brain" would just be a write-only audit log instead of a working memory.

## 6. Why the repair loop produces new artifacts instead of patching

See §2 for the immutability rationale — the workflow implication is in
`manager.js`'s `_handleValidationFailure` / `_submitAndCommit` retry logic.
Two failure sources trigger repair: internal `validators.js` rejection and
QAD rejection. Both route through the same `RepairCoordinator`, so there is
one repair code path regardless of *who* found the problem — this avoids a
second, subtly different "QAD repair flow" from drifting out of sync with
the internal one over time. `config.execution.maxRepairAttempts` bounds the
loop; exhausting it raises `RepairExhaustedError` rather than looping
forever, because an AI workforce that can't converge on a fix after N
attempts needs a human/organizational escalation, not more silent retries.

## 7. Why the ZIP archiver has zero dependencies

`adapters/archiver.js` implements the ZIP format (local file headers,
central directory, end-of-central-directory record) by hand using only
`zlib.deflateRawSync` and a hand-rolled CRC32 table, rather than pulling in
`archiver` or `jszip` from npm. This is a direct expression of the
portability requirement: a marketplace package's *production pipeline*
should be as dependency-light as the department it's packaging, so that
Engineering — the thing every other department bootstraps from — never
becomes blocked by a third-party package going unmaintained, changing its
API, or being unavailable in a restricted deployment environment.

## 8. Why health monitoring can self-heal but never self-modify code

`engineering.js` (`EngineeringHealth`) is explicitly restricted to
*reversible* self-healing — e.g. clearing a stuck "degraded" flag once
connectivity recovers. It does not, and structurally cannot, rewrite
generated artifacts or retry a failed pipeline on its own initiative.
Diagnosis and remediation are different levels of authority: a health
monitor deciding "this dependency looks reachable again, clear the flag" is
safe and reversible; a health monitor deciding "this artifact looks wrong,
let me fix it" would be making a QAD-level judgment call without QAD's
review, which would undermine the entire certification model in §3.

## 9. Why the Executive Dashboard is a thin layer, not a second brain

The Next.js dashboard (`/dashboard`) does not reimplement any pipeline
logic. `lib/engineering-bridge.js` boots one process-wide instance of
`createEngineeringDepartment()` — the exact same composition root used by
the backend's own tests and CLI demo — and every page reads from it live
(`/api/status`, `/api/memory`, `/api/quality`, `/api/marketplace`) or drives
it (`/api/submit-request`, streamed via Server-Sent Events). This was a
deliberate constraint: if the dashboard had its own copy of "what a healthy
pipeline looks like," the two could drift apart, and an executive watching
the UI could be shown a company that isn't the one actually running. The
dashboard is a window, not a second implementation.

A consequence of this design worth calling out explicitly, because it
caused a real bug during development: relative filesystem paths (e.g.
`config.packaging.outputDir`) resolve against `process.cwd()` of whichever
process required the department module. When the dashboard's Next.js
server is that process, generated packages land under the *dashboard's*
working directory, not the engineering module's own folder. The bridge's
`getMarketplacePackages()` has to resolve paths the same way the backend's
`adapters/filesystem.js` does — via `path.resolve()`, not by assuming the
engineering directory — or the two disagree about where output landed.

## 10. QAD and Platform Memory are now real standalone departments, not stubs

Earlier versions of this codebase had Engineering privately own
`adapters/qad-client.js` and `adapters/platform-memory-client.js` as
in-process stand-ins for services a full deployment would provide
externally. That was a reasonable bootstrap but the wrong end state: it
meant "only QAD may commit" was true only by convention (nothing else
happened to call `commit()`), and every department Engineering generated
would eventually need its own equivalent stubs, duplicating the same
logic everywhere.

Both are now real, standalone BAOS packages — `platform-memory/` and
`departments/quality-assurance-director/` — peers to Engineering, not
folders inside it:

- **`platform-memory/`** is the single source of truth every department
  connects to, including Engineering and QAD itself. Its `commit()`
  requires a capability token (`commit-authority.js`) granted exactly once
  to QAD — an actual enforced rule, not a documented one.
- **`departments/quality-assurance-director/`** follows the same
  constitutional file structure as Engineering (it's a BAOS department
  too), but with employees suited to *judging* rather than *building*:
  a `ConstitutionalAuditor` running generic structural checks that work
  for any department's submission shape, a `DepartmentLiaison` dispatching
  to optional department-specific rules via a registry (so QAD never
  hardcodes department names), an `EscalationOfficer`, and a
  `PredictionAnalyst` that flags likely-risky submissions from learned
  history — all deterministic-first, consulting AI only for genuinely
  ambiguous judgment calls, so certification keeps working with no
  network access at all.
- Engineering now connects to both exactly like any other department
  would: `createEngineeringDepartment({ platformMemory, qad })`. If
  neither is provided, it creates real standalone instances of each
  (imported from their own packages) rather than a private duplicate — so
  running Engineering in isolation still works, without divergent logic.

What's still genuinely simulated is the *offline mode* of
`adapters/openai.js` — a deterministic stand-in so the department runs
without network access. That boundary is unchanged: a real OpenAI client
is a constructor-injection swap, same as before.

## 11. knowledge.js and views.js: Platform Memory doesn't understand business logic, departments do

Earlier versions of this codebase had Platform Memory carry a hardcoded
`KNOWLEDGE_CATEGORY` enum and had QAD's manager.js guess at what was
"worth remembering" from a raw submission. Both were quiet violations of
the same principle: shared infrastructure shouldn't need business
knowledge to do its job.

The fix moves transformation to where the domain understanding actually
lives — inside each department, before submission, never after:

```
Artifact -> knowledge.js (this department's own transformation logic)
         -> views.js (consumer-specific presentations of that knowledge)
         -> submitted to QAD already fully-formed
         -> QAD certifies structure, understands none of the content
         -> Platform Memory stores it opaquely: Store, Retrieve, Version,
            Search, Relationships, Security — nothing else
```

Two concrete closures this enabled, both covered by tests:

- **Engineering learns from itself.** `knowledge.js` transforms a newly
  built department's staffing plan into a `DepartmentStaffingPattern`,
  keyed by a stable `subjectKey` (`staffing-pattern:<name>`) rather than a
  fuzzy topic search. The next time Engineering is asked to build the same
  kind of department, `WorkforceResearchAnalyst` finds this real precedent
  via Platform Memory's Version pillar (`latestVersion`) before ever
  falling back to the built-in archetype library.
- **Departments become genuinely portable products.** A department's own
  `knowledge.js`/`views.js` travel inside its ZIP — installing it into a
  different BAOS instance doesn't require an external "translation
  service" to make sense of its knowledge; the department already decided
  how to present itself to likely consumers (see each department's
  `views.js` — a `default` view for unknown consumers, plus named views
  for known ones).

`subjectKey` was a real bug source worth naming: the department that
*produces* a piece of knowledge (e.g. Engineering, producing a staffing
pattern) is often different from the department that knowledge is *about*
(e.g. Sales, the subject of that pattern). Platform Memory's Version
pillar looks up by `subjectKey` alone for exactly this reason — requiring
department-name to match as well would silently return nothing, which is
exactly the bug this section's implementation hit and fixed.

## 12. Known limitations and deliberate non-goals

- **Some state is still single-process and in-memory.** `HistoryLog` and
  `LearningEngine` (both Engineering's own and QAD's) hold state in
  process memory. A production deployment would back these with
  persistent storage; the interfaces
  (`history.js`, `learning.js`, `memory.js`) are already storage-agnostic,
  so this is a swap, not a redesign.
- **No authentication/authorization layer.** Out of scope for a
  department-level reference implementation; this belongs at the platform
  gateway level, shared by every department.
- **The dashboard visualizes Engineering only.** Research, Strategy,
  Content, Revenue, and other departments described in the platform vision
  don't exist yet — Engineering's constitutional purpose is to build them
  on request, using this same file structure. The dashboard represents
  that honestly (see `KNOWN_DEPARTMENTS` in `lib/types.ts`) rather than
  faking department pages that don't have a real backend behind them.
