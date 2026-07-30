# Hermes Pixel Agents V1 Implementation Plan

> **For Felix:** Execute this plan task-by-task with test-first changes and evidence at every gate. Do not inspect `/home/zoe/projects/hermes-pixel-agents`.

**Goal:** Ship a clean-room, read-only Hermes Desktop disk plugin that presents a scalable Pixel Agents dashboard and supplementary Pixel Office from a sanctioned, minimized Hermes Kanban snapshot.

**Architecture:** A single installable `plugin.js` registers a route, sidebar item, palette command, and bottom pane. It calls one compile-time allowlisted, authenticated gateway read RPC through `host.request`, validates and minimizes the response before rendering, treats events only as cache invalidations, and retains polling as the correctness path. The installed Hermes version currently lacks that RPC, so plugin implementation is gated on a separate Hermes-core change; no renderer/backend workaround is allowed.

**Tech stack:** Hermes Agent v0.19.0 (2026.7.20), Desktop Plugin SDK, plain JavaScript ESM, React 19 supplied by Hermes, React Query supplied by Hermes, Node test runner, Playwright/Electron browser tests, deterministic Node asset scripts.

---

## 1. Ground truth and recommendation

Repository: `/home/zoe/projects/hermes-pixel-desk` on `main`.

Verified baseline:

- `docs/specs/clean-room-v1.md` fixes the clean-room product and security boundary.
- `docs/research/hermes-read-contract.md` proves the installed gateway has 141 methods but no `kanban.*` read RPC or Kanban lifecycle event.
- `tests/unit/contract-allowlist.test.mjs` passes with an intentionally empty read-method allowlist.
- Installed Hermes source is `/home/zoe/.hermes/hermes-agent` at upstream `c55159f1`, local `1f1b92a1`.
- `apps/desktop/src/sdk/index.ts:58-111` defines `host.state`, `host.onEvent`, and `host.request`.
- `apps/desktop/src/sdk/index.ts:123-248` exports route/sidebar/pane areas, native controls, time helpers, React Query, and theme-compatible UI.
- `apps/desktop/src/sdk/runtime.ts:23-53` installs the runtime SDK and maps only `@hermes/plugin-sdk`, `react`, and React JSX runtimes.
- `apps/desktop/src/contrib/plugins.ts:1-16,71-74` discovers `$HERMES_HOME/desktop-plugins/<id>/plugin.js` and watches it for hot reload.
- `apps/desktop/src/contrib/plugin.ts:28-115` namespaces storage/contribution IDs and supplies unload disposers.
- `apps/shared/src/json-rpc-gateway.ts:70-422` defines request timeout/abort/reconnect behavior and event envelope handling.
- `tui_gateway/server.py:141-143` owns the exact `_methods` registry; unknown methods fail closed.
- `hermes_cli/kanban_db.py:1-68,102-125,355-563` defines shared/multi-board resolution and canonical statuses.
- `plugins/kanban/dashboard/plugin_api.py:158-234,378-510,517-589` demonstrates why the dashboard REST payload is too broad and mutation-adjacent for this plugin.
- `apps/desktop/package.json:42-64,137-170` and `apps/desktop/playwright.config.ts:27-63` provide the real Electron/Vitest/Playwright hooks.

**Recommendation:** Proceed in two separately reviewed workstreams:

1. Hermes core adds and documents a narrow read RPC and invalidation event.
2. Only after that lands in the installed target, this repository implements the disk plugin against the exact contract.

The Phase 0 gate is currently **NO-GO**. The plan is implementation-ready, but Felix must block rather than begin plugin code until the core contract is real and live-verified.

## 2. Resolved V1 decision map

