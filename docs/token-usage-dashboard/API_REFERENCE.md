# Token Usage Dashboard API Reference

The backend API serves token usage data and recommendations to the frontend dashboard. All endpoints return JSON.

## Implementation Status

- Source-of-truth backend code lives in `packages/backend/src/`
- The documented session route is mounted at `/api/session/current` in source
- Trend data is currently bucketed from individual token-call timestamps
- Recommendation feedback is persisted locally and currently nudges confidence by a small positive or negative adjustment on matching recommendations
- If `packages/backend/dist/` disagrees with this document, trust the source tree and rebuild
- For local preview, `packages/backend/preview-server.mjs` can be used as a plain Node API workaround when the normal backend `tsx` runtime stalls

## Base URL

```
http://localhost:4201/api
```

## Endpoints

### Health Check

**GET `/api/health`**

Check if the backend is running and storage is accessible.

**Response (200 OK)**:
```json
{
  "status": "ok",
  "message": "Backend is running",
  "storage": "accessible"
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "degraded",
  "message": "Storage not accessible",
  "storage": "inaccessible"
}
```

---

### Session

**GET `/api/session/current`**

Get current session statistics, usage percentages, and alerts.

**Response (200 OK)**:
```json
{
  "data": {
    "sessionId": "session-1715870400000-abc123",
    "startedAt": "2026-05-16T12:00:00Z",
    "project": "NewBoard",
    "totalTokens": 12500,
    "totalCost": "0.0315",
    "modelBreakdown": {
      "haiku": { "calls": 45, "tokens": 5200, "cost": 0.0080 },
      "sonnet": { "calls": 12, "tokens": 6800, "cost": 0.0215 },
      "opus": { "calls": 2, "tokens": 500, "cost": 0.0020 }
    },
    "callCount": 59
  },
  "thresholds": {
    "session": {
      "used": 12500,
      "capacity": 44000,
      "percent": "28.4",
      "level": "ok"
    },
    "weekly": {
      "used": 45000,
      "capacity": 800000,
      "percent": "5.6",
      "level": "ok"
    }
  },
  "alerts": [
    {
      "level": "ok",
      "message": "You're at 28.4% of your session budget. Keep working; no restrictions yet."
    }
  ]
}
```

**Alert Levels**:
- `ok` (0-65%): No restrictions
- `warning` (65-90%): Consider lighter tasks
- `critical` (90%+): New tool calls may fail

---

### Statistics

**GET `/api/stats/models`**

Get token usage breakdown by model.

**Response (200 OK)**:
```json
{
  "data": [
    {
      "model": "haiku",
      "calls": 45,
      "tokens": 5200,
      "cost": "0.0080",
      "avgTokensPerCall": "116"
    },
    {
      "model": "sonnet",
      "calls": 12,
      "tokens": 6800,
      "cost": "0.0215",
      "avgTokensPerCall": "567"
    }
  ],
  "summary": {
    "totalTokens": 12000,
    "totalCalls": 57
  }
}
```

---

**GET `/api/stats/projects`**

Get project-level token usage aggregates.

**Response (200 OK)**:
```json
{
  "data": [
    {
      "project": "NewBoard",
      "sessions": 3,
      "totalTokens": 45000,
      "totalCost": "0.1125",
      "avgTokensPerSession": 15000
    }
  ],
  "summary": {
    "projectCount": 1,
    "totalTokens": 45000
  }
}
```

---

**GET `/api/stats/trends/:timeframe`**

Get usage trends bucketed by time period.

Current behavior: buckets are built from each token call's `timestamp`, not from session start times.

**Parameters**:
- `:timeframe` - One of: `hourly`, `daily`, `weekly`

**Response (200 OK)**:
```json
{
  "data": [
    {
      "timestamp": "2026-05-16T12:00:00.000Z",
      "tokens": 5000,
      "calls": 15
    },
    {
      "timestamp": "2026-05-16T13:00:00.000Z",
      "tokens": 7500,
      "calls": 22
    }
  ],
  "timeframe": "hourly",
  "summary": {
    "totalTokens": 12500,
    "totalCalls": 37,
    "bucketsCount": 2
  }
}
```

---

### Recommendations

**GET `/api/recommendations`**

Get model-switch recommendations based on historical efficiency.

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "7f7b5cb0e3cb",
      "timestamp": "2026-05-16T14:30:00Z",
      "type": "model-switch",
      "current": "sonnet",
      "suggested": "haiku",
      "reason": "Haiku performs well on exploration tasks (avg 600 tokens vs 1000 for sonnet)",
      "potentialSavings": 400,
      "confidence": 0.87,
      "tasksSinceLastRec": 5
    }
  ],
  "summary": {
    "count": 1,
    "highConfidenceCount": 1
  }
}
```

---

**POST `/api/recommendations/:id/feedback`**

Record user feedback on a recommendation (accept or ignore).

**Body**:
```json
{
  "accepted": true
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Feedback recorded: accepted",
  "recommendationId": "7f7b5cb0e3cb",
  "feedback": {
    "recommendationId": "7f7b5cb0e3cb",
    "accepted": true,
    "timestamp": "2026-05-16T14:35:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request

Invalid parameters or malformed request.

```json
{
  "error": "Invalid timeframe. Use: hourly, daily, weekly"
}
```

### 404 Not Found

Endpoint doesn't exist.

```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error

Server encountered an error.

```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable

Backend is running but storage is inaccessible.

```json
{
  "status": "degraded",
  "message": "Storage not accessible"
}
```

---

## Data Structures

### Session
- `sessionId`: Unique session identifier
- `startedAt`: ISO 8601 timestamp when session began
- `project`: Current project name
- `totalTokens`: Total tokens consumed in session
- `totalCost`: Estimated cost in USD
- `modelBreakdown`: Per-model usage statistics
- `callCount`: Number of tool calls in session

### ModelBreakdown
- `calls`: Number of calls using this model
- `tokens`: Total tokens consumed by this model
- `cost`: Estimated cost for this model in USD

### Threshold
- `used`: Tokens used so far
- `capacity`: Total available tokens
- `percent`: Usage percentage (0-100)
- `level`: Alert level (ok, warning, critical)

### Recommendation
- `type`: Always "model-switch" currently
- `current`: Model currently being used
- `suggested`: Recommended model to switch to
- `reason`: Human-readable explanation
- `potentialSavings`: Estimated tokens that could be saved
- `confidence`: Confidence score (0.0-0.95)
- `tasksSinceLastRec`: Number of tasks analyzed for this recommendation

---

## Response Format

All successful responses follow this pattern:
```json
{
  "data": {...},
  "summary": {...},
  "alerts": [...]
}
```

Error responses:
```json
{
  "error": "error message"
}
```

---

## Caching

Aggregated stats are cached for 5 seconds to reduce disk I/O. This is transparent to clients.

---

## Rate Limiting

Currently no rate limiting. Subject to change in future versions.

---

## Version

API Version: 1.0
