# Provisional Implementation Plan

This document gives the next planning agent a concrete default to challenge. `DECISION-MAP.md` remains canonical for settled decisions and ticket status. Items labelled **Validate** are not yet proven against the user's installed Hermes version.

## 1. Version-one outcome

Ship a local, view-only tab inside the browser-based `hermes dashboard`. It shows the default and named Hermes profiles as persistent characters in one Luxury Office scene, temporary delegated subagents as short-lived helpers, and a stacked agent/activity panel.

Version one does not include a room editor, sound, native-desktop integration, agent control, durable activity history, multiple art themes, or hand-authored walking cycles.

## 2. Proposed package shape

```text
hermes-pixel-control-room/
├── dashboard/
│   ├── manifest.json
│   ├── plugin_api.py
│   └── dist/                    # generated web bundle
├── hermes_plugin/
│   ├── plugin.yaml
│   └── __init__.py             # observation hooks
├── src/
│   ├── adapter/                 # Hermes payloads -> event contract
│   ├── simulation/              # state, destinations, ambient behavior
│   ├── room/                    # PixiJS scene and navigation
│   └── panel/                   # React side panel
├── fixtures/
├── scripts/
│   └── prepare-assets.*         # local-only normalization
├── assets/
│   ├── pixel_art/               # purchased source; ignored
│   └── generated/               # derived build output; ignored
└── tests/
```

The distributable form should include the dashboard manifest, a pre-built IIFE JavaScript bundle, CSS, the dashboard FastAPI backend, and the Hermes hook plugin. It must not use the native desktop SDK.

## 3. Profile discovery and identity

### Provisional decision

- Enumerate profiles using Hermes' own profile utility from the Python backend, not by parsing CLI output.
- Include the base/default profile plus named profiles.
- Use the canonical profile name as the external key in version one.
- Generate an internal `presenceId` the first time a profile is seen and persist it in plugin settings.
- If a known name disappears and one new profile appears, offer an explicit assignment migration rather than guessing that a rename occurred.
- Removed profiles become hidden/orphaned assignments and are retained until the user deletes or reassigns them.

### Validate

- Exact import and return contract of the installed Hermes profile-listing utility.
- Whether a stable profile UUID or distribution identifier exists.
- Whether the dashboard exposes a supported profile-list endpoint in the installed release.

## 4. Live observation architecture

### Provisional decision

Use an on-demand, cross-process bridge:

1. The visible web tab opens one SSE connection to `dashboard/plugin_api.py`.
2. The backend creates a short-lived subscriber lease.
3. Hermes hooks in each profile return immediately when no lease is active.
4. With an active lease, hooks send normalized events to a localhost-only backend ingest route.
5. The backend fans events into an in-memory bounded queue and the SSE stream.
6. On connection and reconnection, the backend builds a fresh snapshot from Hermes profile/session APIs.
7. Closing or hiding the route closes SSE and lets the lease expire. No renderer, timers, polling, event queue, or persistent journal remains active.

This avoids a second history store. A dropped event can affect momentary animation but is repaired by the next snapshot.

### Validate

- Current dashboard-plugin route authentication behavior, which has changed across Hermes documentation/releases.
- Whether authenticated browser `EventSource` works through the installed dashboard gate or requires a short-lived query token.
- Hook availability in CLI, gateway, API-server, cron, and delegated-subagent paths.
- Safe cross-platform localhost transport under Windows/WSL and Unix.

## 5. Versioned event contract

Start with a transport-independent discriminated union:

```ts
type ControlRoomEvent = {
  schemaVersion: 1;
  eventId: string;
  occurredAt: string;
  profileName: string;
  sessionId?: string;
  runId?: string;
  parentSessionId?: string;
  subagentId?: string;
  kind:
    | "execution.started"
    | "execution.completed"
    | "execution.failed"
    | "execution.interrupted"
    | "tool.started"
    | "tool.completed"
    | "tool.failed"
    | "input.required"
    | "approval.required"
    | "wait.started"
    | "wait.ended"
    | "subagent.started"
    | "subagent.completed";
  toolName?: string;
  toolCategory?: ActivityCategory;
  summary?: string;
  raw?: unknown;
};
```

