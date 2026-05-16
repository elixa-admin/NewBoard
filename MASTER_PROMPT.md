# Token Usage Dashboard - Master Prompt for Codex

**Date**: 2026-05-16 20:00 UTC
**Status**: Phase 1 complete, ready for Phase 2 integration
**Repository**: https://github.com/elixa-admin/NewBoard
**Local Server**: http://localhost:4202 (npm run serve:frontend)

---

## CURRENT STATUS

### ✅ What's Working

**Frontend Dashboard**
- Single-file HTML application (640 lines, 19KB)
- Responsive design with Tailwind-inspired styling
- Three main views: Usage gauges, Model breakdown table, Recommendations panel
- Real-time alert system (OK/Warning/Critical based on usage %)
- Data fetches from `/api/session/current` and `/api/recommendations`

**Backend API (Static)**
- Three endpoints via URL rewrites (serve.json)
  - `/api/health` → health.json (API status)
  - `/api/session/current` → session/current.json (token usage data)
  - `/api/recommendations` → recommendations.json (cost suggestions)
- Mock data baked in, ready to swap with real data

**Deployment**
- GitHub: Latest commit `c56578c` with all changes
- Vercel: Git integration configured, auto-deploys on push
- Local: Serve package on port 4202 with URL rewrites working

---

## CODE REVIEW

### Frontend (packages/frontend/public/index.html)

**Strengths**
✅ Self-contained single file (no build step needed)
✅ Clean semantic HTML structure
✅ Proper accessibility attributes (aria-labels, roles)
✅ Responsive design with mobile consideration
✅ Error handling with try/catch
✅ Promise-based parallel API calls
✅ Clear separation: CSS (lines 7-200), HTML (201-630), JS (631-640)

**Issues Found & Recommendations**

1. **Error Message Hardcoded** (Line 664 - search for "4201")
   - Current: `"Check that backend is running on http://localhost:4201"`
   - Issue: Port hardcoded to 4201, but we use 4202
   - Fix: Update to 4202 or make dynamic
   - Severity: Low (error message clarity only)

2. **No Data Refresh Interval** (Missing feature)
   - Current: Data fetches once on load
   - Issue: Dashboard shows static data, doesn't update in real-time
   - Expected: Should poll every 30s (footer says "Data refreshes every 30 seconds")
   - Fix: Add setInterval(fetchData, 30000) after initial fetch
   - Severity: Medium (breaks expected behavior)

3. **No Loading States**
   - Current: UI shows "Loading..." briefly, then data or error
   - Issue: User can't tell if dashboard is refreshing data
   - Fix: Add spinner/fade effect during fetch
   - Severity: Low (UX polish)

4. **Alert Logic Could Be Clearer**
   - Current: Uses `alerts[0]` from API
   - Issue: Assumes single alert, logic unclear if multiple exist
   - Fix: Add comment explaining alert priority/selection
   - Severity: Low (works but unclear)

5. **No Timestamp Validation**
   - Current: `new Date(data.startedAt).toLocaleString()`
   - Issue: No check if startedAt is valid ISO string
   - Fix: Add date validation or try/catch
   - Severity: Low (mock data is valid, but matters for real data)

### API Configuration (serve.json & vercel.json)

