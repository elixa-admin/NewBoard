# Token Usage Dashboard — Sprint Plan

> Historical note: this plan describes the original local backend sprint. Phase 1 has since shipped as a static Vercel-ready dashboard. Treat `README.md`, `DEPLOYMENT_SUMMARY.md`, and `MASTER_PROMPT.md` as the current source of truth for the next phase.

## Overview

This sprint executes the Token Usage Dashboard spec: a local-first React + Node.js app that monitors Claude Code token consumption, alerts at 65/75/90% session limits, recommends model switches, and learns from historical patterns.

**Key Dependencies**: Hook integration → storage → API → frontend. Recommendation engine can start in parallel with API.

**Acceptance for Sprint**: Dashboard runs on localhost:3000, reads live token data from Claude Code hook, displays all required views (overview, model breakdown, recommendations), and alerts correctly at thresholds.

---

## Task 1: Project Setup & Initialize Git Repo

**Goal**: Bootstrap Node.js + React project with TypeScript, dev environment, and git tracking.

**Context**: Currently in empty `/Users/brandondienar/Documents/Codex/Projects/NewBoard/`. Need a clean, opinionated structure for backend (Node) and frontend (React) to coexist.

**Relevant Files**:
- (none yet—creating from scratch)

**Proposed Approach**:
1. Initialize git repo
2. Create root `package.json` with workspaces for `packages/backend` and `packages/frontend`
3. Set up `packages/backend` as Node.js/Express + TypeScript
4. Set up `packages/frontend` as Vite + React 18 + TypeScript
5. Create `.gitignore`, `.env.example`
6. Add root-level npm scripts for `dev`, `build`, `test`

