# Handoff: Hermes Web Dashboard Rebuild

Updated: 2026-07-31
Branch: `web-dashboard-rebuild`
Latest commit: `b2e5b8a`

## Start here

Read these in order:

1. `docs/critiques/current-implementation-critique.md`
2. `docs/plans/web-dashboard-rebuild-plan.md`
3. `CONTEXT.md`
4. `DECISION-MAP.md`

The old desktop/Kanban attempt remains recoverable on `archive/desktop-kanban-attempt` and must not become the implementation base.

## What exists

- `dashboard/manifest.json` registers a browser `hermes dashboard` tab at `/control-room`.
- `dashboard/dist/index.js` is a generated IIFE using `window.__HERMES_PLUGIN_SDK__` through `globalThis`.
- `dashboard/dist/style.css` provides the fixture room/panel layout.
- `src/web/` contains a fixture snapshot, room/panel rendering, selection, status labels, and visibility cleanup.
- `dashboard/plugin_api.py` exposes fixture `/health`, `/snapshot`, and bounded in-memory `/events` SSE routes.
- `scripts/build-plugin.mjs` builds the single dashboard bundle without bundling React.
- `tests/unit/web-dashboard.test.mjs` tests the manifest, generated bundle, accessibility markers, and cleanup seam.

## Verification

From the repository root:

```text
npm test
node --check dashboard/dist/index.js
python -m py_compile dashboard/plugin_api.py
```

All currently pass. The dashboard bundle is tracked; `assets/pixel_art/` remains ignored.

## Next implementation slice

Implement the real Hermes observation adapter only after inspecting an installed Hermes runtime/source:

1. Verify the current plugin hook names and callback payloads.
2. Verify profile enumeration and session/message access for the machine-level dashboard.
3. Add `plugin.yaml` + `__init__.py` general plugin hooks for session, tool, approval, and subagent lifecycle events.
4. Publish normalized events into the existing `EventHub` only while a dashboard subscriber lease is active.
5. Replace fixture `/snapshot` with a profile/session-derived snapshot, keeping the same neutral contract.
6. Add reconnect snapshot behavior and tests for hidden/unmounted route cleanup.

Do not use the native desktop SDK, `kanban.snapshot.v1`, direct SQLite parsing, transcript scraping, shell bridges, or a second durable event history.

## Current blocker

This environment has no local Hermes source or runtime—only the bootstrap `uv` binaries under the user-local Hermes directory. Do not guess private APIs. Validate against the user’s installed Hermes version before implementing hook registration or profile/session adapters.

## Constraints to preserve

- Browser-based `hermes dashboard`, not Hermes Desktop.
- View-only first release.
- One persistent presence per configured profile; temporary delegated helpers.
- Luxury Office assets remain user-supplied under ignored `assets/pixel_art/`.
- Expanded activity details are allowed in this trusted local instance, but raw details are never persisted.
- Zero render/timer/SSE/polling work while the route is hidden or unmounted.

## Suggested skills

- `decision-mapping` for resolving remaining Hermes integration tickets
- `codebase-design` for maintaining the adapter/simulation/presentation seams
- `tdd` for adapter and lifecycle behavior
- `implement` for the next vertical slice
- `review` after the live adapter slice is complete
