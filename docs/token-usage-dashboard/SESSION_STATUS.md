# Token Usage Dashboard — Session Status & Handoff

**Date**: May 16, 2026  
**Status**: 60% Complete — UI Rendering Blocked  
**Context**: Sprint Tasks 1-4 complete, Tasks 5-6 code written but not displaying, Tasks 7-8 pending

---

## What's Working ✅

### Backend (Port 4201)
- **Express.js server** running on `http://localhost:4201`
- **Storage system** (`~/.claude/token-usage.json`) functional with atomic writes and caching
- **API endpoints** all operational:
  - `GET /api/health` — Storage accessibility check
  - `GET /api/session/current` — Current session stats with thresholds and alerts
  - `GET /api/stats/models` — Model breakdown (Haiku, Sonnet, Opus)
  - `GET /api/stats/projects` — Project aggregates
  - `GET /api/stats/trends/:timeframe` — Hourly/daily/weekly trends
  - `GET /api/recommendations` — Model-switch recommendations with confidence scores
  - `POST /api/recommendations/:id/feedback` — Feedback recording
- **Recommendation engine** fully implemented with task classification and efficiency analysis
- **Unit tests** passing for storage, stats, and recommendations
- **Hook script** (`~/.claude/scripts/log-token-usage.sh`) ready for Claude Code integration
- **CLI helper** for token logging with environment variable parsing

### Frontend (Port 4200)
- **React components created** and TypeScript-valid:
  - `AlertBanner.tsx` — Alert display with color coding (green/yellow/red for ok/warning/critical)
  - `Overview.tsx` — Session and weekly usage gauges, session info cards
  - `ModelComparison.tsx` — Model breakdown with token bars and percentages
  - `RecommendationsPanel.tsx` — Recommendation cards with confidence and savings
  - `Dashboard.tsx` — Main page layout and data orchestration
- **Custom hook** (`useTokenData.ts`) — Fetches from API every 30 seconds
- **Tailwind CSS** configured with postcss and autoprefixer
- **Vite config** with API proxy to backend (`/api` → `http://localhost:4201`)
- **Dependencies installed** (React, Tailwind, Vite, TypeScript)

### Documentation
- **API_REFERENCE.md** — Complete endpoint specs with request/response examples
- **spec.md** — Full technical specification with design decisions
- **plan.md** — 8-task sprint plan with acceptance criteria
- **HOOK_SETUP.md** — User setup guide for Claude Code integration

---

## What's Broken ❌

### Frontend Rendering Issue
**Problem**: Vite dev server starts (port 4200) but serves blank/black page. No console errors visible.

**Symptoms**:
- `npm run dev -w packages/frontend` starts without errors
- Browser shows "Awaiting server" briefly, then black screen
- No React errors in console
- No Vite compilation errors logged
- `curl http://localhost:4200/` returns HTML but page doesn't render

**Investigation Done**:
- ✅ Verified dependencies installed (`npm install -w packages/frontend`)
- ✅ Confirmed Tailwind config files exist and are valid
- ✅ Checked that main.tsx imports App and CSS correctly
- ✅ Verified vite.config.ts has correct proxy and plugin setup
- ✅ Confirmed index.html has correct script tag and root div
- ✅ Checked that all component imports are TypeScript-valid

**Hypothesis**: 
- Vite server may be hanging during HMR (Hot Module Replacement) setup
- Possible issue with tsx/esbuild in preview environment
- May be environment-specific (similar to earlier tsx watch hanging issue)

---

## Project Structure

```
NewBoard/
├── .claude/
│   └── launch.json           # Dev server configuration
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── server.ts     # Express app (port 4201)
│   │   │   ├── storage/
│   │   │   │   ├── tokenStorage.ts         # Core storage logic
│   │   │   │   └── __tests__/tokenStorage.test.ts
│   │   │   ├── routes/
│   │   │   │   ├── stats.ts               # Session/stats endpoints
│   │   │   │   ├── recommendations.ts      # Recommendation engine
│   │   │   │   ├── __tests__/stats.test.ts
│   │   │   │   └── __tests__/recommendations.test.ts
│   │   │   ├── cli/
│   │   │   │   ├── logTokenUsage.ts       # CLI helper for hook
│   │   │   │   └── __tests__/logTokenUsage.test.ts
│   │   │   └── types.ts                   # TypeScript definitions
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── dist/                          # Compiled output
│   │
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx                   # React entry point
│       │   ├── App.tsx                    # Root component
│       │   ├── index.css                  # Tailwind imports
│       │   ├── hooks/
│       │   │   └── useTokenData.ts        # API data fetching hook
│       │   ├── components/
│       │   │   ├── AlertBanner.tsx        # Alert display
│       │   │   ├── Overview.tsx           # Gauges and session info
│       │   │   ├── ModelComparison.tsx    # Model breakdown
│       │   │   └── RecommendationsPanel.tsx # Recommendations
│       │   └── pages/
│       │       └── Dashboard.tsx          # Main dashboard page
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── package.json
│       ├── tsconfig.json
│       └── node_modules/                  # Installed
│
└── docs/
    └── token-usage-dashboard/
        ├── spec.md
        ├── plan.md
        ├── API_REFERENCE.md
        ├── HOOK_SETUP.md
        └── SESSION_STATUS.md              # This file
```

