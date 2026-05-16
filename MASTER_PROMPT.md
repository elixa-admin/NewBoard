# Master Prompt For Claude Code

You are continuing development of the Token Usage Dashboard in:

`/Users/brandondienar/Documents/Codex/Projects/NewBoard`

## Current Status

Phase 1 is complete and deployed. The active app is a static dashboard plus static JSON API files.

- GitHub: `https://github.com/elixa-admin/NewBoard`
- Branch: `main`
- Production: `https://newboard-token-dashboard.vercel.app`
- Local preview: `http://localhost:4202`
- Vercel project: `newboard-token-dashboard`
- Vercel project ID: `prj_673wcF2AwHvj5fU6Bq6atAGeMph6`
- Latest pushed commit during handoff: `108a9cf`

## Read First

1. `README.md`
2. `QUICK_START.md`
3. `HANDOFF_TO_CODEX.md`
4. `DEPLOYMENT_SUMMARY.md`
5. `docs/token-usage-dashboard/API_REFERENCE.md`

## Canonical Files

- `packages/frontend/public/index.html`
- `packages/frontend/public/api/health.json`
- `packages/frontend/public/api/session/current.json`
- `packages/frontend/public/api/recommendations.json`
- `packages/frontend/public/serve.json`
- `vercel.json`
- `.claude/launch.json`

## Do Not Reintroduce

The old React/Vite app, Express backend, local hook scripts, Vercel function stubs, and scratch preview servers were removed because the production MVP is static. Do not rebuild those paths unless Phase 2 explicitly chooses one of them.

## Local Commands

```bash
npm install
npm run serve:frontend
npm run verify
```

Open `http://localhost:4202`.

API checks:

```bash
curl http://localhost:4202/api/health
curl http://localhost:4202/api/session/current
curl http://localhost:4202/api/recommendations
```

## API Contract

Do not break `/api/session/current`. The frontend expects:

- top-level `status`
- `data.project`
- `data.sessionId`
- `data.startedAt`
- `data.totalTokens`
- `data.totalCost`
- `data.callCount`
- `data.modelBreakdown.haiku`
- `data.modelBreakdown.sonnet`
- `thresholds.session`
- `thresholds.weekly`
- `alerts[]`

Alert thresholds are fixed:

- `ok`: 0-65%
- `warning`: 65-90%
- `critical`: 90%+

## Next Phase

Start Phase 2a: real data integration.

Before starting Phase 2a, check the latest Vercel deployment. At handoff time, GitHub `main` had the cleanup commits, but production `/api/session/current` was still returning the previous serverless-function-shaped response. Confirm Vercel has deployed commit `108a9cf` or redeploy from the dashboard.

Goal: connect the dashboard to an authoritative Claude Code token data source while preserving the existing static mock data for local development and testing.

Recommended path:

1. Identify the authoritative source for Claude Code token data.
2. Create a real API endpoint that returns the exact `/api/session/current` schema.
3. Add configuration so local development can use static JSON and production can use the real endpoint.
4. Keep the dashboard polling every 30 seconds until webhook delivery is clearly needed.
5. Preserve the mock JSON files as fixtures.
6. Update `README.md`, `DEPLOYMENT_SUMMARY.md`, and this prompt after any architecture change.

Questions to answer before implementation:

- Can Claude Code expose token usage through hooks, local files, or an API?
- Should the real endpoint live in Cloudflare Worker, AWS Lambda, Vercel Function, or a small Node service?
- Do we need historical storage in Phase 2, or only current session data?
- Should recommendations remain rule-based or begin tracking historical efficiency?

Success criteria:

- Real endpoint returns the existing API contract.
- Dashboard can switch between mock and real data.
- Production deployment remains healthy.
- Documentation reflects the chosen Phase 2 architecture.
