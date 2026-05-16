# Quick Start

## Start Local Preview

```bash
cd /Users/brandondienar/Documents/Codex/Projects/NewBoard
npm install
npm run serve:frontend
```

Open `http://localhost:4202`.

## Verify API

```bash
curl http://localhost:4202/api/health
curl http://localhost:4202/api/session/current
curl http://localhost:4202/api/recommendations
```

Expected current mock data:

- Session: `4,500` tokens, `10.2%` of `44,000`
- Weekly: `4,500` tokens, `0.6%` of `800,000`
- Models: Haiku `1,200` tokens, Sonnet `3,300` tokens
- Recommendation: switch to Haiku with `87%` confidence

## Production

- Dashboard: `https://newboard-token-dashboard.vercel.app`
- GitHub: `https://github.com/elixa-admin/NewBoard`
- Vercel project: `newboard-token-dashboard`

## Current Shape

This is a static MVP:

- No React/Vite runtime
- No Express backend
- No serverless function API in the repo
- No local token hook wired into production yet
- Static JSON files provide the mock API

## Next Development Step

Start Phase 2a: create a real data endpoint that returns the same `/api/session/current` schema, then make the dashboard choose between mock data and the real endpoint through configuration.