| Topic | V1 decision |
|---|---|
| Product surface | Full dashboard is primary; Pixel Office is supplementary and removable. |
| Route | Register `ROUTES_AREA` at `/pixel-agents`. |
| Navigation | Register `SIDEBAR_NAV_AREA` with label `Pixel Agents`, codicon `organization`; add one palette navigation command. |
| Pane | Register `PANES_AREA`/`'panes'`, title `Pixel Office`, `placement: 'bottom'`, `dock: { pane: 'workspace', pos: 'bottom' }`, `height: '220px'`. |
| Distribution | Build source modules in this repo into one plain ESM `dist/plugin.js`; install only the emitted file plus local approved assets under `$HERMES_HOME/desktop-plugins/pixel-agents/`. No runtime-relative JS imports and no backend manifest. |
| Data source | Exactly one compile-time allowlisted, versioned gateway JSON-RPC read method through `host.request`; method name comes from merged Hermes core, never from this plan or renderer invention. |
| Current missing capability | Hard gate. Add a separate Hermes-core RPC/event change; do not use REST, WebSocket backend, SQLite, files, shell, processes, logs, transcripts, or `agents.list`. |
| Snapshot authority | Polling snapshot is authoritative. Lifecycle events are invalidation-only accelerators. |
| Query scope | Key by schema version + exact board + active gateway profile. Never cache or flash one scope into another. |
| Pagination | Core contract must specify cursor, max page size, stable ordering, and consistency metadata. Adapter drains bounded pages; >500 visible records uses summary/pagination rather than an unbounded renderer request. |
| State model | Canonical task statuses are `triage`, `todo`, `scheduled`, `ready`, `running`, `blocked`, `review`, `done`, `archived`; product groups preserve `scheduled/review` metadata while mapping display groups explicitly. Unknown values remain visible as `unknown`, never idle/done. |
| Freshness | `fresh` after successful read; `stale` after two missed active intervals; `disconnected` immediately when `host.state.gateway !== 'open'`; last good minimized data remains visible with warning. |
| Event loss/reconnect | Event loss is harmless; reconnect, profile switch, or board switch triggers a full refetch and clears selection before showing the new scope. |
| Identity | Group by canonical profile/assignee ID only. Unknown identity uses stable opaque source ID and label `Unknown agent`; no inference from prose or paths. |
| Primary run | Deterministic: running first, then latest transition/start timestamp, then stable run ID. Show concurrent count; inspector lists safe summaries only. |
| Privacy | Core RPC excludes sensitive families. Renderer strictly decodes, bounds, masks, and projects immediately; transport objects never enter components, storage, logs, DOM, accessibility text, or screenshots. |
| Redaction | Mask secret-, email-, phone-, URL-, control/bidi-, and oversized title content before safe view-model creation; discard original display string. Task IDs/profile IDs are bounded and rendered as inert text. |
| Storage | Persist only presentation preferences and optional stable selected ID. Never persist snapshots or task payload fields. |
| Filters | State, profile, board, text search, and density. Search only safe name/profile/task title/task ID/status/board fields. |
| Inspector | Read-only safe identity, state, board, task ID/title, timestamps/freshness, blocked kind, and current run count. No body, comments, result, error, metadata, workspace, model transcript, tool data, or attachment path. |
| Office | DOM/CSS sprites, deterministic lanes, maximum 24 rendered occupants (23 + `+N`), accessible equivalent labels, no state-inventing animation. Canvas is rejected for V1. |
| Assets | Kenney CC0 shortlist plus original project art only; no download until manifest approval. Arlan and all legacy/Pixel Agent Desk assets remain excluded. |
| UI styling | Hermes native controls and `--ui-*` theme variables only; no hardcoded colors or raster application chrome. |
| Scale | Virtualize/window dashboard results at measured threshold; office remains capped. Synthetic 500-row acceptance fixture is mandatory. |
| Test boundary | Unit/browser fixtures are synthetic. Real tests verify registry/live RPC/envelope/auth/reconnect and Desktop loading only; never snapshot a real task payload into the repo. |
| Packaging | Reproducible build emits one plugin ESM and manifest-approved assets; package scan rejects source maps, fixtures, legacy strings, extra binaries, remote URLs, and backend files. |
| Read-only | No `useMutation`, dynamic RPC method, mutation method, `ctx.rest/socket`, `host.restartGateway`, `fetch`, XHR, WebSocket, Node filesystem/process/SQLite, or direct network access. |
| Remote support | Supported only where the existing authenticated Desktop gateway exposes the same contract. Feature-detect exact schema/method; on absent/denied capability show read-only unavailable state and make no fallback call. |
| Non-goals | Mutations, messaging, agent control, backend/service/listener, legacy migration, transcript/log/process inference, remote assets, and office-first operation. |
| Nathan decision | None required for V1. The missing core RPC is an engineering dependency, not a request to weaken the boundary. |

