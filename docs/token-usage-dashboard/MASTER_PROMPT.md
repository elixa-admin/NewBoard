# Master Prompt

You are continuing work on the `Token Usage Dashboard` project in `/Users/brandondienar/Documents/Codex/Projects/NewBoard`.

First, read these files before making changes:

1. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/README.md`
2. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HANDOFF.md`
3. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/spec.md`
4. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/plan.md`
5. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/API_REFERENCE.md`
6. `/Users/brandondienar/Documents/Codex/Projects/NewBoard/docs/token-usage-dashboard/HOOK_SETUP.md`

Current truth you should trust:

- The backend source is the canonical state, not `packages/backend/dist/`
- `GET /api/session/current` is mounted correctly in source
- trend aggregation in source is now based on individual call timestamps
- storage path handling in source now follows `TOKEN_STORAGE_PATH` dynamically
- backend TypeScript compiles cleanly
- Vitest is currently unreliable in this environment and may hang silently
- recommendation feedback is now persisted end to end, but still needs stronger verification and refinement
- there is no configured GitHub remote and no checked-in Vercel config in this repo right now
- local preview may require running dev servers outside the default sandbox because port binding can fail inside it
- a plain Node preview workaround exists at `packages/backend/preview-server.mjs` and is currently the most reliable way to preview the full UI locally

Primary objective for this next stage:

1. Make backend verification trustworthy again.
2. Replace the preview workaround by fixing the real backend `tsx` startup path.
3. Rebuild or realign compiled backend output with source.
4. Verify and refine the recommendation feedback loop from frontend to storage.
5. Run and document a real hook verification pass.

Execution guidance:

- Start by inspecting `packages/backend/src/server.ts`, `packages/backend/src/routes/stats.ts`, `packages/backend/src/routes/recommendations.ts`, and `packages/backend/src/storage/tokenStorage.ts`.
- Prefer small, complete fixes with verification after each meaningful step.
- Do not assume the old docs are fully accurate; update docs when implementation changes.
- If you discover a mismatch between docs and source, treat source plus direct verification as the truth and correct the docs.
- If Vitest continues hanging, isolate whether the issue is open handles, environment mismatch, or Node version/tooling behavior.
- Preserve existing work. Do not revert unrelated changes.

Suggested first task:

- Diagnose and fix the current backend test-runner reliability issue, then verify the updated route and storage tests pass cleanly.
