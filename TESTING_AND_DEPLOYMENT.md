# Testing & Deployment Guide

From "does this actually work" to a live Vercel deployment with real
persistence. Every command here has been run against this exact codebase.

---

## Part 1 — Verify it locally, before touching GitHub

```bash
cd baos

# Three independent backend packages, each with its own test suite
cd platform-memory && node tests/index.js
cd ../departments/quality-assurance-director && node tests/index.js
cd ../engineering && node tests/index.js && node tests/demo-run.js

# The app itself, from the repo root
cd ../..
npm install
npx tsc --noEmit          # should print nothing
npm run build              # should end with a route table, no errors
```

If all of that's clean, run it for real:

```bash
npm run dev
```

Open `http://localhost:3000` and walk through the actual flow:
1. **Command Center** → type "Create a Marketing Department." (no capabilities needed — it should still produce a real researched roster)
2. Watch the **Live Engineering Activity** feed run through the full lifecycle
3. It should land in **Awaiting Your Activation**, not go live automatically
4. Click **Activate** → check the **Marketplace** page for the ZIP
5. Check **Platform Memory** and **Quality Assurance** pages — both should now show one entry

At this point everything is running on in-memory storage — closing the dev server erases it. That's expected; Redis is Part 3.

---

## Part 2 — Commit and push to GitHub

### Simplest: double-click updater (recommended for most updates)

`UPDATE-GITHUB.sh` (Mac/Linux) and `UPDATE-GITHUB.bat` (Windows), included
at the root of this project, handle everything in one step: prompts for
your GitHub username and repo name, sets up git if it isn't already, and
commits + pushes automatically.

1. Extract this project's files into your local project folder — for a
   clean upgrade, replace the folder entirely rather than copying new
   files on top of old ones, so files removed in this version don't get
   left behind.
2. Double-click `UPDATE-GITHUB.sh` (Mac/Linux) or `UPDATE-GITHUB.bat`
   (Windows) — or run it from a terminal.
3. Enter your GitHub username, then your repository name (defaults to
   `baos`).
4. Done — it pushes automatically. If you've connected Vercel's GitHub
   integration, your deployment redeploys within about a minute.

### First time / manual, if you'd rather run the commands yourself

