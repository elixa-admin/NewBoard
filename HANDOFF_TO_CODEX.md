# Master Handoff Prompt — Token Usage Dashboard to Codex

**Generated**: May 16, 2026  
**Project**: NewBoard — Token Usage Dashboard for Claude Code  
**Status**: 60% complete, UI rendering blocked  
**Target**: Fix frontend rendering issue and complete Tasks 7-8

---

## Copy This Prompt to Codex

```
You are continuing work on the Token Usage Dashboard for Claude Code.

PROJECT LOCATION
/Users/brandondienar/Documents/Codex/Projects/NewBoard/

CURRENT STATUS
- Tasks 1-4: Complete (backend, storage, hook, API)
- Task 5-6: Code written, frontend not rendering
- Task 7-8: Not started (integration tests, docs)

CRITICAL BLOCKER
The frontend Vite dev server starts on port 4200 but serves a blank/black page. 
No console errors visible. React components compile without errors.
This must be fixed before proceeding to Task 7.

KEY FACTS
- Backend API running on port 4201, all endpoints working
- React components created (AlertBanner, Overview, ModelComparison, RecommendationsPanel, Dashboard)
- useTokenData hook fetches from /api/session/current every 30 seconds
- Tailwind CSS configured (now using custom CSS in index.css instead of PostCSS)
- All dependencies installed
- Main.tsx imports CSS correctly
- No TypeScript errors

WHAT TO DO
1. Diagnose why the frontend doesn't render
   - Check if issue is React/JSX specific or Vite-wide
   - Try minimal HTML test through Vite
   - Verify Vite server logs more carefully
   
2. If Vite debugging stalls (>30 mins), pivot to:
   - Build static HTML/CSS dashboard without React initially
   - Serve from packages/frontend/public/ as static files
   - Verify data display works with static HTML
   - Then incrementally add React layer
   
3. Once UI renders and displays data:
   - Run Task 7: Integration tests (hook → storage → API → frontend)
   - Complete Task 8: Documentation (ARCHITECTURE.md, README.md)
   - Manual E2E test with real Claude Code hook
   
HELPFUL FILES
- docs/token-usage-dashboard/SESSION_STATUS.md — Full context on what works/what's broken
- docs/token-usage-dashboard/spec.md — Design decisions and architecture
- docs/token-usage-dashboard/plan.md — Task breakdown with acceptance criteria
- docs/token-usage-dashboard/API_REFERENCE.md — All endpoints documented
- packages/backend/src/server.ts — Express setup
- packages/frontend/src/pages/Dashboard.tsx — Main dashboard page
- .claude/launch.json — Dev server configuration

ACCEPTANCE CRITERIA FOR THIS SESSION
- ✅ Frontend renders (even if with mock data)
- ✅ Components display correctly with Tailwind styles
- ✅ AlertBanner shows correct alert level and percentage
- ✅ Overview gauges display session/weekly usage
- ✅ ModelComparison shows token breakdown by model
- ✅ RecommendationsPanel displays recommendations with confidence
- ✅ Dashboard auto-refreshes every 30 seconds
- ✅ Real API data flows end-to-end (Task 7)
- ✅ Integration tests pass
- ✅ ARCHITECTURE.md and README.md written

PORT CONFIGURATION
- Backend: http://localhost:4201 (working)
- Frontend: http://localhost:4200 (not rendering)
- Both ports configured in .claude/launch.json
- If ports are blocked locally, update launch.json with free ports

DEPLOYMENT NOTES FOR FUTURE
- Local dev: Current setup (ports 4200/4201)
- Cloud: Will move to Vercel (backend as function, frontend as static)
- Storage: Will migrate from ~/.claude/token-usage.json to cloud service
- Hook: Will need to POST to cloud API instead of local file

START HERE
First, diagnose the Vite rendering issue:
1. Check if problem is React-specific or Vite-wide
2. Review Vite server logs with verbose output
3. Create minimal test file to eliminate React complexity
4. Once rendering works, proceed with Task 7 (E2E tests)

SKIP THIS IF NOT NEEDED
- Cloud deployment planning (Tasks 1-8 are local-only)
- Dark mode or mobile support (desktop-first MVP)
- ML-based recommendation learning (rule-based is fine for now)
```

---

## Quick Reference: What's Where

| Component | Location | Status |
|-----------|----------|--------|
| Backend Server | `packages/backend/src/server.ts` | ✅ Running on 4201 |
| Storage Logic | `packages/backend/src/storage/tokenStorage.ts` | ✅ Working |
| API Routes | `packages/backend/src/routes/stats.ts` + `recommendations.ts` | ✅ Tested |
| Hook Script | `~/.claude/scripts/log-token-usage.sh` | ✅ Ready |
| React Dashboard | `packages/frontend/src/pages/Dashboard.tsx` | ❌ Not rendering |
| Data Hook | `packages/frontend/src/hooks/useTokenData.ts` | ✅ Fetches API |
| Components | `packages/frontend/src/components/` | ✅ Code valid |
| Tests | `packages/backend/src/**/__tests__/` | ✅ Passing |
| Documentation | `docs/token-usage-dashboard/` | 🟡 80% done |

---

## Environment Setup for Codex Session

### Before Starting
1. Verify backend is accessible:
   ```bash
   curl http://localhost:4201/api/health
   ```
   Should return: `{"status":"ok","message":"Backend is running","storage":"accessible"}`

