# Token Usage Dashboard Handoff

Phase 1 is complete. The active implementation is static HTML plus static JSON data.

## Current Baseline

- Local: `http://localhost:4202`
- Production: `https://newboard-token-dashboard.vercel.app`
- GitHub: `https://github.com/elixa-admin/NewBoard`
- Vercel project: `newboard-token-dashboard`

## Active Files

- `packages/frontend/public/index.html`
- `packages/frontend/public/api/health.json`
- `packages/frontend/public/api/session/current.json`
- `packages/frontend/public/api/recommendations.json`
- `packages/frontend/public/serve.json`
- `vercel.json`
- `.claude/launch.json`

## Removed From Active Tree

- React/Vite frontend source
- Express/TypeScript backend source
- Vercel function stubs
- local hook scripts
- scratch preview servers

## Next Phase

Phase 2a: connect real Claude Code token data.

Keep the existing API schema stable. Use the static JSON files as fixtures for local development and tests.

## Master Prompt

Use `/Users/brandondienar/Documents/Codex/Projects/NewBoard/MASTER_PROMPT.md`.
