# Handoff

## Purpose

This document is the fast relay note for the next Claude Code session.

## Repo State

- Workspace: npm workspaces monorepo with `packages/backend` and `packages/frontend`
- Git: repo exists locally, but there is no configured remote in `.git/config`
- Deployment: no `vercel.json` or checked-in Vercel config found
- Product docs are present and should be treated as intent, but not all planned features are implemented yet

## Current Working Reality

### Backend

- `packages/backend/src/server.ts` exports `createApp()` and mounts:
  - `/api/health`
  - `/api/session/current`
  - `/api/stats/models`
  - `/api/stats/projects`
  - `/api/stats/trends/:timeframe`
  - `/api/recommendations`
  - `POST /api/recommendations/:id/feedback`
- `packages/backend/src/storage/tokenStorage.ts` now:
  - reads `TOKEN_STORAGE_PATH` dynamically
  - supports per-process path switching during tests and manual verification
  - computes trends correctly from call timestamps
  - computes sprint duration from last activity instead of broken wall-clock subtraction
  - persists recommendation feedback in storage
- `packages/backend/preview-server.mjs` exists as a plain Node preview workaround and has been verified locally

### Frontend

- `packages/frontend/src/pages/Dashboard.tsx` renders:
  - alert banner
  - overview cards
  - model comparison
  - recommendations panel
- The recommendations UI now posts feedback to the backend and refreshes recommendation state
- Frontend preview has been verified reachable at `http://127.0.0.1:4200`

### Hooking

- `packages/backend/src/cli/logTokenUsage.ts` is the real logger entrypoint
- `scripts/log-token-usage.sh` is the shell hook wrapper documented for Claude Code setup
- End-to-end hook verification is still a next-step task

## Important Truths

- The API path bug for `/api/session/current` has been fixed in source
- Trends are now call-based in source, not session-start-based
- Backend TypeScript compiles cleanly from source
- Current checked-in `packages/backend/dist/server.js` does not reflect the latest source state and should not be trusted until rebuilt
- Vitest currently behaves unreliably in this environment and may hang silently
- Local preview may require running the dev servers outside the default sandbox because port binding can be denied inside it
- The real backend `tsx` startup path is still flaky in this environment, but the preview workaround backend is verified reachable at `http://127.0.0.1:4201`

## Best Next Moves

1. Rebuild the backend output and confirm `dist` matches source.
2. Replace the preview workaround by fixing the real backend `tsx` startup path.
3. Fix the Vitest execution issue so backend tests become trustworthy again.
4. Run a real end-to-end feedback verification from the dashboard UI into storage.
5. Expand the recommendation model so feedback influences ranking more intentionally than the current +/- confidence adjustment.
5. Run a real hook setup pass using `docs/token-usage-dashboard/HOOK_SETUP.md`.

## High-Value Files

- [packages/backend/src/server.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/server.ts)
- [packages/backend/src/routes/stats.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/routes/stats.ts)
- [packages/backend/src/routes/recommendations.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/routes/recommendations.ts)
- [packages/backend/src/storage/tokenStorage.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/storage/tokenStorage.ts)
- [packages/backend/preview-server.mjs](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/preview-server.mjs)
- [packages/backend/src/routes/__tests__/stats.test.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/routes/__tests__/stats.test.ts)
- [packages/backend/src/storage/__tests__/tokenStorage.test.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/backend/src/storage/__tests__/tokenStorage.test.ts)
- [packages/frontend/src/pages/Dashboard.tsx](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/src/pages/Dashboard.tsx)
- [packages/frontend/src/hooks/useTokenData.ts](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/src/hooks/useTokenData.ts)
- [packages/frontend/src/components/RecommendationsPanel.tsx](/Users/brandondienar/Documents/Codex/Projects/NewBoard/packages/frontend/src/components/RecommendationsPanel.tsx)

## Handoff Prompt

Use the master prompt in [docs/token-usage-dashboard/MASTER_PROMPT.md](/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/MASTER_PROMPT.md).