## 3. Target repository layout

```text
README.md
package.json
scripts/
  build-plugin.mjs
  build-assets.mjs
  verify-assets.mjs
  verify-package.mjs
src/
  plugin.js
  data/contract.js
  data/fetch-snapshot.js
  data/normalize.js
  data/redact.js
  data/use-pixel-agents.js
  model/states.js
  model/selectors.js
  dashboard/PixelAgentsPage.js
  dashboard/DashboardHeader.js
  dashboard/StateTotals.js
  dashboard/AgentFilters.js
  dashboard/AgentList.js
  dashboard/AgentCard.js
  dashboard/AgentInspector.js
  office/PixelOfficePane.js
  office/OfficeScene.js
  office/layout.js
  ui/FreshnessBadge.js
  assets/manifest.json
  assets/generated/**
tests/
  fixtures/hermes-read-contract/synthetic-snapshot-v1.json
  unit/contract.test.mjs
  unit/contract-allowlist.test.mjs
  unit/normalize.test.mjs
  unit/redact.test.mjs
  unit/states.test.mjs
  unit/selectors.test.mjs
  unit/office-layout.test.mjs
  browser/fixtures/snapshot-*.json
  browser/pixel-agents.spec.ts
  browser/electron-fixture.ts
docs/
  research/hermes-read-contract.md
  review/clean-room-audit.md
  review/felix-execution-evidence.md
  review/pixel-agents-v1-independent-review.md
THIRD_PARTY_ASSETS.md
dist/plugin.js
```

`dist/` is the release artifact. Whether it is committed follows the repository release convention Felix establishes in bootstrap; it must always be reproducible and package-verified.

## 4. Ordered execution plan

Every numbered step is intended to take 2–5 focused minutes. Commit at the end of each task group, not after unverified intermediate failures.

### Task 0 — Freeze the baseline and capability gate

**Files:** modify `docs/research/hermes-read-contract.md`; test `tests/unit/contract-allowlist.test.mjs`.

1. Run `git status --short && git log -1 --oneline`; record a clean baseline in the evidence document.
2. Run `hermes --version`; require v0.19.0 or record the exact replacement version and restart contract validation.
3. Run `npm run test:contract`; expect exit 0 with the empty approved-method set.
4. Inspect the installed `_methods` registry and record its count and every `kanban`/`delegation` match without payloads.
5. Probe the final core method name only after it exists; expect a schema response or a typed authorization/scope error, never `-32601`.
6. Probe the final event type and capture only a redacted envelope shape.
7. Verify no real payload body/title enters repository evidence.
8. If the method/event is absent, add an evidence timestamp, block the implementation card, and route the separate core card below.
9. If present, replace the placeholder contract table with exact method, params, response, event, scope, pagination, timestamps, auth, reconnect, and remote semantics.
10. Update `approvedReadMethods` with exactly the merged method constant and rerun `npm run test:contract`.

**Acceptance:** exact live contract is documented; test allowlist contains one read method; independent reviewer can reproduce the probe; otherwise no `src/` implementation exists.

### Task 0A — Separate Hermes-core dependency card

**Repository:** `/home/zoe/.hermes/hermes-agent` in a new worktree/branch; do not edit installed `main` in place.

