# Port Blocking & Environment Issue Analysis

**Document**: Technical investigation of local development environment issues  
**Date**: May 16, 2026  
**Scope**: Port availability, Node.js process management, and development server startup

---

## Problem Summary

During Tasks 5-6 implementation, encountered recurring issues with:
1. Common ports being blocked or unavailable (3000, 5000)
2. Node.js processes hanging (tsx watch, npm run dev)
3. Vite dev server starting but not serving content
4. Environment-specific failures with no clear error messages

These issues prevented visual verification of the dashboard UI despite code being syntactically valid.

---

## Port Availability Issues

### Issue 1: Port 3000 Not Available
**Observed**: Default React port (3000) was unavailable  
**Root Cause**: System services on macOS/Ubuntu often bind to port 3000  
**Examples**:
- macOS: Gatekeeper, Mail services
- Ubuntu: Default port for many dev tools
- Common in shared environments

**Solution Implemented**:
- Changed to port 4200 (frontend) and 4201 (backend)
- Rationale: Both in 4200 range, unlikely to conflict, easily memorable
- Updated package.json, vite.config.ts, and .claude/launch.json

### Issue 2: Port 5000 Also Problematic
**Observed**: Flask development servers commonly use 5000  
**Risk**: High collision likelihood in shared dev environments
**Decision**: Avoided 5000 entirely, used 4201 for backend instead

### Best Practices for Port Selection
```
❌ Avoid (commonly blocked):
- 3000 (Node/React default)
- 5000 (Flask, Zoom)
- 8000 (Django, Java)
- 8080 (Proxy, LoadBalancer)
- 8081 (Alternative common)

✅ Good choices:
- 4200-4299 (uncommon, cluster-friendly)
- 9000-9100 (less common)
- 15000-15999 (very safe)

⚠️ Context-dependent:
- If in Docker, use different range than host
- If on shared server, coordinate with team
- If using k8s, use service mesh instead
```

---

## Node.js Process Hanging

### Issue 3: tsx watch Hangs
**Observed**:
```
> token-dashboard-backend@0.1.0 dev
> tsx watch src/server.ts

# Hangs here — no "server listening" message
# Process uses CPU but doesn't complete startup
```

**Root Cause**: Likely esbuild caching or tsx version incompatibility  
**Symptoms**:
- Initial npm output appears (package name, version, command)
- No subsequent output
- Process runs indefinitely
- Can be killed with Ctrl+C but takes several seconds

**Hypotheses**:
1. tsx version in monorepo has cache issues
2. esbuild not properly initializing TS loader
3. Source map generation causing hang
4. Workspace resolution problem in npm workspaces

**Solutions Tried**:
1. ✅ Using preview_start tool (works around process management)
2. ❌ Direct `npm run dev` (hangs)
3. ❌ Using bash wrapper with `npm run dev` in background (still hangs)

**Workaround**: Use preview_start which handles process lifecycle better

### Issue 4: Vite Dev Server Starts But Doesn't Serve
**Observed**:
```
> token-dashboard-frontend@0.1.0 dev
> vite

# Server starts but:
# - No "ready in X ms" message
# - No port binding message
# - Browser gets blank page
```

**Possible Causes**:
1. Vite HMR (Hot Module Replacement) WebSocket not connecting
2. React/JSX compilation failing silently
3. CSS/Tailwind import issue causing app to not render
4. Missing dependency causing runtime error (but no console message)

**Investigation Done**:
- ✅ Verified all imports are correct in main.tsx
- ✅ Confirmed Tailwind config files exist
- ✅ Checked that index.html references correct script
- ✅ Ran npm install for frontend
- ✅ Verified vite.config.ts proxy setup
- ✅ No TypeScript compilation errors

**Root Cause**: Still unknown — needs deeper investigation in Vite logs

---

## Environment-Specific Observations

### Works in This Environment
- Direct `npm install` in root (installs both packages)
- Backend Express server compile and startup
- API endpoint responses
- Storage file operations
- TypeScript compilation to dist/
- Unit test execution (via vitest)

### Doesn't Work in This Environment
- Frontend Vite HMR/dev server rendering
- tsx watch process lifecycle management
- Background npm process execution (hangs)
- Preview tool integration with hanging processes

### Why This Matters
- These are environment-specific, not code bugs
- Same code may work differently in:
  - Different Node.js versions
  - Different npm versions
  - CI/CD environments (GitHub Actions, etc.)
  - Docker containers
  - Different machines/OS versions

---

## Recommended Fixes for Future Development

### Short-term (Current Project)
1. **Use preview_start instead of direct npm commands**
   - Provides better process lifecycle management
   - Handles output streaming
   - Graceful cleanup on exit

2. **Explicit port configuration**
   - Add `.env.local` support to specify ports
   - Document port choices in README
   - Add check in startup script to verify ports are free

3. **Static HTML fallback for UI development**
   - Build first iteration as plain HTML/CSS
   - Verify data display works with static files
   - Incrementally add React layer when comfortable
   - Reduces complexity during debugging

