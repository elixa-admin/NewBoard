# Quick Start — Token Usage Dashboard

**For**: Next Codex session resuming work on NewBoard  
**Project**: Token Usage Dashboard for Claude Code  
**Status**: 60% complete, frontend not rendering  
**Time to read**: 5 minutes

---

## TL;DR

Backend is done and working. Frontend code is written but not rendering on the page. 

**Next step**: Fix Vite rendering issue on port 4200, then complete Tasks 7-8.

---

## What Works ✅

```
✅ Backend API (port 4201)
✅ Token storage and aggregation
✅ Hook script for Claude Code
✅ Recommendation engine
✅ Unit tests passing
✅ React components (code valid, TypeScript fine)
✅ Tailwind CSS configured
```

## What's Broken ❌

```
❌ Frontend page shows blank/black screen
❌ Vite dev server starts but doesn't render
❌ No console errors visible
❌ No clear error messages
```

---

## Start Here (Copy & Run)

### 1. Verify Backend Works
```bash
# Test health check
curl http://localhost:4201/api/health

# Expected response:
# {"status":"ok","message":"Backend is running","storage":"accessible"}
```

### 2. Start Backend (if not running)
```bash
npm run dev -w packages/backend
# Should see: "Backend server running on http://localhost:4201"
```

### 3. Start Frontend (if not running)
```bash
npm run dev -w packages/frontend
# May hang or show "Awaiting server..." — this is the bug
```

### 4. Try to access dashboard
```
Open in browser: http://localhost:4200
Result: Blank black screen (the problem we need to fix)
```

### 5. Diagnose the issue
```bash
# Check if problem is Vite or React
curl http://localhost:4200/

# Should return HTML with <script type="module" src="/src/main.tsx">
# If blank, Vite isn't serving
# If 404, Vite not running

# Check Node process
ps aux | grep vite
ps aux | grep npm
```

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `packages/backend/src/server.ts` | Express app | ✅ Working |
| `packages/backend/src/routes/stats.ts` | API endpoints | ✅ Working |
| `packages/backend/src/routes/recommendations.ts` | Recommendations | ✅ Working |
| `packages/frontend/src/pages/Dashboard.tsx` | Main UI | ⚠️ Code valid, not rendering |
| `packages/frontend/src/hooks/useTokenData.ts` | API data fetching | ✅ Valid |
| `docs/token-usage-dashboard/SESSION_STATUS.md` | Full context | 📖 Read this |
| `HANDOFF_TO_CODEX.md` | Detailed handoff | 📖 Master prompt |
| `docs/token-usage-dashboard/PORT_BLOCKING_ANALYSIS.md` | Environment issues | 📖 Reference |

---

## The Problem in Detail

### Symptom
Vite starts with no errors. Browser shows blank page. No console logs.

### Investigation Done
- ✅ All imports correct in `main.tsx`
- ✅ `index.css` imports CSS
- ✅ React components compile without errors
- ✅ TypeScript has no issues
- ✅ Dependencies installed
- ✅ Vite config correct (proxy, plugin, port)

### Hypothesis
Vite server not actually serving content, or React/JSX not compiling.

### What to Do
1. Check if problem is Vite or React
2. Create minimal HTML test
3. If Vite doesn't work, try static HTML dashboard instead
4. See `SESSION_STATUS.md` for full investigation notes

---

## How to Debug

### Option 1: Browser DevTools
```
1. Open http://localhost:4200
2. Press F12 (DevTools)
3. Check Console tab for errors
4. Check Network tab for failed requests
5. Check Application tab for service workers
```

### Option 2: Vite Logs
```bash
# Check if Vite printed error during startup
npm run dev -w packages/frontend 2>&1 | head -100

# Look for:
# - "ready in X ms"
# - Any error messages
# - "VITE" and "port 4200"
```

### Option 3: Test with curl
```bash
# Does Vite serve HTML?
curl http://localhost:4200/ | head

# Should see: <!doctype html>, <script>, etc.
# If blank, Vite not serving

# Does backend API work?
curl http://localhost:4201/api/session/current | jq .

# Should see: valid JSON with session data
```