**Likely core files:** `tui_gateway/server.py`, a new focused `tui_gateway/methods_kanban.py`, `hermes_cli/kanban_db.py` read helpers, `tui_gateway/event_publisher.py`, Kanban lifecycle transition sites, `tests/tui_gateway/test_kanban_snapshot.py`, `tests/hermes_cli/test_kanban_db.py`, and `website/docs/developer-guide/desktop-plugin-sdk.md` or a dedicated RPC reference.

1. Write failing registry test for one finalized versioned read method.
2. Run the test; expect `-32601`/missing registration.
3. Write synthetic DB fixtures spanning all canonical statuses, multiple boards, profiles, runs, and unknown values.
4. Write failing schema/minimization test proving forbidden columns never serialize.
5. Write failing board/profile scope tests, including omitted/current board and denied cross-scope access.
6. Write failing cursor/limit tests with a documented hard maximum and stable ordering.
7. Implement a pure snapshot serializer over canonical `kanban_db` read helpers.
8. Register the exact read method in the gateway method registry.
9. Run focused snapshot tests; expect pass.
10. Write failing event-envelope tests for task/run lifecycle invalidation.
11. Emit only `{ schemaVersion, board, entityType, entityId, revision }` after committed transitions.
12. Prove event publication never occurs inside a SQLite write lock.
13. Test dropped event/reconnect convergence through a subsequent snapshot read.
14. Test authenticated local Desktop and OAuth-remote gateway behavior.
15. Document exact contract and feature-detection error behavior.
16. Run `pytest` on focused gateway/Kanban suites, then the repository-prescribed lint/type gates.
17. Obtain independent core review and merge/install the reviewed Hermes version.
18. Return to Task 0 and live-probe the installed merged method.

**Core acceptance:** one narrow read-only method, no mutation surface, strict minimized schema, bounded pagination, explicit scope/auth, invalidation event, reconnect convergence, docs and tests. Until merged and installed, Pixel Agents remains NO-GO.

### Task 1 — Bootstrap the minimal package

**Files:** modify `package.json`; create `scripts/build-plugin.mjs`, `scripts/verify-package.mjs`, initial `src/plugin.js`, `tests/unit/import-boundary.test.mjs`.

1. Write a failing package test asserting `dist/plugin.js` is one ESM file with no unresolved relative JS imports.
2. Add forbidden import/API assertions for runtime code and emitted bundle.
3. Run the focused test; expect failure because build files do not exist.
4. Add only the minimum build/test dependencies needed to bundle local modules while externalizing the three Hermes-provided specifiers.
5. Implement `build-plugin.mjs` with deterministic output and no source map in release mode.
6. Create a minimal plugin export `{ id: 'pixel-agents', name: 'Pixel Agents', defaultEnabled: true, register(ctx) {} }`.
7. Run build and package tests; expect pass.
8. Run `npm test` from a clean dependency install state.

**Acceptance:** reproducible `dist/plugin.js`, exactly three allowed external specifiers, no backend/network/runtime Node capability.

### Task 2 — Register the native shell contributions

**Files:** modify `src/plugin.js`; create shell-oriented browser test in `tests/browser/pixel-agents.spec.ts`.

1. Write a failing test for route `/pixel-agents`.
2. Register `ROUTES_AREA` with `PixelAgentsPage` render callback.
3. Write a failing sidebar test.
4. Register `SIDEBAR_NAV_AREA` with fixed label/path/codicon.
5. Write a failing palette navigation test.
6. Register `PALETTE_AREA` command calling only `host.navigate('/pixel-agents')`.
7. Write a failing pane registration test.
8. Register `PANES_AREA` with the resolved bottom-dock payload.
9. Test plugin disable removes all four contributions and listeners.
10. Test re-enable/hot reload creates exactly one copy of each contribution.
11. Build and load the artifact in a disposable profile home; verify no plugin toast or console error.

**Acceptance:** native route/sidebar/palette/pane work independently and clean up on disable.

