# Deployment Summary

## Status

Phase 1 is complete and deployed.

- GitHub: `https://github.com/elixa-admin/NewBoard`
- Branch: `main`
- Production: `https://newboard-token-dashboard.vercel.app`
- Vercel project: `newboard-token-dashboard`
- Vercel project ID: `prj_673wcF2AwHvj5fU6Bq6atAGeMph6`
- Local preview: `http://localhost:4202`

## What Is Deployed

The deployed application is a static dashboard with static JSON API files.

Frontend:

- `packages/frontend/public/index.html`

Static API:

- `packages/frontend/public/api/health.json`
- `packages/frontend/public/api/session/current.json`
- `packages/frontend/public/api/recommendations.json`

Routing:

- Local: `packages/frontend/public/serve.json`
- Production: `vercel.json`

## Local Verification

```bash
npm install
npm run serve:frontend
```

Open:

```text
http://localhost:4202
```

Check endpoints:

```bash
curl http://localhost:4202/api/health
curl http://localhost:4202/api/session/current
curl http://localhost:4202/api/recommendations
```

## Current Mock Data

- Session usage: `4,500 / 44,000` tokens
- Session percent: `10.2%`
- Weekly usage: `4,500 / 800,000` tokens
- Weekly percent: `0.6%`
- Haiku: `1,200` tokens
- Sonnet: `3,300` tokens
- Recommendation: switch to Haiku, `87%` confidence

## Vercel Configuration

`vercel.json` serves static files from `packages/frontend/public`.

API routes are rewritten to JSON files:

- `/api/health` -> `/api/health.json`
- `/api/session/current` -> `/api/session/current.json`
- `/api/recommendations` -> `/api/recommendations.json`

## Why This Architecture

Static JSON was chosen for Phase 1 because it:

- minimizes moving parts
- works locally and on Vercel with the same path structure
- avoids database and function complexity during frontend validation
- gives Phase 2 a stable contract to replace with real data

The single HTML file was chosen because it:

- needs no build step
- previews quickly
- deploys predictably
- makes the API contract easy to validate

## Phase 2 Direction

Connect a real Claude Code token data source while preserving the current static JSON files as fixtures.

Recommended first integration target:

1. Create an endpoint that returns the existing `/api/session/current` schema.
2. Keep local development on static JSON.
3. Add configuration for real production endpoint vs mock local data.
4. Continue 30-second polling until webhook delivery is clearly needed.
5. Add historical storage only after the current-session flow is reliable.

## Files Removed During Handoff Cleanup

The old React/Vite frontend, Express backend, hook scripts, serverless function stubs, and scratch preview servers were removed because they no longer represent the deployed architecture.