**Strengths**
✅ CORS headers properly configured for all /api/* routes
✅ Content-Type set to application/json
✅ URL rewrite pattern is clean and maintainable
✅ Vercel config mirrors local config for consistency

**Issues Found**

1. **Vercel Config Missing Cache Headers**
   - Current: serve.json has headers, but vercel.json routes don't specify cache
   - Issue: JSON files will cache forever, real data won't update
   - Fix: Add cache-control headers in vercel.json routes
   - Severity: High (will break real-time data in production)

2. **No Health Check in Dashboard**
   - Current: `/api/health` endpoint exists but dashboard doesn't check it
   - Issue: Can't tell if backend is healthy vs down
   - Fix: Add health check on page load with visual indicator
   - Severity: Low (nice-to-have for debugging)

### Mock Data (api/*.json files)

**Strengths**
✅ Correct schema matching frontend expectations
✅ Realistic values for Claude Code usage
✅ All required fields present

**Issues**
1. **Data Not Updated in Real-Time**
   - Current: Same mock data every fetch
   - Issue: Can't test thresholds (warning/critical states)
   - Fix: Create script to generate dynamic mock data for testing
   - Severity: Low (only matters for testing different alert levels)

### Package Configuration

**Strengths**
✅ Scripts are simple and clear
✅ No unnecessary dependencies
✅ Node 18+ requirement appropriate

**Issues**
1. **Missing serve Dependency in package.json**
   - Current: serve is used but not listed in devDependencies
   - Issue: `npm run serve:frontend` might fail on fresh install
   - Fix: Add `"serve": "^14.0.0"` to devDependencies
   - Severity: Medium (breaks on fresh clone)

---

## CRITICAL ISSUES TO FIX BEFORE PHASE 2

**Must Fix (Blocking)**
1. Add data refresh interval (setInterval every 30s)
2. Fix error message port reference (4201 → 4202)
3. Add `serve` to package.json devDependencies

**Should Fix (Important)**
4. Add cache-control headers to vercel.json for real data
5. Add health check visual indicator

**Nice to Have (Polish)**
6. Add loading spinner during fetch
7. Add date validation for startedAt
8. Create test data script for different alert levels

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────┐
│         Frontend (HTML + JS)            │
│  packages/frontend/public/index.html    │
│  • Alert banner (3 colors)              │
│  • Usage gauges (Session/Weekly)        │
│  • Model breakdown table                │
│  • Recommendations panel                │
└────────────────┬────────────────────────┘
                 │ fetch() every 30s
                 ▼
       ┌─────────────────────────┐
       │   URL Rewrites Layer    │
       ├─────────────────────────┤
       │ serve.json (local)      │
       │ vercel.json (prod)      │
       └────────┬────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
/api/health  /api/session  /api/
              /current      recommendations
    │           │           │
    ▼           ▼           ▼
 *.json      *.json       *.json
  files      files       files
```

---

## DATA FLOW FOR PHASE 2

**Current (Mock)**
```
Dashboard JS → fetch(/api/session/current)
             → serve.json rewrite
             → session/current.json (static file)
             → return mock data
```

**Phase 2 (Real Data)**
```
Dashboard JS → fetch(/api/session/current)
             → vercel.json rewrite
             → CloudFlare Worker / Lambda
             → Fetch from Claude Code API
             → Transform to dashboard schema
             → return real data
```

---

## FILES & LOCATIONS

```
/Users/brandondienar/Documents/Codex/Projects/NewBoard/

FRONTEND
├── packages/frontend/public/
│   ├── index.html (✅ 640 lines, working)
│   ├── serve.json (✅ URL rewrites configured)
│   └── api/
│       ├── health.json
│       ├── session/current.json (⚠️ needs dynamic data)
│       └── recommendations.json

CONFIG
├── package.json (⚠️ missing serve dependency)
├── .claude/launch.json (✅ port 4202)
└── vercel.json (⚠️ missing cache headers)

DOCS
├── DEPLOYMENT_SUMMARY.md (✅ full reference)
└── MASTER_PROMPT.md (this file)
```

---

## NEXT STEPS - PHASE 2 IMPLEMENTATION

### Immediate Fixes (Before any new feature work)
```bash
# 1. Fix serve dependency
npm install --save-dev serve@^14.0.0
git add package.json package-lock.json
git commit -m "fix: Add serve package to devDependencies"

# 2. Fix error message in index.html
# Line ~664: Change "4201" to "4202"
git commit -m "fix: Correct backend port in error message"

# 3. Fix missing data refresh
# Add after fetchData() call: setInterval(fetchData, 30000)
git commit -m "feat: Add 30-second data refresh interval"

git push origin main
```

### Phase 2a: Real Data Integration

**Decision Point**: Where is the token data source?

Option 1: Claude Code API (if available)
- Check Claude Code documentation for token tracking API
- Create endpoint that queries real-time usage

Option 2: CloudFlare Worker (recommended)
- Fast, serverless, low latency
- Can aggregate from multiple sources
- Easy to cache/rate limit
- Deploy as `/api/session/current` proxy

Option 3: AWS Lambda
- More control, more infrastructure
- Higher latency potentially
- More complex to deploy

**Action**: 
1. Identify authoritative token data source
2. Create aggregation endpoint matching schema
3. Update vercel.json routes to point to real endpoint
4. Keep mock data for local testing

### Phase 2b: Real-Time Updates & Historical Data

```
Add after verifying real data integration:
- Historical data storage (last 7 days)
- Trend visualization (line chart)
- Cost projections (if usage continues)
- Alert notifications (email/webhook when critical)
```

### Phase 2c: Testing & Documentation

```
- Manual E2E test with real Claude Code hook
- Load test (60+ requests per hour)
- Documentation updates (architecture, API contract)
```

---

## HOW TO TEST LOCALLY

```bash
# 1. Start dashboard
cd /Users/brandondienar/Documents/Codex/Projects/NewBoard
npm run serve:frontend

# 2. Verify frontend loads
curl http://localhost:4202 | head

# 3. Test API endpoints
curl http://localhost:4202/api/health
curl http://localhost:4202/api/session/current
curl http://localhost:4202/api/recommendations

# 4. Open in browser
# http://localhost:4202

# 5. Check console for errors
# Look for "Dashboard error:" messages
```

---

## VERIFYING CHANGES

After each code change:

```bash
# 1. Run locally
npm run serve:frontend

# 2. Test in browser (manual)
# - Alert banner displays correctly
# - Gauges render with percentages
# - Model table shows all 3 models
# - Recommendations display

# 3. Check API responses
curl http://localhost:4202/api/session/current | jq .

# 4. Commit
git add .
git commit -m "message"
git push origin main

# 5. Verify Vercel deployment
# Check Vercel dashboard for green checkmark
```

---

## API CONTRACT (Don't Break)

The frontend **requires** this exact structure from `/api/session/current`:

```json
{
  "status": "ok",
  "data": {
    "project": "string",
    "sessionId": "string",
    "startedAt": "ISO 8601 timestamp",
    "totalTokens": number,
    "totalCost": "string (USD)",
    "callCount": number,
    "modelBreakdown": {
      "haiku": { "calls": number, "tokens": number, "cost": "string" },
      "sonnet": { "calls": number, "tokens": number, "cost": "string" },
      "opus": { "calls": number, "tokens": number, "cost": "string" }
    }
  },
  "thresholds": {
    "session": { "used": number, "capacity": 44000, "percent": number },
    "weekly": { "used": number, "capacity": 800000, "percent": number }
  },
  "alerts": [
    { "level": "ok|warning|critical", "message": "string" }
  ]
}
```

Changing any of these fields will break the dashboard.

---

## KNOWN LIMITATIONS (By Design)

1. **No database**: Data is ephemeral, lives only in JSON files
   - *Solution for Phase 2*: Add persistent storage (CloudFlare KV, DynamoDB, etc.)

2. **No authentication**: Anyone with the URL can see dashboard
   - *Solution for Phase 2*: Add CloudFlare Teams / OAuth2

3. **No historical data**: Can't see trends over time
   - *Solution for Phase 2*: Store daily snapshots in database

4. **No alerts/notifications**: Users have to check dashboard manually
   - *Solution for Phase 2*: Add email/Slack webhook on threshold breach

5. **Mock data only**: Using same values every refresh
   - *Solution for Phase 2*: Connect to real Claude Code API

---

## DECISION LOG

**Why static JSON instead of serverless functions?**
→ Simpler, no cold starts, faster development iteration

**Why single HTML file?**
→ No build step, easier to preview, self-contained

**Why port 4202?**
→ Avoids common ports (3000, 8000, 5000); less conflict with other projects

**Why serve package?**
→ Lightweight, handles URL rewrites, works with preview_start tool

**Why Vercel instead of other platforms?**
→ Git integration auto-deploys, static hosting is free tier, familiar to team

---

## GIT WORKFLOW FOR NEXT SPRINT

```bash
# Start of day
git pull origin main
npm run serve:frontend

# Make changes to index.html, serve.json, etc
# Test locally: npm run serve:frontend

# Before committing, verify
curl http://localhost:4202/api/session/current | jq .

# Commit with clear message
git add .
git commit -m "feat: Add data refresh interval

- Fetch data every 30 seconds instead of once on load
- Matches footer message 'Data refreshes every 30 seconds'
- No UI changes, seamless background updates
- Test: Open dashboard, verify data updates"

# Push (triggers Vercel auto-deploy)
git push origin main

# Verify deployment completed in Vercel dashboard
```

---

## TROUBLESHOOTING

| Problem | Cause | Solution |
|---------|-------|----------|
| "Cannot find module 'serve'" | Missing devDependency | `npm install` or add to package.json |
| Port 4202 already in use | Another process running | `lsof -i :4202` then kill, or change port |
| API returns 404 | URL rewrite not working | Check serve.json syntax, restart server |
| Dashboard shows "Loading..." forever | API fetch failing | Check browser console for errors |
| Gauge bars don't render | CSS missing or JavaScript error | Open DevTools, check Console tab |
| Vercel deployment fails | Syntax error or missing file | Check GitHub Actions in Vercel dashboard |

---

## READY FOR CODEX PROMPT

You now have:
✅ Current code review with identified issues
✅ 3 critical fixes before Phase 2
✅ Clear path to real data integration
✅ Testing procedures
✅ Git workflow
✅ Troubleshooting guide

**Start here**: Fix the 3 critical issues (data refresh, port message, serve dependency), push to GitHub, verify Vercel deployment succeeds. Then begin Phase 2a (real data integration).