### Task 3 — Lock the transport contract and decoder

**Files:** create `src/data/contract.js`, `src/data/fetch-snapshot.js`, `tests/unit/contract.test.mjs`; modify fixture.

1. Write failing tests for exact `schemaVersion`, params, cursor, limit, and envelope.
2. Define one literal method constant copied from the verified core contract.
3. Write failing tests for missing fields, wrong types, duplicate IDs, invalid timestamps, excessive arrays, and unsupported schema.
4. Implement a strict transport decoder with bounded arrays and strings.
5. Write failing test that unknown status values decode as strings for later `unknown` mapping.
6. Implement unknown-enum tolerance without unknown-schema tolerance.
7. Write failing test that the request wrapper calls exactly one literal `host.request` method.
8. Implement the request wrapper with bounded page draining and abort/supersession handling supported by the installed bridge.
9. Rerun contract and allowlist tests.

**Acceptance:** malformed/oversized/unsupported transport fails closed; approved transport reaches only one read RPC.

### Task 4 — Redact, minimize, and normalize

**Files:** create `src/data/redact.js`, `src/data/normalize.js`, `tests/unit/redact.test.mjs`, `tests/unit/normalize.test.mjs`.

1. Write failing masking tests for secret-shaped tokens, email, phone, URL, bidi/control characters, HTML, Markdown, prompt prose, and overlong text.
2. Implement bounded inert-text normalization and irreversible masking.
3. Write failing tests asserting transport-only fields cannot survive projection.
4. Implement explicit field-by-field projection into frozen safe views; never spread transport objects.
5. Write failing identity tests for multiple runs, unknown identity, unassigned tasks, and duplicate profiles.
6. Implement canonical grouping and deterministic primary-run choice.
7. Add a recursive sentinel assertion proving forbidden fixture values are absent from safe output.
8. Assert logs expose counts/error classes only, never user-derived text or payload JSON.

**Acceptance:** components can receive only immutable minimized safe views; sensitive sentinels are absent.

### Task 5 — Define lifecycle and selectors

**Files:** create `src/model/states.js`, `src/model/selectors.js`, `tests/unit/states.test.mjs`, `tests/unit/selectors.test.mjs`.

1. Write failing table tests for all canonical Hermes statuses plus unknown values.
2. Implement explicit product grouping/severity labels; include `scheduled` and `review`, preserve unknown.
3. Write failing totals/filter/search tests.
4. Implement state/profile/board/text filters over allowlisted safe fields only.
5. Write failing stable-sort tests with timestamp ties and missing values.
6. Implement severity, transition recency, and stable-ID ordering.
7. Generate a deterministic synthetic 500-row fixture in test memory.
8. Benchmark selectors and define the list-windowing threshold from measured evidence.

**Acceptance:** totals/filter/search/sort are deterministic, unknown-safe, and responsive at 500 rows.

### Task 6 — Add React Query, invalidation, and freshness

**Files:** create `src/data/use-pixel-agents.js`, `src/ui/FreshnessBadge.js`; tests in unit/browser suite.

1. Write failing query-key tests for schema, board, and active gateway profile.
2. Implement one query through SDK `useQuery`; no custom polling loop.
3. Write failing tests for active/background refetch intervals and last-good retention.
4. Implement 5-second active and 30-second background polling unless the verified core contract specifies a stricter minimum.
5. Write failing event tests for exact invalidation event and malformed/wrong-board events.
6. Register `host.onEvent` invalidation only; never merge event payload into state.
7. Write failing scope-switch test proving old selection/data does not flash.
8. Clear scope selection and invalidate/refetch on board/profile changes.
9. Write failing gateway close/reopen tests.
10. Implement immediate disconnected state and full successful-refetch recovery.
11. Implement stale state after two missed active intervals while retaining last safe snapshot.
12. Verify listener cleanup on disable/hot reload.

**Acceptance:** polling converges without events; invalidations accelerate; stale/disconnected/unknown are explicit.