The adapter owns Hermes-specific payloads and inference. The simulation never imports Hermes modules or knows hook names.

Unknown or unavailable fields remain absent. Do not fabricate `Blocked`, `Waiting`, or `Needs input` from elapsed time alone.

## 6. Status reducer

Apply status per Execution, then reduce all Executions belonging to an Agent using the settled precedence:

1. Offline/unavailable
2. Error
3. Needs input
4. Blocked
5. Working
6. Waiting
7. Idle

Provisional transition rules:

- `execution.started` -> Working
- `tool.started` -> Working at mapped station
- external asynchronous operation with an explicit pending event -> Waiting
- explicit prompt/approval gate -> Needs input
- tool failure -> Error for that Execution until a later successful event, completion, or acknowledgement in source data
- execution failure -> Error
- completion/interruption -> terminal Execution; Agent recomputes from remaining Executions
- no active Executions -> Idle
- a profile missing or unreadable during snapshot -> Offline/unavailable

The detailed agent should determine whether `Blocked` exists authoritatively in Hermes. If not, omit it from emitted state rather than infer it.

## 7. Initial room and station map

Use the empty Luxury Office scene as the immutable background. Author a companion room manifest containing normalized coordinates, navigation nodes, occluders, station anchors, pose requirements, and ambient anchors.

| Scene area | Station IDs | Activity categories |
|---|---|---|
| Reception | `reception-main`, `approval-desk`, `communications` | Main Agent home, coordination, approvals, messaging |
| Six central desks | `workstation-01..06` | Code, terminal, tests, builds, unknown sustained work |
| Upper-middle private office | `focus-office` | Long-form reasoning and focused work |
| Upper-right boardroom | `boardroom-presenter`, `boardroom-seat-*` | Planning, decomposition, orchestration, multi-agent work |
| Middle-right project table | `research-console`, `project-table` | Browser, web research, documents, file inspection |
| Printer/equipment nook | `archive`, `repair-bay` | File/archive operations, diagnostics, errors |
| Lower-right kitchen/lounge | `coffee`, `waiting-seat-*` | Waiting and short idle routines |
| Upper-left recreation lounge | `recreation-*` | Long idle and completion celebration |
| Lower-left visitor lounge | `helper-arrival`, `visitor-seat-*` | Temporary-helper arrival, departure, and overflow |

Tool mapping should be data, not code. Match exact tool names first, then configured categories, then a safe workstation fallback. A destination change requires three seconds of category stability.

## 8. Navigation and animation

- Use a hand-authored waypoint graph for the single fixed room.
- Give each edge a walkability width/capacity; do not implement general physics.
- Reserve station approach and occupancy anchors separately.
- Use A* over the small graph and local offsets to prevent total overlap.
- Resolve draw order primarily by character foot-point Y, with authored foreground occlusion sprites where required.
- Move using integer-aligned steps, subtle bob/tilt, and a soft moving shadow.
- Swap to supplied static work/seated poses at compatible stations.
- If no compatible pose exists, keep the standing pose beside the station rather than stretching or rotating artwork.
- Temporary helpers spawn at the visitor lounge, display a parent link, use available overflow anchors, and fade/depart after a short completion beat.

## 9. Asset normalization

Purchased source assets live only in `assets/pixel_art/` and never enter Git.

Create a deterministic local preparation script that:

- Locates the selected pack by a documented marker file.
- Validates expected source filenames and dimensions.
- Copies only required images into a generated build directory.
- Produces texture atlases and a `theme-manifest.json`.
- Records source hashes and pack version for diagnostics.
- Fails with a helpful purchase/download link when assets are absent.

Do not publish source PNGs, modified standalone assets, or an asset bundle. The detailed planning agent must choose between a private personal build and a public source distribution that requires each user to supply their own purchased pack.

## 10. Character catalog and assignment

Normalize each selectable identity into:

```ts
type CharacterIdentity = {
  id: string;
  label: string;
  poses: Partial<Record<PoseName, AssetRef>>;
  anchor: { x: number; y: number };
  scale: number;
};
```

First launch:

