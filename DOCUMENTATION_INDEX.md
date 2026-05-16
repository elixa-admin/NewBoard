# Documentation Index — Token Usage Dashboard

**Last Updated**: May 16, 2026  
**For**: Codex handoff and continuation  
**Read Time**: Varies by document

---

## 📍 Start Here

1. **[QUICK_START.md](./QUICK_START.md)** ⭐ **[5 min read]**
   - What works, what's broken
   - Immediate next steps (copy & run)
   - Debugging checklist
   - **👉 Read this first**

2. **[HANDOFF_TO_CODEX.md](./HANDOFF_TO_CODEX.md)** ⭐ **[10 min read]**
   - Master prompt to paste into Codex
   - Full context summary
   - Success criteria
   - **👉 Use this to resume work**

3. **[WORK_SUMMARY.md](./WORK_SUMMARY.md)** **[10 min read]**
   - What was accomplished this session
   - Code metrics and file counts
   - Lessons learned
   - Time estimates for remaining work

---

## 📚 Reference Documentation

### For Understanding the Project

- **[spec.md](./docs/token-usage-dashboard/spec.md)** **[20 min read]**
  - Technical specification
  - Architecture decisions with rationale
  - Invariants and error handling
  - Why each design choice was made

- **[plan.md](./docs/token-usage-dashboard/plan.md)** **[15 min read]**
  - 8-task sprint breakdown
  - Task dependencies and ordering
  - Acceptance criteria for each task
  - Rollback plan if needed

- **[API_REFERENCE.md](./docs/token-usage-dashboard/API_REFERENCE.md)** **[10 min read]**
  - Complete endpoint documentation
  - Request/response examples
  - Error codes and formats
  - Data structure definitions

- **[HOOK_SETUP.md](./docs/token-usage-dashboard/HOOK_SETUP.md)** **[10 min read]**
  - User setup guide for Claude Code integration
  - Environment variable reference
  - Troubleshooting for hook script

### For Technical Deep Dives

- **[SESSION_STATUS.md](./docs/token-usage-dashboard/SESSION_STATUS.md)** **[20 min read]**
  - Detailed status of what works/what's broken
  - Files organized by location
  - Known issues and blockers
  - Investigation notes on Vite rendering issue
  - Recommended next steps

- **[PORT_BLOCKING_ANALYSIS.md](./docs/token-usage-dashboard/PORT_BLOCKING_ANALYSIS.md)** **[15 min read]**
  - Technical analysis of port conflicts
  - Node.js process hanging issues
  - Environment-specific observations
  - Lessons learned and best practices
  - Troubleshooting checklist
  - Recommendations for future development

---

## 🚀 Quick Action Items

### Immediate (Next Codex Session)
```
1. Read QUICK_START.md (5 min)
2. Run curl tests to verify backend works (2 min)
3. Debug Vite rendering issue (30 min - 2 hrs)
   └─ If stuck > 30 min, use static HTML fallback
4. Once frontend renders, run Task 7 tests (1-2 hrs)
```

### If Vite Debugging Stalls
```
✅ Quick pivot: Use static HTML dashboard
- Copy QUICK_START.md static HTML example
- Serve with npx http-server
- Verify data display works
- Then incrementally add React
```

### Follow-Up (Tasks 7-8)
```
1. Complete integration testing (Task 7)
2. Write final documentation (Task 8)
3. Manual E2E test with Claude Code hook
4. Verify everything works end-to-end
```

---

## 📊 Document Organization

```
NewBoard/
├── QUICK_START.md ........................ 👈 START HERE
├── HANDOFF_TO_CODEX.md .................. 👈 MASTER PROMPT
├── WORK_SUMMARY.md ...................... Session accomplishments
├── DOCUMENTATION_INDEX.md ............... This file
│
├── docs/token-usage-dashboard/
│   ├── spec.md .......................... Technical specification
│   ├── plan.md .......................... Sprint task breakdown
│   ├── API_REFERENCE.md ................. Endpoint documentation
│   ├── HOOK_SETUP.md .................... Claude Code setup guide
│   ├── SESSION_STATUS.md ................ Detailed status report
│   └── PORT_BLOCKING_ANALYSIS.md ........ Environment issues analysis
│
├── packages/backend/
│   ├── src/server.ts .................... Express app (port 4201)
│   ├── src/routes/
│   │   ├── stats.ts ..................... API endpoints
│   │   └── recommendations.ts ........... Recommendation engine
│   ├── src/storage/tokenStorage.ts ...... Core storage logic
│   └── src/__tests__/ ................... Unit tests (passing ✅)
│
├── packages/frontend/
│   ├── src/pages/Dashboard.tsx .......... Main dashboard (code ready)
│   ├── src/components/ .................. React components (code ready)
│   ├── src/hooks/useTokenData.ts ........ Data fetching hook (code ready)
│   └── index.html ....................... Entry point
│
└── .claude/launch.json .................. Dev server configuration
```

