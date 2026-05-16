# Hook Setup

There is no active Claude Code hook integration in Phase 1.

The previous local hook and Express backend experiment was removed from the active tree when the project moved to a static Vercel-friendly MVP.

For Phase 2, revisit hook integration only after answering:

- What token usage fields Claude Code can expose reliably
- Whether data should be pushed by hook or pulled by API
- Where the production endpoint should live
- Whether local mock JSON remains the development fallback

Any future hook integration should keep `/api/session/current` compatible with the current API contract.
