# Deployment Notes

Honest accounting of what works out of the box on Vercel, what needs the
Redis integration, and what's still a real gap — so nothing here is a
surprise once you're testing against a live deployment.

## Persistent once Redis is attached

- **Platform Memory** (`platform-memory/adapters/redis.js`) — the single
  source of truth across every department survives cold starts, visible
  in the Platform Memory Explorer.
- **QAD's commit authority** works identically regardless of storage
  backend — the capability-token enforcement in
  `platform-memory/commit-authority.js` doesn't change based on which
  storage adapter is injected.
- **QAD certification history** — the Quality Assurance Center's
  certification log is QAD's own audit trail
  (`departments/quality-assurance-director/history.js`); like Engineering's
  own history, it's currently in-memory per-process (see below) unless you
  extend it with a Redis-backed store the same way Platform Memory has one.
- **Pending activations** — the executive-approval queue
  (`departments/engineering/adapters/pending-activations-redis.js`) is
  Redis-backed, which matters because the "create" and "activate" clicks
  can land on different serverless instances.

## Closed since the last review

- **Real LLM reasoning.** Setting `OPENAI_API_KEY` switches Engineering's
  own agents and every generated department's specialists from the
  offline simulator to real OpenAI calls — via Node's built-in `fetch`,
  no SDK dependency. Verified with a mocked `fetch` (this sandbox can't
  reach `api.openai.com`), proving the request shape, auth header, and
  JSON-mode response parsing are correct.
- **Precedent accumulation.** A generated department's certified
  specialist contributions are now committed to Platform Memory as real,
  queryable content (`departments/quality-assurance-director/manager.js`'s
  `_extractKnowledge`) — not just a one-line summary. Proven end-to-end: a
  second request to the same generated department has its specialist cite
  the first request's certified result instead of consulting OpenAI again.

## Still ephemeral (known gaps, not yet addressed)

- **Marketplace ZIP packages.** `config.js` writes them to `os.tmpdir()`,
  which is writable on Vercel — but `/tmp` is wiped between invocations and
  isn't shared across concurrent function instances. Fixing this properly
  means writing the ZIP bytes to real object storage (Vercel Blob is the
  natural fit) instead of local disk.
- **QAD and Engineering's own `HistoryLog`/`LearningEngine`** (execution
  history, lessons learned — distinct from Platform Memory itself) are
  in-memory per department instance. Both are storage-agnostic by design,
  so backing them with Redis the same way Platform Memory is would be a
  straightforward follow-up, not a redesign.
- **OpenAI calls** run through the offline simulator
  (`departments/engineering/adapters/openai.js`) unless a real client is
  injected via `createEngineeringDepartment({ openaiClient })`. Nothing
  about deployment changes this — it's a separate configuration step.

## Environment variables

| Variable | Set by | Purpose |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel's Upstash Marketplace integration | Platform Memory + pending-activation persistence |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Direct Upstash account (non-Vercel-managed) | Same, alternate naming — the bridge checks both |
| `ANTHROPIC_API_KEY` | You, in Vercel project settings | Powers the Prompt Creator button. Without it, Prompt Creator returns a clear 501 error rather than crashing — every other feature works fine without it. |
| `ENGINEERING_PACKAGE_OUTPUT` | You, optionally | Override the marketplace ZIP output directory (defaults to `os.tmpdir()`) |
| `ENGINEERING_OPENAI_ENABLED`, `ENGINEERING_OPENAI_MODEL` | You, optionally | See `departments/engineering/config.js` — Engineering's own internal knowledge strategy, separate from the dashboard's Prompt Creator |
| `OPENAI_API_KEY` | You, optionally | Switches Engineering's own agents AND every generated department's specialists from the offline simulator to real OpenAI reasoning. Without it, everything still works — provisional knowledge is just simulated rather than real. |
| `QAD_MAX_ATTEMPTS_BEFORE_ESCALATION`, `QAD_PREDICTION_ENABLED` | You, optionally | See `departments/quality-assurance-director/config.js` |

No Redis configured → everything still runs, using in-memory storage —
this is intentional so the app is never blocked on infrastructure setup
during development.

## Vercel Hobby's 12-function limit

The dashboard uses 8 serverless functions (one per `app/api/*/route.js`
directory): `status`, `submit-request`, `memory`, `quality`,
`marketplace`, `pending`, `activate`, `prompt-creator`. Adding new
department-specific dashboard pages should reuse these generic routes
(they're already parameterized by department name) rather than adding new
route files, to stay under the limit.