### Task 7 — Build dashboard header, totals, and filters

**Files:** create `PixelAgentsPage.js`, `DashboardHeader.js`, `StateTotals.js`, `AgentFilters.js`.

1. Write failing browser test for loading skeleton.
2. Render SDK `Skeleton` while no safe snapshot exists.
3. Write failing test for gateway/freshness/last-success/retry header.
4. Render native status components and a retry button that only refetches.
5. Write failing totals-to-filter interaction test.
6. Render state totals as labeled buttons with count and pressed state.
7. Write failing combined state/profile/board/search tests.
8. Render SDK `SearchField`, `Select*`, and `SegmentedControl` controls.
9. Persist presentation options only; inspect storage to prove no snapshot payload.
10. Test empty, unavailable-capability, authorization-denied, and stale-error states.

**Acceptance:** all status/controls are native, keyboard-operable, and truthful.

### Task 8 — Build list/card results and inspector

**Files:** create `AgentList.js`, `AgentCard.js`, `AgentInspector.js`.

1. Write failing keyboard-navigation and selection tests.
2. Implement semantic list/card rows with stable IDs and visible focus.
3. Write failing focus-retention test across refresh/reorder/removal.
4. Implement deterministic fallback selection.
5. Write failing wide/narrow inspector placement tests.
6. Implement responsive side inspector / inline detail using safe fields only.
7. Write failing forbidden-DOM-field sentinel test.
8. Confirm DOM and accessibility trees contain no prohibited payloads.
9. Add local fixed-row windowing if measured threshold is crossed; do not import unsupported runtime modules.
10. Verify 500-row interaction and 200% zoom.

**Acceptance:** dashboard is complete without the office, accessible, and scalable.

### Task 9 — Build deterministic Pixel Office

**Files:** create `office/layout.js`, `OfficeScene.js`, `PixelOfficePane.js`, `tests/unit/office-layout.test.mjs`.

1. Write failing pure-layout tests for running/queued/blocked/idle lanes.
2. Implement stable lane and tile coordinates from safe state only.
3. Write failing 24-occupant cap test.
4. Implement 23 representatives plus one `+N` aggregate tile.
5. Write failing accessible-label and reduced-motion tests.
6. Render DOM/CSS sprites and semantic labels; no canvas.
7. Write failing selection-sync test between office and dashboard.
8. Implement shared stable selected ID without persisting payloads.
9. Add explicit `Open dashboard` action; character selection alone does not navigate.
10. Test resize, move, close, disable, and dashboard independence.

**Acceptance:** office is supplementary, capped, accessible, movable, and never invents activity.

### Task 10 — Approve and build the asset pipeline

**Files:** create `src/assets/manifest.json`, asset scripts, generated assets, `THIRD_PARTY_ASSETS.md`.

1. Start manifest with no approved outputs.
2. Record reviewer approval for selected Kenney CC0 source classes before download.
3. Capture primary source/licence snapshots and hashes outside the runtime package.
4. Download only approved archives from primary URLs and record final URLs/hashes.
5. Select and hash only needed source files; reject whole-pack inclusion.
6. Write failing verifier tests for missing/extra/hash-mismatch/path-traversal/polyglot files.
7. Implement `verify-assets.mjs`.
8. Write deterministic crop/palette/output transformations.
9. Run build twice from clean temp directories and compare byte hashes.
10. Generate `THIRD_PARTY_ASSETS.md` with factual voluntary Kenney credit.
11. Render light/dark/custom-theme contact sheets for review.
12. Keep Arlan, legacy, and Pixel Agent Desk sources absent from all inputs and outputs.

**Acceptance:** every bundled byte is manifest-pinned, reproducible, approved CC0 or original, and theme-readable.

### Task 11 — Browser/Electron acceptance suite

**Files:** create `tests/browser/electron-fixture.ts`, fixtures, `pixel-agents.spec.ts`.

