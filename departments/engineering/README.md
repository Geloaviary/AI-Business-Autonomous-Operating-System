# Engineering Department

**The AI Engineering Organization of BAOS.**

Engineering is the first department of the Business Autonomous Operating
System. It is responsible for designing, building, validating, documenting,
packaging, and evolving every software component of the platform — including
every future department. This module is the constitutional reference
implementation: every department Engineering generates inherits this same
file structure and lifecycle.

## Organizational Model

Think of this code as an org chart, not a codebase:

| Software Concept | Organizational Meaning |
|---|---|
| `agents/` | AI employees (Chief Architect, Backend Engineer, QA Engineer, ...) |
| `manager.js` | The Engineering Manager — orchestrates the workforce |
| `processors/` | The "thinking" staff — decide what should be built |
| `builders/` | The "making" staff — assemble concrete files/packages |
| `output.js` | Engineering's sole liaison to the Quality Assurance Director |
| `input.js` | Engineering's sole channel confirming a Platform Memory commit |
| `memory.js` | Engineering's read-only access to the organization's certified knowledge |
| `learning.js` | Engineering's private, provisional lessons-learned log |
| `engineering.js` | Engineering's own health & self-monitoring function |

## Every department Engineering builds gets its own staff, researched — not typed by the executive

Staffing a new department is not a mechanical translation of whatever
text an executive types into a capabilities box — that's string
manipulation, not organizational design. Two roles handle this properly,
in sequence:

**The Workforce Research Analyst** determines *what* the department
needs, consulting knowledge in the same priority order the whole platform
follows: Platform Memory first (has a similar department's staffing
pattern already been certified?), then `agents/workforce-archetypes.js`
— Engineering's own built-in expertise about how real departments like
Marketing, Procurement, Research, Sales, Finance, and 15+ others are
actually staffed — and only for a genuinely novel department type neither
recognizes, provisional OpenAI research. Ask for "a Marketing Department"
with *zero* capabilities specified, and it still comes back with a
`MarketingStrategist`, `ContentMarketingSpecialist`,
`SEOGrowthSpecialist`, `SocialMediaSpecialist`, and
`MarketingAnalyticsSpecialist` — because that's what a real one needs,
not because anyone typed those job titles. Executive-specified
capabilities are consulted last, and only *additively*: if something
explicitly requested genuinely isn't covered by the researched roster,
one supplemental role is added for it — never as the primary mechanism
for deciding headcount or roles.

**The Workforce Engineer** then hires that researched roster — generating
`agents/base-agent.js` and `agents/index.js` for the new department, one
class per researched role (with real headcount: `ContentWriter x2` stays
two instances, not one), each following the same "consult Platform Memory
before OpenAI" discipline every BAOS employee follows (see
`agents/constitutional-templates.js` and the workforce templates in
`agents/index.js`). The generated department's own `manager.js` actually
dispatches incoming work to this workforce and aggregates their
contributions — it isn't decoration. This is what makes a generated
department genuinely standalone and plug-and-play for any business: it
doesn't just have the constitutional shape of a department, it has staff
whose composition was researched the way a real CTO staffing a new team
would.

## Constitutional Lifecycle

```
Human Request
   -> Requirement Analysis        (manager.js + ProjectArchitect)
   -> Architecture Planning       (SeniorSoftwareEngineer review)
   -> AI Workforce                (agents/, processors/, builders/)
   -> Generated Department        (artifact.js — immutable)
   -> Internal Validation         (validators.js)
   -> Quality Assurance Director  (output.js — the ONLY path to QAD)
   -> Platform Memory Commit      (input.js confirms the commit)
   -> Department Activation
   -> Marketplace ZIP Package     (builders/package-builder.js)
```

If validation or QAD certification fails, `repair.js` produces a **new**
artifact (never mutating the rejected one) and the cycle retries, up to
`config.execution.maxRepairAttempts`.

## Constitutional Rules Enforced in Code

1. **Engineering never writes to Platform Memory.** Only `output.js` talks
   to the Quality Assurance Director, and only QAD may commit certified
   knowledge — enforced by a real capability token in the standalone
   `platform-memory/` and `../quality-assurance-director/` packages, not
   just by convention here.
2. **Artifacts are immutable.** `artifact.js` freezes every instance; repair
   always creates a new artifact with a `parentArtifactId` pointer.
3. **Builders never make architectural decisions**; processors never import
   builders directly — `manager.js` is the only orchestration point.
4. **Knowledge strategy**: agents consult Platform Memory (certified) before
   falling back to OpenAI (provisional) — see `agents/base-agent.js`.

## Running Standalone

```js
const { createEngineeringDepartment } = require('./index');

const dept = createEngineeringDepartment();
await dept.runtime.start();

const result = await dept.runtime.submitRequest({
  businessObjective: 'Create a Procurement Department.',
  requestedBy: 'CEO',
  capabilities: ['Supplier sourcing', 'Purchase order tracking', 'Approval workflows']
});

console.log(result.package); // { packageName: 'Procurement-0.1.0.zip', zipPath: '...' }
```

Run the bundled end-to-end demo:

```
npm run demo
```

Run the smoke test suite:

```
npm test
```

## Directory Structure

See `CHAPTER_7` of the BAOS specification for the full constitutional file
structure this department implements. Mandatory files are listed in
`constants.js -> MANDATORY_FILES`.
