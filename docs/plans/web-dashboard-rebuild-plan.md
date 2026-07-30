# Hermes Pixel Control Room — Web Dashboard Rebuild Plan

Status: implementation plan approved before code
Branch: `web-dashboard-rebuild`
Target: browser-based `hermes dashboard`

## Outcome

Build a local, view-only Hermes dashboard plugin with one full Control Room tab. The tab shows every configured Hermes profile as one persistent Agent Presence, current Executions and Activities, temporary delegated helpers, and a stacked detail/activity panel over the purchased Luxury Office artwork.

The first release is desktop-first, silent, read-only, and single-layout. It does not control agents, edit rooms, ship source artwork, or target the native Hermes desktop app.

## Architecture

```text
Hermes CLI/gateway profile processes
        │  Python plugin hooks
        ▼
Observation adapter ── normalized event contract ──▶ dashboard/plugin_api.py
                                                           │
                                                  snapshot + SSE
                                                           ▼
                              dashboard/dist/index.js
                           React panel + PixiJS room
```

### Deep module seams

1. **Observation adapter**
   - Interface: `observe(eventSink)` and `readSnapshot(scope)`.
   - Converts Hermes hook payloads, profile/session APIs, errors, and reconnects into a versioned neutral contract.
   - Knows Hermes names; nothing below this seam imports Hermes modules.

2. **Room simulation**
   - Interface: `reduce(state, event)`, `deriveDestinations(state)`, `layout(state, roomManifest)`.
   - Owns Agent Presence, Execution, Activity, Station, Status, navigation, ambient behavior, and temporary helpers.
   - Testable entirely with fixtures.

3. **Dashboard presentation**
   - Interface: React snapshot/event subscription plus settings operations.
   - Registers the web-dashboard tab, starts/stops the PixiJS ticker, renders the side panel, and persists assignments.

4. **Asset theme**
   - Interface: validated `theme-manifest.json` and room manifest.
   - Maps logical stations/poses to locally prepared assets; the simulation never hard-codes purchased filenames.

## Repository shape

```text
dashboard/
  manifest.json
  plugin_api.py
  dist/index.js
  dist/style.css
src/
  adapter/          # Hermes hooks, snapshot, event bridge
  model/            # neutral types and reducers
  room/             # Pixi renderer and fixed room manifest
  panel/            # React UI
  settings/         # schema and backend persistence client
scripts/
  build-plugin.mjs
  prepare-assets.mjs
tests/
  unit/
  browser/
fixtures/
assets/pixel_art/   # local-only purchased source; ignored
```

The dashboard bundle uses `window.__HERMES_PLUGIN_SDK__`; React is external. The Python backend is declared with `"api": "plugin_api.py"` in the dashboard manifest. The same plugin directory may contain `plugin.yaml` and `__init__.py` for hooks.

## Delivery slices

### Slice 0 — executable shell

- Add the web-dashboard manifest and a synchronous IIFE registration.
- Render a placeholder Control Room tab with a panel and an empty PixiJS canvas.
- Add a route lifecycle test proving that mount starts work and unmount stops it.

### Slice 1 — fixture room

- Load a committed synthetic snapshot through a fixture adapter.
- Render the empty Luxury Office scene from locally supplied assets when available.
- Add one character, one station, status marker, selection, and accessible DOM summary.
- Keep the room functional without Hermes.

### Slice 2 — simulation core

- Implement profile-to-presence mapping, concurrent executions, status precedence, station mapping, three-second movement debounce, and temporary helper lifecycle.
- Add deterministic fixed-room anchors, walkable nodes, occluders, occupancy limits, and receptionist home station.
- Test 12 persistent agents plus temporary helpers.

### Slice 3 — dashboard backend and hooks

- Add a Python general plugin with observer hooks: session start/end/finalize/reset, pre/post LLM, pre/post tool, approval hooks if supported, and `subagent_stop`.
- Add a short-lived subscriber lease and an in-memory bounded event queue to `plugin_api.py`.
- Add snapshot and SSE endpoints with the dashboard's installed authentication behavior.
- Do not persist raw event history or create a second session database.

### Slice 4 — Hermes adapter

- Verify the installed profile enumeration and session/message APIs.
- Normalize tool categories, execution identity, summaries, errors, approvals, and subagent events.
- Start with conservative unknown states; do not infer blocked/waiting from elapsed time alone.
- Reconcile with a fresh snapshot after reconnect or missed events.

### Slice 5 — settings and panel

- Persist versioned installation-wide mappings under the dashboard profile's Hermes home.
- Auto-assign unique characters on first launch; reserve the receptionist for the default profile; allow explicit reassignment.
- Implement stacked desktop panel: selected agent, executions, live log, filters, and expandable raw event details.
- Add narrow-screen tabs and reduced-motion override.

### Slice 6 — hardening

- Validate missing/licence-mismatched assets without bundling source files.
- Add keyboard interaction, text-equivalent status, 30 FPS cap, hidden-route shutdown, reconnect behavior, and bounded queues.
- Run real browser tests against a disposable Hermes dashboard process and synthetic event fixtures.

## Event contract (initial)

```ts
type ControlRoomEvent = {
  schemaVersion: 1
  eventId: string
  occurredAt: string
  profileName: string
  sessionId?: string
  parentSessionId?: string
  executionId?: string
  kind:
    | 'execution.started'
    | 'execution.completed'
    | 'execution.failed'
    | 'tool.started'
    | 'tool.completed'
    | 'tool.failed'
    | 'approval.required'
    | 'input.required'
    | 'wait.started'
    | 'wait.ended'
    | 'subagent.started'
    | 'subagent.completed'
  toolName?: string
  toolCategory?: string
  summary?: string
  raw?: unknown
}
```

`raw` is available only in expanded UI state and is never persisted. The adapter must cap strings and avoid creating a second durable transcript.

## Status rules

Per execution, then reduced per profile:

`Offline > Error > Needs input > Blocked > Working > Waiting > Idle`

Status markers are authoritative and never derived from ambient animation. An unknown Hermes value remains `Unknown`; it does not become Idle or Done.

## Office v1

Use the empty Luxury Office scene as the immutable base. Logical stations:

- Reception: default/main profile home, approvals, communications
- Central desks: coding/workstation
- Private office: focused planning
- Boardroom: orchestration and collaboration
- Project table: research/browser/files
- Equipment nook: archive and repair
- Kitchen/lounge: waiting and coffee
- Recreation lounge: long idle/completion behavior
- Visitor lounge: temporary helper arrival/departure

The purchased pack is static. Movement uses pixel-stepped translation, bobbing, shadow, and pose swaps; no generated walk-cycle sprites are required for v1.

## Acceptance gates before release

- `manifest.json` loads in `hermes dashboard` and the tab registers without the desktop SDK.
- A fixture-only room works with no Hermes process and no licensed files committed.
- Hidden/unmounted route closes SSE, stops PixiJS, cancels timers, and aborts fetches.
- Every profile appears once; multiple executions show a count, not clones.
- Temporary helpers show parentage and disappear after completion.
- Expanded activity reveals full trusted-instance details; normal rows stay concise.
- Profile/session/tool events are visibly fresh after reconnect.
- Character assignments persist and are editable.
- Keyboard and reduced-motion behavior are tested.
- Asset preparation fails safely when `assets/pixel_art/` is absent and never copies source packs into Git.
- Browser tests mount the actual bundle and inspect behavior; source-string checks are not acceptance tests.

## First implementation task

Implement Slice 0 only, then run the browser route lifecycle test. Do not add Hermes data access until the fixture-only tab is mounted and teardown is proven.