```bash
cd baos
git init
git add .
git commit -m "BAOS: Platform Memory, QAD, Engineering, Executive Dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### If you want deletions handled automatically against a SEPARATE existing clone

`update-repo.sh` syncs this upgrade into an existing local clone without
touching it directly — useful if you keep your working clone somewhere
else and don't want to replace it wholesale. Unlike the one-click
updaters above, it stops before committing so you can review the diff:

```bash
cd path/to/extracted-upgrade
./update-repo.sh /path/to/your/existing/local/clone
```

It removes everything in your clone except `.git/`, copies the upgrade
in fresh, then shows `git status` so you can see exactly what changed —
including anything the upgrade removed (e.g. a prior version's now-deleted
files). It deliberately stops there: no `git add`, `git commit`, or
`git push` happens automatically. Review the diff, then:

```bash
git add -A
git commit -m "Upgrade: <describe what changed>"
git push
npm install   # node_modules was wiped by the sync
```

The included `.gitignore` already excludes `node_modules/`, `.next/`,
`marketplace-packages/`, and `.env*` — don't remove those exclusions.

---

## Part 3 — Deploy to Vercel

### 3.1 Import the project

1. [vercel.com/new](https://vercel.com/new) → import your GitHub repo.
2. **Root Directory**: leave blank/default. The repo root is the actual
   Next.js app — `platform-memory` and the two `departments/` folders live
   inside it, not in a separate subfolder, specifically so there's no
   monorepo-specific Vercel setting to get wrong (an earlier version of
   this project used a `dashboard/` subfolder and required "Include files
   outside the Root Directory" to be manually enabled — that footgun is
   gone now).
3. Framework Preset should auto-detect **Next.js**. Leave build/install commands as default.
4. Don't deploy yet — set environment variables first (Part 3.2), or the first deploy will just run without persistence.

### 3.2 Environment variables

Set these under **Project Settings → Environment Variables** before (or after — you can redeploy) your first deploy:

| Variable | Required? | Where it comes from |
|---|---|---|
| `KV_REST_API_URL` | For persistence | Auto-set when you attach Redis via Vercel Marketplace (Part 4) |
| `KV_REST_API_TOKEN` | For persistence | Same |
| `ANTHROPIC_API_KEY` | Optional | Your own Anthropic Console API key — powers the Prompt Creator button only |
| `ENGINEERING_OPENAI_ENABLED` | Optional | `true`/`false` — leave unset, defaults to true (offline simulator either way unless you also inject a real OpenAI client in code) |
| `ENGINEERING_PACKAGE_OUTPUT` | Optional | Leave unset — defaults to `os.tmpdir()`, which is what Vercel's writable path actually is |
| `QAD_MAX_ATTEMPTS_BEFORE_ESCALATION` | Optional | Integer, defaults to `3` |

**Nothing here is required to deploy successfully.** Without Redis, the app runs on in-memory storage per serverless instance — fine for a first smoke test, not fine for anything you want to persist between page loads.

### 3.3 Deploy

Click **Deploy**. Check the build log for:
```
Route (app)                              Size
├ ○ /
├ ○ /engineering
├ ○ /marketplace
├ ○ /memory
├ ○ /quality
├ ƒ /api/activate
├ ƒ /api/marketplace
├ ƒ /api/memory
├ ƒ /api/pending
├ ƒ /api/prompt-creator
├ ƒ /api/quality
├ ƒ /api/status
└ ƒ /api/submit-request
```
That's **8 serverless functions** — well under the Hobby plan's 12-function ceiling.

---

## Part 4 — Set up Platform Memory's Redis (this is the important part)

Platform Memory has to actually survive between requests to mean anything.
Vercel serverless functions are stateless per invocation — without Redis,
every cold start starts from empty. Two ways to get it:

### Option A — Vercel Marketplace (recommended, simplest)

1. In your Vercel project → **Storage** tab → **Create Database**.
2. Choose **Upstash** → **Redis** (this is what replaced "Vercel KV" after
   it was deprecated in December 2024 — same underlying Upstash
   infrastructure, new integration path).
3. Pick a region close to your deployment's region.
4. Click **Connect to Project** — select this project and which
   environments (Production/Preview/Development).
5. Vercel automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   into your project's environment variables. You don't type these in
   yourself.
6. **Redeploy** (Deployments tab → ⋯ on the latest deployment → Redeploy) —
   environment variable changes only take effect on a new deployment.

### Option B — Direct Upstash account

1. Create a free database at [upstash.com](https://upstash.com).
2. Copy the **REST URL** and **REST TOKEN** from the database's dashboard.
3. In Vercel → Project Settings → Environment Variables, add:
   - `UPSTASH_REDIS_REST_URL` = the REST URL
   - `UPSTASH_REDIS_REST_TOKEN` = the REST TOKEN
4. Redeploy.

The code checks both naming conventions
(`lib/engineering-bridge.js`'s `getRedisCredentials()`), so either option
works with zero code changes.

### 4.1 Verify Redis is actually being used, not just configured

This is the step people skip and then wonder why nothing persists:

1. Open your deployed URL, submit a business request through the Command
   Center, activate it.
2. Open the **Platform Memory** page — confirm the entry appears.
3. **Close the tab entirely, wait ~60 seconds** (long enough for the
   serverless function to likely cold-start on your next request — Vercel
   doesn't guarantee this, but idle functions do get recycled), then
   reopen the Platform Memory page.
4. If the entry is still there: Redis is working. If it's gone: check that
   `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or the Upstash equivalents) are
   actually set for the **Production** environment specifically (a common
   mistake is setting them only for Preview/Development), and that you
   redeployed after adding them.

---

## Part 5 — Ongoing sanity checks

- **Prompt Creator returns a 501** → `ANTHROPIC_API_KEY` isn't set. Everything else on the platform works fine without it.
- **Marketplace shows packages from a while ago that don't match recent activity** → expected on Vercel without further work: ZIPs write to `/tmp`, which is ephemeral per-instance (see `DEPLOYMENT.md`'s known gaps). Redis fixes Platform Memory and QAD history; it does not yet fix ZIP storage.
- **A department creation seems to hang** → check Vercel's function logs (Project → Deployments → your deployment → Functions tab) for the specific `api/submit-request` invocation; the SSE stream can look stalled in a slow network trace when it's actually still running.
- **Function count creeping toward 12** → new department-specific pages should reuse the existing 8 generic API routes (they're already parameterized) rather than adding new route files.
