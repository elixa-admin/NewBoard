# Token Usage Dashboard

Local-first dashboard for tracking Claude Code token usage by session, project, and model.

## Current Snapshot

This repo is an active MVP, not a finished product.

- Frontend: React + Vite dashboard at `http://localhost:4200`
- Backend: Express + TypeScript API at `http://localhost:4201`
- Storage: local JSON file at `~/.claude/token-usage.json`
- Hook path: `scripts/log-token-usage.sh` calls the backend CLI logger

## What Works Now

- Current session stats at `GET /api/session/current`
- Model totals at `GET /api/stats/models`
- Project totals at `GET /api/stats/projects`
- Trend buckets at `GET /api/stats/trends/:timeframe`
- Recommendation generation at `GET /api/recommendations`
- Recommendation feedback persistence at `POST /api/recommendations/:id/feedback`
- Frontend overview, model comparison, and recommendation panels
- Frontend recommendation actions save feedback and refresh recommendations
- Local storage initialization and append flow
- Session and weekly threshold calculation
- Trend bucketing based on individual call timestamps
- Backend `createApp()` export for cleaner verification

## Known Gaps

- Hook setup is documented, but real end-to-end hook verification still needs a full local pass
- Vitest is not yet behaving reliably in this environment, so compiler and direct runtime checks are more trustworthy than the current test runner signal
- `packages/backend/dist/` is stale relative to `src/`; rebuild before relying on compiled output
- No GitHub remote or Vercel project config is checked in here right now
- Local preview in this environment may require unrestricted port binding outside the default sandbox
- The normal backend `tsx` dev runtime is still flaky here; use the preview backend workaround below when you need a reliable UI preview

## Project Structure

- [packages/backend](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend)
- [packages/frontend](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend)
- [docs/token-usage-dashboard/spec.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/spec.md)
- [docs/token-usage-dashboard/plan.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/plan.md)
- [docs/token-usage-dashboard/API_REFERENCE.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/API_REFERENCE.md)
- [docs/token-usage-dashboard/HOOK_SETUP.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HOOK_SETUP.md)
- [docs/token-usage-dashboard/HANDOFF.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HANDOFF.md)

## Local Development

```bash
npm install
npm run dev
```

Frontend runs on `4200`. Backend runs on `4201`.

## Preview Workaround

When the main backend dev runtime stalls, run the plain Node preview backend instead:

```bash
node packages/backend/preview-server.mjs
```

Then run the frontend:

```bash
npm run dev -w packages/frontend -- --host 0.0.0.0
```

Verified local preview URLs:

- Frontend: `http://127.0.0.1:4200`
- Preview backend: `http://127.0.0.1:4201`

## Verification

Most reliable checks at the moment:

```bash
npx tsc -p packages/backend/tsconfig.json --pretty false
npx tsc -p packages/frontend/tsconfig.json --pretty false
```

Backend tests exist, but the current Vitest runner behavior still needs cleanup before it should be treated as a fully trusted signal.

## Next Stage

Start with the handoff note:

- [docs/token-usage-dashboard/HANDOFF.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HANDOFF.md)

Then prioritize:

1. Fix backend test runner reliability.
2. Replace the preview workaround by fixing the real backend `tsx` startup path.
3. Rebuild backend output so `dist` matches source.
4. Complete hook verification against real Claude Code hook env vars.
5. Expand the dashboard with project breakdown and historical views.
