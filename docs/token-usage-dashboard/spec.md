# Token Usage Dashboard Spec

## What

A local-first web dashboard that monitors Claude Code token consumption across sessions, projects, and models. It displays real-time usage against Pro Plan limits (44K tokens/5-hour window, weekly rolling cap), alerts at 65/75/90% thresholds, tracks spending per model (Haiku vs Sonnet vs Opus), learns from historical patterns per sprint, and recommends model switches based on task type (exploration vs critical work) to optimize credit usage and prevent overage.

## Context

Claude Code Pro Plan users share a token pool across claude.ai, Claude Code, and Claude Desktop. Without visibility into per-session and per-project consumption patterns, users risk hitting limits unexpectedly or overspending on high-cost models. Current Claude Code provides raw usage stats but no:
- Per-project token breakdown
- Historical learning to identify spending trends
- Smart model recommendations based on task context
- Proactive warnings before hitting limits
- Granular tracking of exploration vs production work

This dashboard solves that by providing actionable intelligence on token spend in human-interpretable language with supporting data.

## Requirements

1. **Real-time Token Tracking**: Capture tokens consumed per tool call, aggregated by session, project, and model.
2. **Historical Learning**: Store token usage patterns per sprint to identify trends and forecast usage.
3. **Multi-timeframe Dashboards**: Display usage for current session (5-hour window), per-hour, per-4-hours, per-24-hours, and per-7-days.
4. **Model Comparison**: Show token cost breakdown by model (Haiku, Sonnet, Opus) with per-model efficiency metrics.
5. **Tiered Alerts**: Warn at 65%, 75%, 90% of session and weekly limits with human-readable messaging.
6. **Smart Recommendations**: Suggest model switches based on:
   - Task classification (exploration: prefer Haiku; critical: Sonnet/Opus)
   - Historical efficiency: "Sonnet used 3x more tokens than Haiku for similar tasks"
   - Cost-benefit: "Switching to Haiku would save ~500 tokens on this type of work"
7. **Project & Sprint Tracking**: Link token usage to active projects (sessions) and sprints for contextual analysis.
8. **Local-First Storage**: All data persists locally; no external services required.

## Design

### Architecture

```
Claude Code                Claude Code Token Dashboard
┌─────────────────┐       ┌──────────────────────────┐
│ Session/Tasks   │       │   React Web Dashboard    │
│                 │       │  (localhost:3000)        │
│ Hook triggers   │       │                          │
│ on tool call    ├──────►│  • Overview              │
└─────────────────┘       │  • Usage by model        │
         │                │  • Project breakdown     │
         │                │  • Recommendations       │
         │                │  • Alert system          │
         │                └──────────────────────────┘
         │                           ▲
         │                           │
    Writes to            Reads from & serves
  ~/.claude/              API (Node backend)
  token-usage.json              │
         │                       │
         └──────────────────────┘
         Local File Storage
         (token-usage.json)
```

### Data Flow

1. **Collection**: Claude Code hook (in settings.json) logs after each tool call:
   - Timestamp
   - Model used
   - Tokens consumed (input + output)
   - Tool name / task type (inferred from context)
   - Session ID
   - Project/branch name

2. **Storage**: Hook writes to `~/.claude/token-usage.json` (append-only log + aggregated stats).

3. **API**: Node.js backend reads the local file, computes aggregates, runs recommendation engine, serves to dashboard.

4. **Dashboard**: React app fetches data on page load and every 30 seconds (configurable). Displays current state + historical trends.

### Data Schema

```json
{
  "meta": {
    "version": "1.0",
    "lastUpdated": "2026-05-16T14:30:00Z",
    "storageVersion": 1
  },
  "sessions": {
    "session-uuid": {
      "id": "session-uuid",
      "startedAt": "2026-05-16T10:00:00Z",
      "project": "NewBoard",
      "sprint": "2026-05-16",
      "activeProject": true,
      "totalTokens": 12500,
      "totalCost": 0.05,
      "calls": [
        {
          "timestamp": "2026-05-16T10:05:00Z",
          "model": "haiku",
          "inputTokens": 150,
          "outputTokens": 200,
          "totalTokens": 350,
          "tool": "read",
          "taskType": "exploration",
          "skillsUsed": ["read"],
          "branchName": "feature/token-dashboard"
        }
      ],
      "modelBreakdown": {
        "haiku": { "calls": 45, "tokens": 5200, "cost": 0.008 },
        "sonnet": { "calls": 12, "tokens": 6800, "cost": 0.034 },
        "opus": { "calls": 2, "tokens": 500, "cost": 0.008 }
      }
    }
  },
  "sprints": {
    "2026-05-16": {
      "sprint": "2026-05-16",
      "totalTokens": 45000,
      "sessions": ["session-uuid-1", "session-uuid-2"],
      "modelBreakdown": { "haiku": 15000, "sonnet": 25000, "opus": 5000 },
      "taskBreakdown": { "exploration": 20000, "critical": 25000 },
      "averageSessionLength": 4.5,
      "costPerHour": 0.75
    }
  },
  "limits": {
    "session": {
      "window": 18000,
      "capacity": 44000,
      "resetIn": 3600
    },
    "weekly": {
      "used": 120000,
      "capacity": 800000,
      "resetIn": 345600
    }
  },
  "recommendations": [
    {
      "timestamp": "2026-05-16T14:30:00Z",
      "type": "model-switch",
      "current": "sonnet",
      "suggested": "haiku",
      "reason": "exploration task detected; Haiku achieves 95% quality at 60% cost",
      "potentialSavings": 450,
      "confidence": 0.87,
      "tasksSinceLastRec": 3
    }
  ]
}
```

