# BAOS — Business Autonomous Operating System

An AI Autonomous Company. This repo contains its constitutional core:
**Platform Memory** (the institutional brain), the **Quality Assurance
Director** (the constitutional guardian), the **Engineering Department**
(the AI organization that builds every future department), and the
**Executive Interface** (the headquarters a human founder uses to run
the company).

```
baos/                                       the repo root IS the Next.js
│                                            app — no subfolder, no Vercel
│                                            "Root Directory" setting needed
├── app/, components/, lib/                 Executive Interface (Command
│                                            Center, Engineering Workspace,
│                                            Platform Memory Explorer,
│                                            Quality Assurance Center,
│                                            Marketplace)
├── platform-memory/                        shared organizational infrastructure —
│                                            the single source of truth every
│                                            department reads from and (if it's QAD)
│                                            writes to. Not owned by any department.
├── departments/
│   ├── quality-assurance-director/         standalone department — certifies every
│   │                                        artifact any department produces. The
│   │                                        only holder of Platform Memory's commit
│   │                                        authority token.
│   └── engineering/                        standalone department — builds every
│                                            future department, connects to Platform
│                                            Memory and QAD as a client, same as any
│                                            other department would.
├── next.config.js, package.json, ...       standard Next.js project files
```

Platform Memory and QAD are peers to Engineering, not folders inside it —
Engineering is only one of many departments that will eventually connect
to both. They live inside this repo (not a separate `dashboard/`
subfolder) purely so Vercel deploys this as a single, ordinary Next.js
project — no monorepo-specific settings to get right.

## Quick start (local)

```bash
# 1. Run Platform Memory's own tests
cd platform-memory && npm test

# 2. Run the Quality Assurance Director's own tests
cd ../departments/quality-assurance-director && npm test

# 3. Run the Engineering Department standalone (boots its own Platform
#    Memory + QAD instances if none are injected)
cd ../engineering && npm test
node tests/demo-run.js   # human-readable end-to-end walkthrough

# 4. Run the Executive Interface, from the repo root
cd ../..
npm install
npm run dev              # http://localhost:3000
```

With no further configuration, the app runs against in-memory
storage — fully functional for local development and demos, but state
resets whenever the dev server restarts.

## Deploying to Vercel

This project targets the **Hobby plan's 12 serverless function limit** —
it currently uses **8** API routes (`status`, `submit-request`,
`memory`, `quality`, `marketplace`, `pending`, `activate`,
`prompt-creator`), leaving headroom before hitting the cap.

1. Import this repo into Vercel. **Leave Root Directory blank/default** —
   the repo root is the app.
2. Attach persistent storage so Platform Memory survives across serverless
   invocations (Vercel functions are stateless per cold start — without
   this, certified knowledge would never actually accumulate):
   - Vercel Dashboard → your project → **Storage** → add a **Redis**
     database (via the Upstash Marketplace integration — this is what
     "Vercel KV" now routes through, since Vercel KV itself was deprecated
     in December 2024).
   - This automatically sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` on
     your project. No code changes needed — `lib/engineering-bridge.js`
     detects these and switches Platform Memory, QAD's certification log,
     and pending activations to Redis-backed storage automatically.
3. (Optional) Set `ANTHROPIC_API_KEY` to enable the Prompt Creator button.
4. Deploy. No monorepo-specific build settings required — this is now an
   ordinary single-project Next.js app.

See `DEPLOYMENT.md` for what is and isn't persistent once deployed, and
each package's own README/ARCHITECTURE.md for design rationale.

## Sending me additional department files

If you have more department implementations to incorporate, paste the
code directly into the conversation or attach the file — either works.
Anything submitted gets audited (actually run, not just read) before
being wired in.