---

## Key Design Decisions

### Local-First Architecture
- Data stored in `~/.claude/token-usage.json` (not cloud)
- Hook runs on developer's machine and logs token calls
- Backend reads local file and serves aggregated data
- Frontend polls every 30 seconds (no WebSocket overhead)

### Monorepo Setup
- Root npm workspace with `packages/backend` and `packages/frontend`
- Shared TypeScript config but separate build outputs
- Scripts: `npm run dev`, `npm run build`, `npm run test` work across both
- Ports: Backend 4201, Frontend 4200 (uncommon to avoid conflicts)

### Alert Thresholds
- **OK** (0-65%): Green, no action needed
- **Warning** (65-90%): Yellow, user should consider lighter tasks
- **Critical** (90%+): Red, new tool calls may fail
- Thresholds based on Pro Plan: 44K tokens/session, 800K tokens/week

### Recommendation Engine
- Rule-based task classification (not ML)
- Exploration tasks: {read, grep, find, search, browse, open, list}
- Critical tasks: {test, commit, deploy, push, branch, execute, run}
- Confidence scoring: `min(0.95, 0.7 + sample_count * 0.05)`
- Only recommends when 2+ samples per model exist

---

## Known Issues & Blockers

### 1. Frontend Vite Server Not Rendering
**Severity**: High (blocks visual verification)  
**Impact**: Cannot see dashboard even though code is written  
**Root Cause**: Unknown — Vite starts but doesn't serve page content  
**Workaround**: None yet

**Why This Matters**:
- Task 6 acceptance criteria require dashboard to display data
- Task 7 integration tests need visual verification
- Cannot validate UI against mock data without rendering

### 2. Port Blocking / Environment Sensitivity
**Severity**: Medium  
**Pattern**: Previous tsx watch processes hung, preview tools had startup delays  
**Root Cause**: Environment (possibly npm/node version, esbuild caching, or shell-specific)  
**Current Fix**: Using preview_start instead of direct bash npm calls

### 3. Hanging Node.js Processes
**Severity**: Medium  
**Pattern**: `tsx watch src/server.ts` hangs indefinitely, no output after initial line  
**Workaround**: Use preview_start tool which handles process lifecycle better

---

## What's Not Done

### Task 5: Recommendation Engine (80% done)
- ✅ Core logic implemented in `routes/recommendations.ts`
- ✅ Task classifier working (exploration vs critical)
- ✅ Efficiency analysis and confidence scoring complete
- ✅ Tests passing
- ❌ Feedback loop learning not wired to frontend
- ❌ Historical feedback not persisted/analyzed

### Task 6: React Dashboard UI (90% done)
- ✅ All components created and TypeScript-valid
- ✅ useTokenData hook fetches from API
- ✅ Tailwind styling configured
- ✅ Responsive layout designed
- ❌ **Page doesn't render** (Vite issue)
- ❌ No visual validation

### Task 7: Integration Testing (0% done)
- Plan: End-to-end tests from hook → storage → API → frontend
- Blocked by: Frontend rendering issue
- Needs: Manual E2E test of real Claude Code hook

### Task 8: Documentation (50% done)
- ✅ API_REFERENCE.md complete
- ✅ HOOK_SETUP.md complete
- ❌ ARCHITECTURE.md not written
- ❌ README.md not updated
- ❌ Public function JSDoc comments incomplete

---

## Deployment Notes

### Local Development (Current)
```bash
# Terminal 1: Backend
npm run dev -w packages/backend
# Backend ready at http://localhost:4201

# Terminal 2: Frontend
npm run dev -w packages/frontend
# Frontend ready at http://localhost:4200 (but not rendering currently)
```

### Cloud Deployment (Future)
- **Backend**: Node.js server → Vercel or similar (serverless compatible)
- **Frontend**: Vite build output → Vercel, Netlify, or GitHub Pages
- **Storage**: Move from `~/.claude/token-usage.json` to cloud (e.g., Firestore, DynamoDB)
- **Hook**: Will need to POST to cloud API instead of local file
- **Plan**: Build cloud version after local UI is verified working