### Components & Views

#### 1. Dashboard Overview
- **Gauges/Progress Bars**:
  - Session usage: "18K / 44K (41%)" with visual indicator
  - Weekly usage: "120K / 800K (15%)"
  - Cost gauge: "~$2.45 this week"
  
- **Alert Banner** (sticky):
  - Shows current status in human language: "You're at 41% of your session budget. Keep working; no restrictions yet."
  - Changes to "Approaching limit (75%)" in yellow, "Critical (90%)" in red.

#### 2. Model Comparison Card
- **Table**: Model, # Calls, Total Tokens, Avg Cost/Call, Efficiency Score
- **Visual**: Horizontal bar chart showing token distribution by model
- **Insight Text**: "Sonnet dominates this sprint (55% of tokens) but Haiku performs comparably on exploratory tasks."

#### 3. Project Breakdown
- **List**: Each active project → total tokens, # sessions, avg session cost
- **Trend**: Spark line showing usage over last 7 days
- **Comparison**: "This project averages 8K tokens/session; your overall average is 6.5K"

#### 4. Recommendations Panel
- **Active Recommendation Card** (dismissible):
  - Icon + headline: "💡 Switch to Haiku for exploratory work"
  - Explanation: "Your last 5 exploratory tasks averaged 1,200 tokens on Sonnet. Haiku handled similar tasks in 650 tokens with no quality loss."
  - Action: "Use Haiku next session" (button, tracked for learning)
  - Confidence badge: "87% confidence"

#### 5. Historical Trends
- **Line Charts**:
  - Tokens over past 7 days (by hour, aggregated)
  - Cost trend over past 4 weeks
  - Model usage distribution over time

#### 6. Alerts & Warnings
- **Threshold alerts**:
  - 65%: "You're 2/3 of the way through your session budget. Plan wind-down."
  - 75%: "You've used 3/4 of your session allowance. Consider switching to lighter tasks."
  - 90%: "Critical: You're near your limit. New tool calls may fail. Pause and wait for reset, or use a fresh session."

### API Endpoints

```
GET  /api/session/current        → Current session stats + alerts
GET  /api/session/:id             → Specific session details
GET  /api/stats/models            → Model breakdown across all sessions
GET  /api/stats/projects          → Project-level aggregates
GET  /api/stats/trends/:timeframe → Usage trends (hourly, daily, weekly)
GET  /api/recommendations         → Active recommendations + reasoning
POST /api/recommendations/:id/feedback → User feedback on recommendation
GET  /api/health                  → Check if dashboard can read token data
```

### Hook Integration (Claude Code side)

In `.claude/settings.json`, add:
```json
{
  "hooks": {
    "onToolUseCompletion": "~/.claude/scripts/log-token-usage.sh"
  }
}
```

The hook script logs to `~/.claude/token-usage.json` with:
- Timestamp, model, tokens, tool name, task type (inferred), session ID, branch name

### Recommendation Engine

**Task Classification**:
- **Exploration**: Find, read, grep, web search, initial design phases → prefer Haiku
- **Critical**: Test runs, commits, deploy checks, final code review → prefer Sonnet/Opus

**Recommendation Logic**:
1. Analyze last N task pairs (similar types on different models)
2. Compare token efficiency: `(tokens_model_a / tokens_model_b) * confidence_score`
3. If Haiku achieves 80%+ quality/efficiency on exploration, suggest switch with confidence score
4. Track user feedback to tune recommendations over time

**Learning**: Store model-choice feedback to improve future recommendations. E.g., if user always accepts "switch to Haiku for exploration," boost confidence on similar recommendations.

## Decisions

### 1. Local-First Storage vs Cloud Sync
**Choice**: Store all data locally in `~/.claude/token-usage.json`; no cloud backend.
- **Alternatives**: Cloud database (Supabase, Firebase), sync to GitHub, encrypted API
- **Why**: Simplicity, privacy, zero external dependencies. All data stays on your machine.
- **Reversible**: Yes—can add cloud sync later without changing local format.

### 2. Hook-Based Collection vs File Monitoring
**Choice**: Use Claude Code hook system to explicitly log token usage after each tool call.
- **Alternatives**: Monitor Claude Code's internal cache files, parse CLI output, reverse-engineer from memory files
- **Why**: Hook system is part of Claude Code's official settings contract; no guessing or fragility. Single source of truth.
- **Reversible**: Yes—can switch to file monitoring if hooks become unavailable.