1. Mirror the installed Desktop Playwright pattern from `apps/desktop/e2e/test.ts` and `fixtures.ts`; do not invent a second browser harness.
2. Launch a disposable `HERMES_HOME` and install the built plugin artifact there.
3. Stub only the verified gateway method/event at the authenticated bridge boundary.
4. Cover route/sidebar/pane independent mounting and active navigation.
5. Cover loading, empty, totals, filters, search, stable order, selection, and inspector.
6. Cover 500 rows, office cap, keyboard, 200% zoom, narrow/wide, and reduced motion.
7. Inject malicious inert strings and assert no execution/outbound request.
8. Assert forbidden sentinels are absent from DOM, accessibility tree, storage, logs, and screenshots.
9. Cover refresh failure, stale retention, disconnect/reconnect, dropped events, and full refetch.
10. Cover board/profile scope switch without stale flash.
11. Cover light/dark/custom themes and plugin disable/re-enable uniqueness.
12. Save trace/screenshots/results as review artifacts, not runtime package files.

**Commands:** project scripts must expose `npm run test:unit`, `npm run test:contract`, `npm run test:browser`, and `npm run test:browser:visual` using the installed Desktop conventions.

**Acceptance:** all behavioral tests pass with synthetic fixtures; no real user payload is committed.

### Task 12 — Live read-only Desktop smoke

**Files:** append only redacted outcomes to `docs/review/felix-execution-evidence.md`.

1. Build from clean checkout and verify package contents.
2. Install into a disposable profile plugin directory, not Nathan's active profile.
3. Start Desktop against the installed reviewed Hermes gateway.
4. Confirm route/sidebar/pane and no plugin error toast or console error.
5. Confirm the single live read RPC succeeds with counts-only evidence.
6. Disconnect/reconnect gateway and confirm last-good/stale/recovery behavior.
7. Switch board/profile and confirm scoped reset/refetch.
8. Test light/dark, narrow/wide, pane drag/close, disable/re-enable.
9. Inspect network/RPC trace for exactly the approved read method and no extra endpoint.
10. Remove disposable profile/artifacts after evidence capture.

**Acceptance:** real runtime proves integration; evidence contains no task title/body, identity, secret, path, or payload dump.

### Task 13 — Package, audit, and hand off

**Files:** create/update clean-room audit and Felix evidence.

1. Run unit, contract, browser, visual, asset, build, and package scripts from a clean checkout.
2. Scan source and bundle for forbidden APIs, mutation verbs/methods, dynamic RPC, HTML/Markdown rendering, remote URLs, legacy paths/strings, and payload logging.
3. Verify package contains only `plugin.js`, approved assets, and required metadata/docs.
4. Confirm no source maps or test fixtures are shipped.
5. Complete clean-room input ledger without opening the legacy repository.
6. Record exact commands, exit codes, versions, and artifact hashes.
7. Commit implementation and evidence in reviewable groups.
8. Submit to independent Melvin review; do not deploy to Nathan's active profile yet.

**Acceptance:** clean checkout reproduces artifact/tests; audit proves boundaries; review package is self-contained.

## 5. Required script/verification contract

Felix should make these commands real and keep them green:

```text
npm ci
npm run test:contract
npm run test:unit
npm run build
npm run verify:package
npm run verify:assets
npm run test:browser
npm run test:browser:visual
npm test
```

Expected result is exit 0 for every command. Browser visual diffs require explicit human review even if the upstream Hermes harness reports them as artifacts rather than hard failures.

## 6. Real versus synthetic evidence boundary

**Synthetic only:** unit fixtures, 500-row data, malicious strings, screenshots committed to tests, browser RPC responses, comments/bodies/errors/tool payload sentinels, identities, task titles, board names.

**Real allowed but redacted:** Hermes version/commit, method registry count, exact approved method/event names, schema field names/types, authorization outcome, response counts, timing, pagination metadata shape, gateway state transitions, plugin load status, package hashes, test exit codes.