- Designate the default profile as Main Agent.
- Assign the receptionist identity and reception home station to it.
- Assign remaining profiles unique identities and central home workstations deterministically.
- Preserve all assignments in installation-wide settings.
- Allow edits from the selected-agent panel.
- Disallow duplicates by default; expose an explicit override.

## 11. Settings

Proposed schema:

```json
{
  "schemaVersion": 1,
  "mainProfileName": "default",
  "assignments": {
    "default": {
      "presenceId": "generated-id",
      "characterId": "receptionist",
      "homeStationId": "reception-main"
    }
  },
  "ui": {
    "panelWidth": 380,
    "reducedMotion": "system",
    "zoom": 1
  }
}
```

Persist via the plugin backend using atomic replace: write a sibling temporary file, flush, then rename. Keep no prompts, messages, tool payloads, event history, or secrets in this file.

### Validate

- Exact plugin-owned path under the dashboard profile's `HERMES_HOME`.
- File locking requirements when more than one dashboard window is open.

## 12. Side panel

Desktop layout:

1. Agent header: character portrait, profile/display name, authoritative status, current location, concurrency badge.
2. Execution list: title, source, duration, individual status, and link to the Hermes session page.
3. Activity log: newest-first rows with time, Agent, phase, tool/category, outcome, and duration.
4. Expanded event: complete raw payload with structured JSON rendering and copy action.

Filters: all/selected Agent, status, activity category, errors, and text search. Cap the in-memory list at 500 events. Do not reconstruct a bespoke historical event timeline; on open, show a recent-session summary from Hermes and begin live rows from that point.

Narrow layouts use separate Room and Details/Activity tabs.

## 13. Performance and accessibility budgets

Provisional acceptance targets:

- 30 FPS cap while visible; stop the ticker entirely while hidden.
- Comfortable at 12 persistent Agents plus 8 temporary helpers.
- Graceful at 24 persistent Agents by reducing ambient behavior density.
- At most one SSE connection and one initial/reconnect snapshot request.
- No polling while the SSE connection is healthy.
- Bounded 500-event UI log and bounded event queue.
- Keyboard-selectable characters and stations.
- Text-equivalent status and activity; never rely on color alone.
- Automatic `prefers-reduced-motion` behavior plus an override.
- Reduced motion disables wandering, bobbing, tilt, celebration, and animated travel; destination/status changes remain visible.
- Zoom controls and a “focus selected Agent” action.
- Desktop support from 1280px; no phone-quality requirement.
- No audio.

The detailed agent should turn these into measurable CPU, memory, bundle-size, reconnect, and browser-support thresholds.

## 14. Fixture and test plan

Build the simulation against fixture adapters before connecting Hermes:

- 12 idle Agents with deterministic assignments
- one coding activity and station debounce
- simultaneous executions on one Agent
- parent plus several temporary helpers
- explicit wait and input/approval states
- tool failure followed by recovery
- execution failure with other work still active
- SSE disconnect and authoritative resnapshot
- hidden route with zero renderer/network activity
- profile add, removal, and rename ambiguity
- missing assets and mismatched pack version
- reduced-motion and keyboard-only operation
- 24-Agent load scenario

Use reducer/unit tests for state, fixture-driven integration tests for adapter behavior, and browser tests for lifecycle/resource suspension.

## 15. Suggested delivery slices

1. **Fixture vertical slice** — dashboard tab, empty room, one character, side panel, no Hermes integration.
2. **Simulation slice** — cast reducer, status precedence, station debounce, navigation, 12-Agent fixtures.
3. **Asset slice** — local preparation script, character catalog, static pose swaps, licence-safe missing-asset flow.
4. **Observation slice** — profile snapshot plus verified tool/session/subagent hooks feeding live SSE.
5. **Persistence slice** — assignments, main Agent, editable characters, atomic settings.
6. **Operational hardening** — reconnects, hidden-route shutdown, accessibility, performance budgets.
7. **Personal installation** — documented build/install/update workflow for the user's Hermes instance.

Do not begin broad implementation until the installed Hermes version has been inspected for profile enumeration, actual hook invocation sites, plugin-route authentication, and session URL conventions.