---

## 🎯 Key Files to Know

| File | Purpose | Status | When to Read |
|------|---------|--------|--------------|
| QUICK_START.md | Quick reference | ✅ Ready | Before starting |
| HANDOFF_TO_CODEX.md | Master prompt | ✅ Ready | To resume work |
| SESSION_STATUS.md | Detailed status | ✅ Ready | Need context |
| spec.md | Architecture | ✅ Complete | Understanding design |
| plan.md | Task breakdown | ✅ Complete | Planning work |
| API_REFERENCE.md | Endpoint docs | ✅ Complete | Testing backend |
| PORT_BLOCKING_ANALYSIS.md | Env issues | ✅ Complete | Debugging problems |
| packages/backend/src/server.ts | Backend app | ✅ Running | Code review |
| packages/frontend/src/pages/Dashboard.tsx | Frontend UI | ⚠️ Code ready, not rendering | Debug rendering |

---

## ✅ Completion Status by Task

| Task | Goal | Status | Notes |
|------|------|--------|-------|
| 1 | Project setup | ✅ Done | npm workspaces, TypeScript, git |
| 2 | Storage schema | ✅ Done | Atomic writes, caching, session management |
| 3 | Hook script | ✅ Done | Bash + Node.js CLI, ready for Claude Code |
| 4 | Backend API | ✅ Done | 7 endpoints, all tested and working |
| 5 | Recommendation engine | ✅ Done | Integrated into Task 4 routes |
| 6 | Dashboard UI | 🟡 Code done, not rendering | React components valid, Vite issue |
| 7 | Integration tests | ❌ Not started | Blocked by frontend rendering |
| 8 | Final docs | 🟡 80% done | Need ARCHITECTURE.md, final README |

---

## 🔍 How to Find Things

### Looking for...
- **How the backend works?** → `spec.md` § Design
- **What needs to be done?** → `plan.md` § Task list
- **What broke and why?** → `SESSION_STATUS.md` § Known Issues
- **How to set up the hook?** → `HOOK_SETUP.md` § Setup steps
- **What API endpoints exist?** → `API_REFERENCE.md` § Endpoints
- **How to debug issues?** → `PORT_BLOCKING_ANALYSIS.md` § Troubleshooting
- **Code for specific feature?** → See "File Organization" above

### Looking for code...
- **Express app** → `packages/backend/src/server.ts`
- **API routes** → `packages/backend/src/routes/stats.ts`
- **Recommendations** → `packages/backend/src/routes/recommendations.ts`
- **Storage logic** → `packages/backend/src/storage/tokenStorage.ts`
- **Dashboard UI** → `packages/frontend/src/pages/Dashboard.tsx`
- **Data fetching** → `packages/frontend/src/hooks/useTokenData.ts`
- **Components** → `packages/frontend/src/components/`
- **Tests** → `packages/backend/src/**/__tests__/`

---

## 📞 If You're Stuck

1. **Check QUICK_START.md** — Has debugging checklist
2. **Check SESSION_STATUS.md** — Documents what was tried
3. **Check PORT_BLOCKING_ANALYSIS.md** — Has troubleshooting guide
4. **Look at test files** — Shows how code should work
5. **Read spec.md** — Explains design decisions

---

## 🎓 Learning Path

If new to this project, read in this order:
1. QUICK_START.md (5 min) — Get oriented
2. WORK_SUMMARY.md (10 min) — See what was built
3. spec.md (20 min) — Understand architecture
4. plan.md (15 min) — See task breakdown
5. SESSION_STATUS.md (20 min) — Understand current state
6. Code files (30+ min) — Review actual implementation

**Total time**: ~1.5 hours to be fully oriented.

---

## 📝 Version History

| Date | Version | Notes |
|------|---------|-------|
| May 16, 2026 | 1.0 | Initial documentation for Codex handoff |

---

## 🚀 Ready?

1. **Start**: Read QUICK_START.md
2. **Understand**: Use HANDOFF_TO_CODEX.md as master prompt
3. **Debug**: Follow steps in QUICK_START.md or PORT_BLOCKING_ANALYSIS.md
4. **Implement**: Complete Tasks 7-8
5. **Verify**: All tests pass, dashboard renders, E2E works

**You've got everything you need. The backend is solid. Just fix the frontend rendering and you're done!**

---

**Questions?** All answers are documented in the files above. Use this index to navigate.
