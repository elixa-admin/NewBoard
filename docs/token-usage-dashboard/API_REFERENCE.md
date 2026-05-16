# API Reference

The Phase 1 API is static JSON served through local and Vercel rewrites.

## Base URLs

- Local: `http://localhost:4202/api`
- Production: `https://newboard-token-dashboard.vercel.app/api`

## Endpoints

### `GET /api/health`

Serves `packages/frontend/public/api/health.json`.

Expected shape:

```json
{
  "status": "ok",
  "message": "API running"
}
```

### `GET /api/session/current`

Serves `packages/frontend/public/api/session/current.json`.

This is the most important contract. Do not break it during Phase 2.

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
    {
      "level": "ok",
      "message": "You're at 10% of your session budget. Keep working; no restrictions yet."
    }
  ]
}
```

Alert levels:

- `ok`: 0-65%
- `warning`: 65-90%
- `critical`: 90%+

### `GET /api/recommendations`

Serves `packages/frontend/public/api/recommendations.json`.

Expected shape:

```json
{
  "data": [
    {
      "id": "rec-1",
      "suggested": "haiku",
      "current": "sonnet",
      "confidence": 0.87,
      "reason": "Your recent tasks are well within Haiku's capability. Switching saves ~73% per call.",
      "potentialSavings": 400,
      "tasksSinceLastRec": 5
    }
  ]
}
```

## Phase 2 Rule

Any real data endpoint must return these same shapes unless the frontend and docs are updated in the same change.