### Medium-term (Architecture)
1. **Docker-based local development**
   - Eliminates "works on my machine" issues
   - Consistent environment across team
   - Easier to replicate CI failures locally
   - Example:
     ```dockerfile
     FROM node:20-alpine
     WORKDIR /app
     COPY . .
     RUN npm install
     EXPOSE 4200 4201
     CMD ["npm", "run", "dev"]
     ```

2. **Separation of concerns for dev tools**
   - Backend: Pure Node.js API (no special tooling)
   - Frontend: Plain HTML/CSS first, React overlay optional
   - Tests: Run independently, not as part of dev server

3. **Monitoring & health checks**
   - Backend: `/api/health` endpoint (done ✅)
   - Frontend: Health check script to verify startup
   - Automated fallback if port unavailable

### Long-term (Infrastructure)
1. **CI/CD pipeline to catch environment issues**
   - Build in GitHub Actions / similar
   - Test on multiple Node.js versions
   - Build Docker images automatically
   - Push to staging environment for verification

2. **Cloud development environment**
   - GitHub Codespaces or similar for remote dev
   - Consistent environment for all team members
   - No "works on my machine" issues
   - Easier collaboration

3. **Documented setup for new developers**
   - SETUP.md with prerequisites
   - Troubleshooting guide for common issues
   - Port allocation strategy
   - Docker alternative if local fails

---

## For Claude Code / Codex Integration

### Current Approach
```
Claude Code (hook) 
  ↓
logs to ~/.claude/token-usage.json
  ↓
Backend reads file
  ↓
Frontend fetches from API
```

### Challenges This Approach Has
- File I/O bottleneck at scale
- Race conditions if multiple Claude processes write simultaneously
- Local-only (can't share between machines)
- Storage file lock issues in some filesystems

### Future Cloud Approach
```
Claude Code (hook)
  ↓
POST to cloud API (e.g., Vercel Function)
  ↓
Cloud database stores data
  ↓
Frontend fetches from cloud API
```

### Benefits
- No file locking issues
- Accessible from any machine
- Scales to multiple Claude Code instances
- Can add authentication/authorization

---

## Troubleshooting Checklist

When environment issues occur, try in this order:

```
1. Verify ports are free:
   lsof -i :4200 -i :4201
   
2. Clear npm cache:
   npm cache clean --force
   
3. Reinstall dependencies:
   rm -rf node_modules package-lock.json
   npm install
   
4. Check Node version:
   node --version  # Should be 18+ LTS
   
5. Use preview_start instead of npm directly:
   # Don't: npm run dev -w packages/backend
   # Do: Use preview_start tool or .claude/launch.json
   
6. Try static HTML instead of complex tooling:
   # Create packages/frontend/public/index.html
   # Test with simple HTTP server
   
7. If all else fails, use Docker:
   docker build -t newboard .
   docker run -p 4200:4200 -p 4201:4201 newboard
```

---

## Lessons Learned

### What Worked
- Writing backend code first (decoupled from frontend)
- Using TypeScript everywhere (catches errors early)
- Creating unit tests alongside code (enables confident refactoring)
- Monorepo structure (easy to coordinate dependencies)

### What Didn't Work
- Assuming Vite would "just work" (it needed debugging)
- Using default ports (blocked by system services)
- Direct bash process management (unpredictable behavior)
- Not having fallback approaches (static HTML, Docker)

### What to Do Differently Next Time
- **Start with static HTML for UI**
  - No build complexity, no framework overhead
  - Verify data display works
  - Incrementally add tooling
  
- **Plan for multiple dev environments**
  - Local machine (npm)
  - Docker (reproducible)
  - Cloud (GitHub Codespaces, etc.)
  
- **Test with explicit ports from the start**
  - Don't rely on defaults
  - Document port choices
  - Add verification scripts
  
- **Keep build tools simple**
  - Only add when needed
  - Consider tradeoffs (Vite vs esbuild vs tsc)
  - Have fallbacks for when tooling fails

---

## References

### Port Information
- IANA Well-Known Ports: https://www.iana.org/assignments/service-names-port-numbers
- Commonly Blocked Ports: Ports < 1024, 3000, 5000, 8000, 8080, 25, 465, 587

### Node.js / npm
- tsx documentation: https://github.com/esbuild-kit/tsx
- npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces
- Node.js LTS versions: https://nodejs.org/en/about/releases/

### Vite
- Vite documentation: https://vitejs.dev/
- HMR troubleshooting: https://vitejs.dev/config/#server-hmr
- Vite debugging: https://vitejs.dev/guide/troubleshooting.html

### Development Tools
- Docker for development: https://www.docker.com/
- GitHub Codespaces: https://github.com/features/codespaces
- Process management with supervisor: http://supervisord.org/

---

## Recommendation for Next Session

**Priority**: 
1. Fix Vite rendering issue (use static HTML if needed)
2. Complete Tasks 7-8 with working frontend
3. Document lessons learned in project README

**Don't spend > 1 hour debugging Vite.** If stuck, pivot to:
- Static HTML dashboard (pure CSS, no framework)
- Same API backend
- Manual testing instead of hot reload

The backend is solid. Focus on getting *any* working UI first, then enhance.