---

## Port Management Strategy

### Why Ports Matter
- Port 3000 often blocked by system services (macOS, Ubuntu)
- Port 5000 can conflict with Flask dev servers
- Port 8000 sometimes reserved
- Common ports lead to "address already in use" errors in team environments

### Current Solution
- **Frontend**: 4200 (uncommon)
- **Backend**: 4201 (uncommon)
- **Rationale**: Both in 4200 range, unlikely to conflict, easily memorable

### For Future Work
- [ ] Document port allocation strategy in project README
- [ ] Add checks in package.json scripts to verify ports are free before starting
- [ ] Create `.claude/settings.json` entry to auto-reserve ports
- [ ] Consider environment variable overrides: `BACKEND_PORT=4201 FRONTEND_PORT=4200`

---

## Testing Summary

### Backend Tests (Passing ✅)
```bash
npm run test -w packages/backend
```
- **tokenStorage.test.ts**: 15+ tests
  - Initialization, appending, aggregation
  - Threshold detection (65%, 75%, 90%)
  - Session management, data persistence
  
- **stats.test.ts**: 8+ tests
  - Session endpoint, model aggregation
  - Alert level detection at thresholds
  
- **recommendations.test.ts**: 4+ tests
  - Task classification (exploration vs critical)
  - Efficiency comparison, confidence scoring
  - Insufficient data handling

### Frontend Tests (Not Run)
- Components compile without errors
- No unit tests yet (Task 7)
- Visual tests blocked by rendering issue

---

## Master Handoff Checklist

Before moving to Codex, verify:
- [ ] Backend server starts and responds to health check
- [ ] API endpoints return correct JSON structures
- [ ] Recommendation engine runs without errors
- [ ] Hook script can be manually tested
- [ ] **Frontend rendering issue diagnosed** (critical blocker)
- [ ] Documentation reviewed for clarity

---

## Next Session Priorities

### P0 (Critical)
1. **Fix Vite rendering issue** — Debug why frontend page stays blank
   - Try minimal HTML test without React
   - Check Vite server logs more thoroughly
   - Consider switching to simpler dev approach (plain HTML/CSS first)
2. **Get dashboard visible** — Even with mock data, need to see UI

### P1 (High)
3. Complete Task 7: Integration testing with real API data
4. Complete Task 8: Finish documentation (ARCHITECTURE.md, README.md)
5. Manual E2E test: Set up hook in Claude Code, see data flow

### P2 (Medium)
6. Implement feedback loop learning (Task 5 completion)
7. Add more recommendation types beyond model-switch
8. Performance optimization (caching, bundling)

### P3 (Low)
9. Dark mode support
10. Mobile responsiveness
11. Cloud deployment planning

---

## Files Needing Review/Completion

```
✅ Completed
packages/backend/src/storage/tokenStorage.ts
packages/backend/src/routes/stats.ts
packages/backend/src/routes/recommendations.ts
packages/backend/src/cli/logTokenUsage.ts
packages/backend/src/server.ts
packages/backend/src/types.ts
packages/frontend/src/hooks/useTokenData.ts
packages/frontend/src/components/*.tsx
packages/frontend/src/pages/Dashboard.tsx
docs/token-usage-dashboard/spec.md
docs/token-usage-dashboard/plan.md
docs/token-usage-dashboard/API_REFERENCE.md
docs/token-usage-dashboard/HOOK_SETUP.md

❌ Needs Work
packages/frontend/src/App.tsx — Import path may need update
packages/frontend/vite.config.ts — Already correct
docs/token-usage-dashboard/ARCHITECTURE.md — Not written
README.md (project root) — Not written
```

---

## Environment Details

**Current Setup**:
- Node.js: Latest LTS
- npm: Latest
- TypeScript: 5.3.3
- React: 18.2.0
- Vite: 5.0.8
- Tailwind: 3.4.1

**Ports**:
- Backend: 4201 ✅
- Frontend: 4200 ❌ (starts but doesn't render)

---

## Recommended Approach for Next Session

1. **First**, diagnose the Vite issue:
   - Create a minimal test HTML file to serve through Vite
   - Check if issue is React-specific or Vite-wide
   - Review Vite server logs with verbose flag

2. **If Vite debugging stalls**, pivot to:
   - Build static HTML/CSS dashboard without React/Vite
   - Serve from `packages/frontend/public/` as static files
   - Once that works, incrementally add React

3. **Once UI renders**, complete Tasks 7-8:
   - Run integration tests
   - Verify data flows end-to-end
   - Write final documentation

4. **Then plan cloud deployment**:
   - Move to Vercel (backend as function, frontend as static)
   - Migrate storage to cloud service
   - Update hook to POST to cloud API
