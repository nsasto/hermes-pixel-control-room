# Current Implementation Critique

Date: 2026-07-30

## Executive assessment

The archived implementation is not a partial implementation of the agreed Hermes Pixel Control Room. It is a different product: a native Hermes Desktop Kanban viewer named Pixel Agents.

The agreed product is a view-only plugin for the browser-based `hermes dashboard` that presents configured Hermes profiles as persistent pixel characters in the local Luxury Office scene. It needs a dashboard tab, a dashboard backend, Hermes lifecycle hooks, live activity, a side-panel log, and local user-supplied licensed assets.

The archived implementation instead:

- imports `@hermes/plugin-sdk`, which belongs to the native desktop app;
- registers a desktop route, sidebar contribution, palette command, and bottom pane;
- reads `kanban.snapshot.v1` rather than Hermes profile/session/tool lifecycle state;
- polls React Query instead of using the hook-to-dashboard event bridge;
- renders text buttons in abstract lanes instead of the purchased office and characters;
- intentionally ships no third-party assets;
- provides no agent inspector, activity log, expanded event details, character assignments, stations, movement, or temporary subagents.

The archived work is valuable as research only: it records a minimized read contract, strict-ish transport boundaries, some sorting/normalization ideas, and a useful negative lesson about changing the product surface through a new spec without reconciling the canonical decisions.

## What to retain

- The repository history and the `archive/desktop-kanban-attempt` branch for provenance.
- The existing domain glossary and original decision map, subject to updates for the web-dashboard implementation.
- The idea of a transport-independent normalized state model.
- Bounded text handling and safe React text rendering.
- Synthetic fixture testing before live Hermes integration.
- The local-only `assets/pixel_art/` convention and licence warning.

## What to discard from the new implementation

- Desktop SDK imports and contribution areas.
- The desktop-only `docs/specs/clean-room-v1.md` as an implementation authority.
- Kanban as the primary source of agent activity.
- Desktop `dist/plugin.js`, desktop package scripts, and desktop acceptance claims.
- The 500-row Kanban dashboard, bottom-pane office, palette command, and desktop installation path.
- Any claim that source-string tests are browser or visual acceptance tests.

## Risks to control in the rebuild

1. The web dashboard's browser plugin and Python plugin run in different processes. The live seam must be explicit: hook callbacks publish normalized events to the dashboard backend only while a dashboard subscriber is active; the tab obtains a fresh snapshot on open/reconnect.
2. Hermes profile names are the currently visible identity, but rename stability must be handled as an orphan-and-reassign migration rather than guessed.
3. Current official docs describe plugin API routes as authenticated. The installed Hermes version must be tested for same-origin SSE authentication before the stream contract is frozen.
4. Hook coverage is asymmetric: `subagent_stop` is documented, while a start event is not. Temporary helpers need a conservative start heuristic and authoritative completion.
5. Purchased source files must remain local and ignored; only derived, non-extractable project outputs may be used in a private build.

## Exit condition for the critique

No feature implementation should be judged against the archived desktop spec. The web-dashboard manifest, backend route, hook adapter, and synthetic room fixture are the new seams and the only implementation authority on this branch.
