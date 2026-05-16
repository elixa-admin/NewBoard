# Token Usage Dashboard

Static real-time token usage dashboard for Claude Code Pro Plan monitoring.

## Status

Phase 1 is complete. The dashboard is a deployed static MVP with mock API data and is ready for Phase 2 real-data integration.

- Repository: `https://github.com/elixa-admin/NewBoard`
- Production: `https://newboard-token-dashboard.vercel.app`
- Local preview: `http://localhost:4202`
- Vercel project: `newboard-token-dashboard`
- Vercel project ID: `prj_673wcF2AwHvj5fU6Bq6atAGeMph6`

## Current Architecture

- Frontend: [packages/frontend/public/index.html](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/public/index.html)
- Mock API data:
  - [packages/frontend/public/api/health.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/public/api/health.json)
  - [packages/frontend/public/api/session/current.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/public/api/session/current.json)
  - [packages/frontend/public/api/recommendations.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/public/api/recommendations.json)
- Local rewrites: [packages/frontend/public/serve.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/public/serve.json)
- Production rewrites: [vercel.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/vercel.json)
- Launch config: [.claude/launch.json](/Users/brandondienar/Documents/Codex/Projects/NewBoard/.claude/launch.json)

There is no active React app, Express backend, serverless function API, or local token hook in Phase 1. Those earlier experimental files were removed to keep the repository focused.

## Local Development

```bash
npm install
npm run serve:frontend
```

Open `http://localhost:4202`.

Check the static API:

```bash
curl http://localhost:4202/api/health
curl http://localhost:4202/api/session/current
curl http://localhost:4202/api/recommendations
```

## API Contract

Do not break the `/api/session/current` response shape. The dashboard expects:

```json
{
  "status": "ok",
  "data": {
    "project": "NewBoard",
    "sessionId": "sess-abc123",
    "startedAt": "2026-05-16T15:00:00.000Z",
    "totalTokens": 4500,
    "totalCost": "0.0403",
    "callCount": 5,
    "modelBreakdown": {
      "haiku": { "calls": 2, "tokens": 1200, "cost": "0.0012" },
      "sonnet": { "calls": 3, "tokens": 3300, "cost": "0.0391" }
    }
  },
  "thresholds": {
    "session": { "used": 4500, "capacity": 44000, "percent": 10.2 },
    "weekly": { "used": 4500, "capacity": 800000, "percent": 0.6 }
  },
  "alerts": [
    { "level": "ok", "message": "You're at 10% of your session budget. Keep working; no restrictions yet." }
  ]
}
```

Alert thresholds are fixed:

- `ok`: 0-65%
- `warning`: 65-90%
- `critical`: 90%+

## Phase 2

Recommended next phase: connect the static dashboard to a real Claude Code token data source while keeping the mock JSON files for local testing.

Open questions:

- What is the authoritative source for Claude Code token data?
- Can Claude Code expose token events through hooks or an internal API?
- Should production use Cloudflare Worker, AWS Lambda, Vercel Functions, or a small Node backend?
- Do we need historical storage for trend charts?
- Should updates remain polling every 30 seconds or become webhook-driven?

## Verification

```bash
npm run verify
npm run build
```

`npm run build` is intentionally a no-op because the production artifact is already static HTML and JSON.