**Never record:** real task titles/bodies/comments/results, profile display names, recipient IDs, raw errors, workspace/attachment paths, prompts, tool payloads, transcripts, environment, credentials, or full RPC responses.

## 7. Felix execution brief

**Title:** Build clean-room Hermes Pixel Agents Desktop plugin V1 after core read-contract gate

**Inputs:** this plan; `docs/specs/clean-room-v1.md`; both `docs/research/*` files; official source/docs for the exact installed Hermes version. `/home/zoe/projects/hermes-pixel-agents` and Pixel Agent Desk are prohibited inputs.

**First action:** execute Task 0. The installed v0.19.0 baseline currently lacks the required read RPC/event. If still absent, block immediately and route Task 0A to the Hermes-core owner. Do not create `src/` feature code, weaken tests, or substitute another source.

**Execution:** follow Tasks 1–13 in order only after the core gate passes. Use test-first changes, small commits, exact commands, synthetic fixtures, and counts-only live evidence. Keep the dashboard primary and the office supplementary. Treat all gateway strings as untrusted inert data.

**Deliverables:** reproducible single-file disk plugin artifact, approved local assets, complete synthetic tests, live read-only smoke evidence, contract evidence, clean-room audit, asset provenance, and package manifest.

**Automatic NO-SHIP:** absent/ambiguous contract; renderer-invented RPC; backend/REST/SQLite/filesystem/shell/process/log/transcript path; mutation capability; real payload in fixture/evidence; stale scope leak; unknown status mapped to idle/done; unmanifested/uncleared asset; legacy input; failed browser/package test; or plugin errors.

## 8. Independent Melvin review and deployment gate

From a clean checkout, Melvin must:

1. Reproduce Hermes version and live method/event contract independently.
2. Trace every rendered field from RPC decoder through projector/selectors to DOM/storage.
3. Re-run every command in section 5 and inspect actual output/artifacts.
4. Search source and bundle for forbidden data paths/capabilities and legacy material.
5. Recompute package and asset hashes and reopen primary licence sources.
6. Replay malicious-string, scope-switch, disconnect/reconnect, 500-row, accessibility, theme, pane, and enable/disable cases.
7. Confirm only one literal read RPC and invalidation-only event handling exist.
8. Write `docs/review/pixel-agents-v1-independent-review.md` with findings and `SHIP`/`NO-SHIP`.

**SHIP gate:** zero blocker/high findings, every test passes, contract and licence are unambiguous, package is reproducible, and no decision is deferred to an unsafe runtime fallback.

**Deployment gate:** only after SHIP may a separate authorized action install the verified artifact hash into Nathan's active `$HERMES_HOME/desktop-plugins/pixel-agents/`. Installation, Hermes config changes, gateway restart, service exposure, and live Kanban mutation are outside this plan task.

## 9. Risks and fallback paths

- **Core contract delay:** remain on NO-GO; dashboard/office implementation does not begin.
- **Contract drift:** fail unsupported schema/version closed with native unavailable state; update fixture/decoder only after source/live re-verification.
- **Event gaps:** polling remains authoritative; event handler only invalidates.
- **Remote denial:** show capability unavailable; no `ctx.rest/socket` or local fallback.
- **Scale regression:** retain bounded pages, selector benchmarks, list windowing, and office cap.
- **Privacy regression:** strict projection, synthetic sentinels, DOM/storage/log scans, and independent field trace.
- **Asset uncertainty:** ship original placeholder geometry/state markers or no decorative sprite; never ingest an ambiguous pack.
- **Build incompatibility:** keep emitted runtime to one plain ESM file and the three SDK-provided import specifiers; fail package verification rather than add runtime loaders.

## 10. Final decision

No Nathan decision is genuinely required. V1 direction and safety boundaries are fully resolved. The sole blocker is the missing sanctioned Hermes-core read RPC/event; it must be engineered and reviewed, not waived.