**Acceptance Criteria**:
- `git init` succeeds; `.git/` exists
- Root `package.json` with workspace config; both `packages/backend` and `packages/frontend` have their own `package.json`
- `npm install` succeeds in both packages
- `npm run dev` starts both backend (http://localhost:5000) and frontend (http://localhost:3000) concurrently
- TypeScript compiles without errors in both packages
- Project structure is: `NewBoard/packages/{backend,frontend}/src/`, with `docs/` at root

**Source Reference**: Spec § Design > Architecture

**Verify**:
```bash
cd /Users/brandondienar/Documents/Codex/Projects/NewBoard
npm install
npm run dev
# Both servers start; no TypeScript errors
```

**Out of Scope**: CI/CD, Docker, deployment. Local dev only for now.

---

## Task 2: Implement Local Token Storage Schema & Append Logic

**Goal**: Create `~/.claude/token-usage.json` schema and Node.js utilities to read/write token data safely.

**Context**: Hook will append token logs; backend needs to safely read, aggregate, and serve this data. Storage must be idempotent and handle concurrent writes (multiple Claude Code sessions).

**Relevant Files**:
- `packages/backend/src/storage/tokenStorage.ts` (new)
- `docs/token-usage-dashboard/spec.md` § Design > Data Schema

**Proposed Approach**:
1. Define TypeScript types matching spec schema (Session, Sprint, Recommendation, etc.)
2. Create `tokenStorage.ts` with methods:
   - `initializeStorage()` → Creates `~/.claude/token-usage.json` if missing
   - `appendTokenCall(call)` → Appends to `calls[]` array in current session, thread-safe
   - `getCurrentSession()` → Returns active session object
   - `aggregateByModel()` → Sums tokens by model for current session
   - `getSprintStats(sprintDate)` → Returns sprint-level aggregates
   - `computeThresholds()` → Returns {current%, limit, warning} for session/weekly
3. Handle edge cases: missing file, corrupted JSON, missing fields (graceful defaults)

**Acceptance Criteria**:
- `token-usage.json` is created in `~/.claude/` on first call
- Appending 10 sample token calls preserves all data and aggregates correctly
- `aggregateByModel()` returns correct per-model totals
- Calling `appendTokenCall()` from two concurrent processes doesn't corrupt file (test with file locking or atomic writes)
- Session tracking: new session created automatically if current one exceeds 5 hours

**Source Reference**: Spec § Design > Data Schema & Data Flow

**Verify**:
```bash
# Unit tests in packages/backend/src/storage/__tests__/tokenStorage.test.ts
npm run test -w backend -- tokenStorage
# All append, aggregate, and concurrent-write tests pass
```

**Out of Scope**: Cloud backup, syncing across devices. Local file only.

---

## Task 3: Implement Claude Code Hook Script

**Goal**: Create hook script that logs token usage to `~/.claude/token-usage.json` after each Claude Code tool call.

**Context**: Claude Code's `settings.json` supports hooks that fire after tool completion. Hook must capture model, tokens, tool name, timestamp, and infer task type.

**Relevant Files**:
- `~/.claude/scripts/log-token-usage.sh` (new; user's machine)
- `docs/token-usage-dashboard/spec.md` § Design > Hook Integration

**Proposed Approach**:
1. Create bash script that reads hook environment variables (model, tokens, tool name from Claude Code)
2. Parse variables into JSON format matching schema
3. Classify task type: read/grep/find/search → exploration; test/commit/deploy → critical
4. Append to `~/.claude/token-usage.json` using Node.js helper
5. Document setup: users add hook reference to `.claude/settings.json`

**Acceptance Criteria**:
- Hook script exists at `~/.claude/scripts/log-token-usage.sh`
- When manually invoked with sample env vars (MODEL=sonnet, TOKENS=500, TOOL=read), appends correct JSON to storage
- Task classification correctly labels exploration vs critical work
- No errors if storage file doesn't exist (creates it)
- Handles model names: haiku, sonnet, opus (case-insensitive)

**Source Reference**: Spec § Design > Hook Integration

**Verify**:
```bash
# Simulate hook call
export MODEL=sonnet TOKEN_COUNT=500 TOOL_NAME=read
~/.claude/scripts/log-token-usage.sh
# Check ~/.claude/token-usage.json has new entry with correct fields
```

**Out of Scope**: GUI for settings.json editing; users configure manually. Windows support (bash only for now).

---

## Task 4: Build Node.js Backend API Endpoints

**Goal**: Create Express API that serves token stats, aggregates, recommendations, and limits.

**Context**: Dashboard will fetch data every 30 seconds. API must read from local storage, compute aggregates, run recommendation logic, and respond quickly without wasting tokens.

**Relevant Files**:
- `packages/backend/src/server.ts` (Express app)
- `packages/backend/src/routes/stats.ts` (new)
- `packages/backend/src/routes/recommendations.ts` (new)
- `docs/token-usage-dashboard/spec.md` § Design > API Endpoints

**Proposed Approach**:
1. Create Express server on port 5000
2. Implement endpoints:
   - `GET /api/session/current` → Current session stats (tokens, models, alerts)
   - `GET /api/stats/models` → Model breakdown across all sessions
   - `GET /api/stats/projects` → Project-level aggregates
   - `GET /api/stats/trends/:timeframe` → Usage trends (hourly/daily/weekly)
   - `GET /api/recommendations` → Active model-switch recommendations
   - `POST /api/recommendations/:id/feedback` → User feedback on recommendations (for learning)
   - `GET /api/health` → Check if storage is readable
3. Cache aggregates for 30 seconds (don't recompute on every request)
4. Return structured JSON with `{data, alerts, recommendations}`

**Acceptance Criteria**:
- All 7 endpoints respond with 200 OK
- `GET /api/session/current` includes `{tokens, limit, alertLevel, projects}`
- Model breakdown sums correctly to session total
- Trends endpoint returns time-bucketed data (hourly, daily, weekly)
- Recommendations endpoint returns list with `{type, current, suggested, reason, confidence, tasksSinceLastRec}`
- POST feedback endpoint updates storage for learning
- `/api/health` returns 200 if storage readable, 503 if not

**Source Reference**: Spec § Design > API Endpoints

**Verify**:
```bash
npm run dev -w backend
curl http://localhost:5000/api/session/current | jq .
curl http://localhost:5000/api/stats/models | jq .
curl http://localhost:5000/api/recommendations | jq .
# All return expected JSON structures
```

**Out of Scope**: Authentication, rate limiting, request validation (MVP). Production hardening comes later.

---

## Task 5: Implement Recommendation Engine

**Goal**: Create logic that suggests model switches based on task type and historical efficiency.

**Context**: Recommendations are the core value-add. Engine must classify tasks (exploration vs critical), compare per-model efficiency, and surface confidence scores.

**Relevant Files**:
- `packages/backend/src/recommendations/engine.ts` (new)
- `packages/backend/src/recommendations/taskClassifier.ts` (new)
- `docs/token-usage-dashboard/spec.md` § Design > Recommendation Engine

**Proposed Approach**:
1. **Task Classifier**:
   - Input: tool name (read, grep, find, search, test, commit, deploy)
   - Output: "exploration" or "critical"
   - Rule-based: exploration = {read, grep, find, search}; critical = {test, commit, deploy}

2. **Efficiency Comparator**:
   - For each task type, compare avg tokens per model
   - If Haiku achieves 80%+ of Sonnet's quality on exploration, recommend Haiku
   - Calculate confidence as: `1.0 - (sample_variance / mean_tokens)` capped at 0.95

3. **Recommendation Generator**:
   - Analyze last N tasks; group by type
   - For each type, check if alternative model is more efficient
   - Generate recommendation with reason, potential savings, confidence

4. **Learning**:
   - Store user feedback (accept/ignore) for recommendations
   - Boost confidence on future similar recommendations if accepted

**Acceptance Criteria**:
- `classifyTask("read")` returns "exploration"
- `classifyTask("test")` returns "critical"
- For sample data: Haiku used 600 tokens, Sonnet used 1000 on same exploration task → recommend Haiku with savings estimate
- Confidence scores range 0.0–0.95
- Recommendations include reason text: "Haiku achieves X% quality at Y% cost"
- Feedback endpoint updates storage; subsequent recommendations reflect feedback history

**Source Reference**: Spec § Design > Recommendation Engine

**Verify**:
```bash
# Unit tests in packages/backend/src/recommendations/__tests__/
npm run test -w backend -- recommendations
# Task classification, efficiency comparison, and confidence scoring tests pass
# Sample data generates sensible recommendations
```

**Out of Scope**: ML-based classifiers, complex preference learning. Rule-based MVP.

---

## Task 6: Build React Dashboard UI Components

**Goal**: Create React components for overview, model breakdown, project list, recommendations, and alerts.

**Context**: Dashboard is the user-facing interface. Must display data clearly, update every 30 seconds, and highlight critical alerts.

**Relevant Files**:
- `packages/frontend/src/components/Overview.tsx` (new)
- `packages/frontend/src/components/ModelComparison.tsx` (new)
- `packages/frontend/src/components/ProjectBreakdown.tsx` (new)
- `packages/frontend/src/components/RecommendationsPanel.tsx` (new)
- `packages/frontend/src/components/AlertBanner.tsx` (new)
- `packages/frontend/src/pages/Dashboard.tsx` (new)
- `packages/frontend/src/hooks/useTokenData.ts` (new; fetches from API)
- `docs/token-usage-dashboard/spec.md` § Design > Components & Views

**Proposed Approach**:
1. Create `useTokenData()` hook that fetches `/api/session/current` every 30 seconds
2. Build components:
   - **AlertBanner**: Shows session % usage, alert level (green/yellow/red), human-readable warning
   - **Overview**: Gauges for session (18K/44K) and weekly usage
   - **ModelComparison**: Table + bar chart of tokens by model
   - **ProjectBreakdown**: List of active projects with trend sparklines
   - **RecommendationsPanel**: Card with recommendation headline, reasoning, action button
   - **TrendChart**: Line chart of tokens over 7 days
3. Add loading states, error boundaries, no-data states
4. Style with Tailwind CSS (included with Vite React template)

**Acceptance Criteria**:
- Dashboard page loads without errors
- Overview shows correct session usage (%) and weekly usage (%)
- AlertBanner displays alert at 65%, 75%, 90% with appropriate color/message
- ModelComparison table shows Haiku, Sonnet, Opus with call count and tokens
- ProjectBreakdown lists active projects; clicking one shows details
- RecommendationsPanel displays recommendation with reason and confidence score
- TrendChart renders sample data correctly
- All components fetch fresh data on page load and every 30 seconds (no manual refresh needed)
- Error state: if API is down, shows "Dashboard offline; check server" message

**Source Reference**: Spec § Design > Components & Views

**Verify**:
```bash
npm run dev -w frontend
# Open http://localhost:3000 in browser
# Dashboard loads, displays sample data correctly
# Alert color changes at thresholds
# Recommendations appear with confidence scores
```

**Out of Scope**: Mobile responsiveness (desktop-first MVP). Dark mode, theming.

---

## Task 7: Integration Testing & Verification

**Goal**: Test full data flow: hook → storage → API → frontend.

**Context**: Must verify end-to-end: token data flows from hook to dashboard display without loss or corruption.

**Relevant Files**:
- `packages/backend/src/__tests__/integration.test.ts` (new)
- `docs/token-usage-dashboard/spec.md` § Testing Strategy

**Proposed Approach**:
1. **Storage Integration Tests**:
   - Write sample data to `~/.claude/token-usage.json`
   - Verify API reads and aggregates correctly
   - Test threshold calculations (65%, 75%, 90%)

2. **API Integration Tests**:
   - Start backend server
   - POST sample token calls via internal test method
   - Fetch `/api/session/current` and verify response shape
   - Verify alerts are present at thresholds

3. **E2E Tests** (manual):
   - Manually set Claude Code hook to log-token-usage.sh
   - Run real Claude Code task (e.g., read a file)
   - Check dashboard displays new token data within 30 seconds
   - Verify model breakdown matches actual usage

**Acceptance Criteria**:
- All integration tests pass
- Sample data with 100 token calls aggregates correctly
- API responds in <500ms for all endpoints
- Thresholds trigger alerts at exactly 65%, 75%, 90% of 44K
- E2E test: real task appears on dashboard within 1 minute

**Source Reference**: Spec § Testing Strategy & Invariants

**Verify**:
```bash
npm run test -w backend -- integration
npm run test -w frontend

# Manual E2E:
# 1. Configure ~/.claude/settings.json with hook
# 2. Run Claude Code task (read command)
# 3. Check http://localhost:3000 for new data
```

**Out of Scope**: Load testing, stress testing. Happy-path coverage only.

---

## Task 8: Documentation & Setup Guide

**Goal**: Write clear setup instructions and architecture overview for future maintenance.

**Context**: Spec is detailed, but users and future maintainers need quick onboarding.

**Relevant Files**:
- `docs/token-usage-dashboard/SETUP.md` (new)
- `docs/token-usage-dashboard/ARCHITECTURE.md` (new)
- `README.md` at project root (update)

**Proposed Approach**:
1. **SETUP.md**:
   - Prerequisites (Node 18+, git)
   - Clone/init repo, install dependencies
   - Configure Claude Code hook (copy script, edit settings.json)
   - Start dev servers (`npm run dev`)
   - Verify dashboard loads

2. **ARCHITECTURE.md**:
   - Diagram of data flow (hook → storage → API → frontend)
   - File structure explanation
   - Key design decisions recap (hook-based collection, local storage)
   - How to extend (adding new endpoints, new recommendation types)

3. **README.md**:
   - One-paragraph summary
   - Quick start (3 commands)
   - Link to SETUP.md for details

**Acceptance Criteria**:
- SETUP.md is complete; someone unfamiliar with the project can follow it
- ARCHITECTURE.md explains data flow, file structure, and extension points
- README.md has quick start and links to deeper docs
- All code has JSDoc comments on public functions
- No broken links in docs

**Source Reference**: Spec (full document)

**Verify**:
```bash
# Follow SETUP.md from scratch; verify dashboard runs
# Read ARCHITECTURE.md; verify it explains the system clearly
```

**Out of Scope**: API documentation (OpenAPI/Swagger). User manual; focused on developer docs.

---

## Summary: Task Order & Dependencies

| # | Task | Depends On | Estimated Effort |
|---|------|-----------|------------------|
| 1 | Project Setup | — | 1h |
| 2 | Storage Schema | Task 1 | 2h |
| 3 | Hook Script | Task 2 | 1.5h |
| 4 | Backend API | Task 2 | 3h |
| 5 | Recommendation Engine | Task 4 | 2h |
| 6 | Dashboard UI | Task 4 | 4h |
| 7 | Integration Tests | Tasks 4, 6 | 2h |
| 8 | Documentation | All | 1.5h |

**Total Estimate**: ~17 hours (assumes 1 developer or parallel teams)

**Parallelization Opportunity**: Tasks 5 (recommendation engine) and 6 (frontend) can run in parallel after Task 4 (API) is done.

---

## Definition of Done

Sprint is complete when:

1. ✅ Git repo initialized; both packages (backend, frontend) install and build without errors
2. ✅ Hook script logs sample token calls to `~/.claude/token-usage.json`
3. ✅ API endpoints all respond with correct data structures
4. ✅ Recommendation engine generates sensible suggestions with confidence scores
5. ✅ Dashboard displays overview, model comparison, projects, recommendations, and alerts
6. ✅ Alerts trigger at 65%, 75%, 90% thresholds with correct color and messaging
7. ✅ Integration tests pass (storage, API, aggregation)
8. ✅ Real Claude Code task data appears on dashboard within 1 minute of execution
9. ✅ SETUP.md and ARCHITECTURE.md are complete and clear
10. ✅ All public functions have JSDoc comments

---

## Rollback Plan

If implementation derails:

- **Stop at Task 3**: Have working hook logging and storage. Keep exploring locally without dashboard.
- **Stop at Task 4**: Have working API; use curl to explore data instead of dashboard.
- **Stop at Task 6**: Have API + tests; use curl CLI or Postman instead of web dashboard.

No breaking changes in earlier tasks; each builds incrementally.