2. Check frontend dependencies are installed:
   ```bash
   ls packages/frontend/node_modules | head
   ```
   Should show React, Vite, TypeScript, etc.

3. Confirm ports are free:
   ```bash
   lsof -i :4200 -i :4201
   ```
   Should show nothing (ports available) or only the dev servers we're starting

### Starting Servers
```bash
# Backend (in one terminal)
npm run dev -w packages/backend

# Frontend (in another terminal)
npm run dev -w packages/frontend
```

Both should start without errors. Backend will log endpoints. Frontend might hang or show Vite startup.

---

## Common Issues & Quick Fixes

### "Port 4200 already in use"
- Find process: `lsof -i :4200`
- Kill it: `kill -9 <PID>`
- Or change port in `.claude/launch.json`

### "Cannot find module 'react'"
- Install dependencies: `npm install -w packages/frontend`
- Check `packages/frontend/node_modules` exists

### "Frontend page is black"
- Check browser console for errors (F12)
- Check Vite server logs for compilation errors
- Try refreshing page or clearing browser cache
- Verify `main.tsx` imports `./index.css`

### "API calls 404"
- Ensure backend is running on 4201
- Check that Vite proxy is configured in `vite.config.ts`
- Verify `useTokenData` hook URL is `/api/session/current`

---

## Success Criteria

When you can see this on http://localhost:4200:
1. Header: "Token Usage Dashboard"
2. Alert banner: Green/yellow/red based on current threshold
3. Two gauges: Session usage (blue) and Weekly usage (purple)
4. Model breakdown table: Haiku, Sonnet, Opus with tokens and costs
5. Recommendations panel: At least one recommendation card visible
6. Footer: "Data refreshes every 30 seconds"
7. Actual data from API (not mock)

Then Tasks 7-8 can proceed.

---

## Decision Log

### Why Not Cloud-First?
- Local development allows quick iteration without deployment latency
- Storage in `~/.claude/` avoids authentication complexity during MVP
- Easier to debug when everything is on same machine

### Why Tailwind?
- Utility-first CSS reduces decision paralysis
- Class-based styling keeps components pure
- Easily extensible for future customization

### Why React + Vite?
- Fast dev server with HMR
- Industry standard for modern dashboards
- Component reusability helps with future UI expansion

### Why Separate Ports?
- Port 3000 blocked by system services on Mac/Linux
- Port 5000 conflicts with Flask/default servers
- Ports 4200-4201 are uncommon, clear, and easy to remember

---

## What Can Be Cut If Time is Short

### Must Keep
- Frontend rendering (visual UI)
- Task 7 integration tests
- API ↔ Storage ↔ Hook data flow working

### Can Defer to Later
- Task 8 ARCHITECTURE.md (basic README ok)
- Feedback learning (accept/ignore buttons work but don't improve recommendations yet)
- Cloud deployment planning
- Dark mode, mobile, animations

### Can Pivot If Stuck >1 hour
- Replace Vite+React with plain HTML/CSS dashboard
- Use curl/Postman instead of browser for testing
- Run backend as subprocess instead of separate terminal

---

## How to Measure Success

**After 1-2 hours**:
- Frontend renders without errors
- Components visible with real data from API

**After 3-4 hours**:
- E2E flow tested (hook → storage → API → frontend)
- Integration tests pass

**After 5+ hours**:
- All documentation complete
- Project ready for cloud deployment planning

---

## Questions to Ask If Stuck

1. **Is the problem Vite or React?**
   - Try serving plain HTML through Vite
   - If that works, issue is in React/JSX
   - If that fails, Vite server isn't functioning

2. **Is the backend actually working?**
   - Test with curl: `curl http://localhost:4201/api/session/current`
   - Check response JSON is valid
   - Verify storage file exists and has data

3. **Are components syntactically valid?**
   - Run TypeScript check: `npm run build -w packages/frontend`
   - Look for import/export errors
   - Verify all props are passed correctly

4. **Is the proxy configured correctly?**
   - Check `vite.config.ts` has `/api` proxy to `localhost:4201`
   - Test proxy: `curl http://localhost:4200/api/session/current`
   - If proxy works, issue is in React/fetch code

---

## Runbook for Next Codex Session

1. **Read SESSION_STATUS.md** — Understand what's broken and why
2. **Verify backend** — `curl http://localhost:4201/api/health`
3. **Check frontend deps** — `npm install -w packages/frontend` (if needed)
4. **Start servers** — Backend on 4201, Frontend on 4200
5. **Test rendering** — Open browser to http://localhost:4200
6. **Debug issue** — Use browser DevTools, Vite logs, curl tests
7. **Once working** — Run Task 7 (E2E tests) and Task 8 (docs)
8. **Verify** — Dashboard shows real data, all tests pass
9. **Document** — Update SESSION_STATUS.md with findings and next steps

---

## Links & References

- **Session Status**: `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/SESSION_STATUS.md`
- **Specification**: `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/spec.md`
- **Sprint Plan**: `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/plan.md`
- **API Docs**: `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/API_REFERENCE.md`
- **Hook Setup**: `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HOOK_SETUP.md`

---

**Good luck! The backend is solid, the code is written, it just needs the frontend to render and tests to pass. You've got this. 🚀**
