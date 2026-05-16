# Handoff To Claude Code

## Project

Token Usage Dashboard for Claude Code Pro Plan monitoring.

- Local path: `/Users/brandondienar/Documents/Codex/Projects/NewBoard`
- GitHub: `https://github.com/elixa-admin/NewBoard`
- Branch: `main`
- Production: `https://newboard-token-dashboard.vercel.app`
- Vercel project ID: `prj_673wcF2AwHvj5fU6Bq6atAGeMph6`

## Current Status

Phase 1 is complete and deployed. The working application is a static dashboard plus static JSON API files.

Local preview:

```bash
npm run serve:frontend
```

Open `http://localhost:4202`.

## Canonical Files

- `packages/frontend/public/index.html`
- `packages/frontend/public/api/health.json`
- `packages/frontend/public/api/session/current.json`
- `packages/frontend/public/api/recommendations.json`
- `packages/frontend/public/serve.json`
- `vercel.json`
- `.claude/launch.json`
- `DEPLOYMENT_SUMMARY.md`
- `MASTER_PROMPT.md`

## Removed As Stale

The old React/Vite frontend, Express backend, local hook scripts, Vercel function stubs, and scratch preview servers were removed. Do not resurrect those paths unless Phase 2 explicitly chooses that architecture.

## API Contract

Do not break `/api/session/current`. The dashboard expects:

- top-level `status`
- `data.project`
- `data.sessionId`
- `data.startedAt`
- `data.totalTokens`
- `data.totalCost`
- `data.callCount`
- `data.modelBreakdown`
- `thresholds.session`
- `thresholds.weekly`
- `alerts[]`

Alert thresholds:

- `ok`: 0-65%
- `warning`: 65-90%
- `critical`: 90%+

## Phase 2 Recommendation

Start with Phase 2a: real data integration.

Preferred sequence:

1. Identify the authoritative Claude Code token data source.
2. Create a real endpoint that returns the existing `/api/session/current` schema.
3. Keep static JSON as local fallback/mock data.
4. Add a small configuration layer for mock vs production API source.
5. Keep polling at 30 seconds until there is a reason to move to webhooks.
6. Update this handoff and `DEPLOYMENT_SUMMARY.md` after the architecture changes.

## Master Prompt

Use [MASTER_PROMPT.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/MASTER_PROMPT.md).