### 3. Model Efficiency Metrics
**Choice**: Use historical token ratio + task type classification to recommend switches.
- **Alternatives**: Fixed rules ("always use Haiku for exploration"), ML model trained on usage data, simple cost comparison
- **Why**: Balances simplicity (no external ML) with personalization (learns your patterns). Transparent logic = human-interpretable recommendations.
- **Reversible**: Yes—can swap recommendation engine without changing data storage.

### 4. Refresh Cadence
**Choice**: Dashboard refreshes every 30 seconds; users can force refresh.
- **Alternatives**: Real-time WebSocket (token waste), on-demand fetch, fixed 5-minute refresh
- **Why**: 30s balances freshness with token efficiency. Doesn't hammer the API during idle periods.
- **Reversible**: Yes—configurable in dashboard settings.

### 5. Alert Thresholds
**Choice**: 65%, 75%, 90% warnings based on Pro Plan 44K/5-hour session limit.
- **Alternatives**: Fixed token amounts (e.g., "warn at 28K tokens"), rolling averages, per-model thresholds
- **Why**: Percentage-based adapts to future limit changes. Three tiers allow graceful degradation.
- **Reversible**: Yes—thresholds configurable per user.

**Assumption**: Pro Plan limits remain 44K/session and weekly rolling cap. If Anthropic changes limits, update the config.

### 6. Task Type Classification
**Choice**: Infer from tool name (read, grep, find → exploration; commit, test → critical).
- **Alternatives**: User tags each task, ML classifier on task description, explicit annotations
- **Why**: Zero friction—automatic inference requires no user input. Tool name is a reliable signal.
- **Reversible**: Yes—can add user tagging or ML classifier if tool-name signals prove insufficient.

## Versions

- **Node.js**: 18 LTS or later (for stable async/file handling)
- **React**: 18.x (current stable as of May 2026)
- **TypeScript**: 5.x
- **Vite**: 5.x (for fast local dev builds)

## Invariants

1. **Data Integrity**: `token-usage.json` is append-only for calls; aggregates can be recomputed. No data loss on crash.
2. **Limit Accuracy**: Session usage must never exceed 44K reported tokens without alerting at 90%.
3. **Historical Correctness**: Sprint aggregates must match sum of session data for that sprint.
4. **Recommendation Consistency**: Same input (model, task type, history) always generates same recommendation.

**How to check**:
- Unit tests verify hook format matches schema
- Integration test: write sample data, verify dashboard computes correct totals
- E2E test: simulate session with multiple tools, check alerts fire at right thresholds
- Recommendation tests: verify logic is deterministic

## Error Behavior

| Failure | Behavior | Recovery |
|---------|----------|----------|
| Hook fails to log | User session continues; token data is lost for that call | Next successful call resumes logging. Alert: "Missed N token updates" |
| `token-usage.json` corrupted | Dashboard shows last valid state; new calls append to file | User can manually edit JSON or delete and start fresh next session |
| API server crashes | Dashboard shows stale data; no refresh works | User restarts server. Link to troubleshooting docs. |
| Claude Code API changes limits | Alerts use stale thresholds | Dashboard auto-checks official limits weekly; alerts user if mismatch detected |
| Model name in hook doesn't match DB | Unknown model appears in breakdown | Gracefully group as "other"; log warning; don't crash |

**User-Facing Errors**:
- "Can't read token data. Check ~/.claude/token-usage.json exists and is readable."
- "Dashboard out of sync. Refresh in 30 seconds or restart the server."

## Testing Strategy

1. **Unit Tests**:
   - Hook log parser: validate JSON schema, handle malformed entries
   - Recommendation engine: check model-switch logic, confidence scores, task classification
   - Threshold calculation: verify 65/75/90% alerts trigger at correct percentages

2. **Integration Tests**:
   - Write sample `token-usage.json` → verify API aggregates correctly
   - Simulate 5-hour session with multiple models → check final totals, alerts, recommendations

3. **E2E Tests**:
   - Start dashboard, run Claude Code with hook enabled
   - Perform exploration task (read, grep) and critical task (test run)
   - Verify recommendations appear for model switch
   - Confirm alerts fire at 65%, 75%, 90%

4. **Manual Testing**:
   - Real session with Haiku, Sonnet, Opus → visual inspection of model breakdown
   - Verify historical trends appear after multiple sessions
   - Test alert messaging at each threshold (65%, 75%, 90%)

## Out of Scope

- **Cloud Sync**: No backup or cloud persistence; local-only for now.
- **Billing Integration**: No direct integration with Anthropic's billing API; estimates only.
- **Per-Tool Cost**: No tracking of individual tool cost; only model cost aggregates.
- **Scheduled Alerts**: No email/Slack notifications; dashboard alerts only.
- **Model Fine-Tuning**: No support for fine-tuned models; standard models only (Haiku, Sonnet, Opus).
- **Multi-User**: Single-user dashboard; no sharing or team features.
- **Custom Limits**: Hard-coded Pro Plan limits; no support for different plans (yet).