### Option 4: Minimal Test
```bash
# Create test HTML
cat > /tmp/test.html << 'EOF'
<!doctype html>
<html>
<body><h1>Hello</h1></body>
</html>
EOF

# Serve it
npx http-server /tmp

# Works? Then issue is in frontend build
# Doesn't work? Then issue is environment
```

---

## If Debugging Takes > 30 Minutes

**Pivot to static HTML approach:**

```bash
# 1. Create static dashboard
mkdir -p packages/frontend/public
cat > packages/frontend/public/index.html << 'EOF'
<!doctype html>
<html>
<head>
  <title>Token Usage Dashboard</title>
  <style>
    body { font-family: sans-serif; background: #f9fafb; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .card { background: white; padding: 1.5rem; border-radius: 0.5rem; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
    h1 { margin: 0 0 0.5rem 0; font-size: 2rem; }
    .gauge { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; }
    .gauge-fill { height: 100%; background: #3b82f6; border-radius: 999px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Token Usage Dashboard</h1>
    <div class="card">
      <h2>Session Usage</h2>
      <div class="gauge"><div class="gauge-fill" style="width: 45%"></div></div>
      <p>18,000 / 44,000 tokens (40.9%)</p>
    </div>
    <div class="card">
      <h2>Weekly Usage</h2>
      <div class="gauge" style="background: #ddd"><div class="gauge-fill" style="background: #8b5cf6; width: 5%"></div></div>
      <p>40,000 / 800,000 tokens (5.0%)</p>
    </div>
    <div class="card">
      <h2>Model Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td>Haiku</td><td style="text-align: right;">5,200 tokens</td><td style="text-align: right;">28.6%</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td>Sonnet</td><td style="text-align: right;">6,800 tokens</td><td style="text-align: right;">59.1%</td>
        </tr>
        <tr>
          <td>Opus</td><td style="text-align: right;">500 tokens</td><td style="text-align: right;">2.7%</td>
        </tr>
      </table>
    </div>
  </div>
  <script>
    // Fetch real data from API
    fetch('/api/session/current')
      .then(r => r.json())
      .then(data => {
        console.log('Data loaded:', data);
        // Update page with real data
      })
      .catch(e => console.error('API error:', e));
  </script>
</body>
</html>
EOF

# 2. Serve static files
cd packages/frontend
npx http-server public --port 4200

# 3. Open http://localhost:4200
# Should see dashboard with mock data + API calls in console
```

This gets you a working UI in 10 minutes, then you can incrementally add React/Vite once that works.

---

## Task Checklist for This Session

### Primary Goal
- [ ] Frontend renders without blank page
- [ ] Dashboard displays real data from API

### Stretch Goals (if above done quickly)
- [ ] Task 7: Integration tests pass
- [ ] Task 8: Documentation complete
- [ ] Manual E2E test: Real Claude Code hook data flows to dashboard

### Fallback (if Vite debugging takes too long)
- [ ] Use static HTML instead
- [ ] Verify data display works
- [ ] Document the pivot decision

---

## Emergency Contact Info

If you need to reach the previous session notes:
- Full status: `docs/token-usage-dashboard/SESSION_STATUS.md`
- Detailed prompt: `HANDOFF_TO_CODEX.md` 
- Port issues: `docs/token-usage-dashboard/PORT_BLOCKING_ANALYSIS.md`
- API docs: `docs/token-usage-dashboard/API_REFERENCE.md`
- Architecture: `docs/token-usage-dashboard/spec.md`

---

## Success Looks Like

After fixing the rendering issue, you should see:

```
http://localhost:4200/
├── Header "Token Usage Dashboard"
├── Alert banner (green, yellow, or red based on usage %)
├── Session gauge (blue progress bar)
├── Weekly gauge (purple progress bar)
├── Model breakdown table (Haiku, Sonnet, Opus)
└── Recommendations panel (if any recommendations exist)
```

With real data from the API backend on port 4201.

---

**Start with `SESSION_STATUS.md` for full context, then try the debug steps above.**

**You've got this! The hard part (backend) is done. Just need to get the frontend rendering. 🚀**
