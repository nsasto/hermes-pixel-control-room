# Clean-room Hermes Pixel Agents V1

Status: implementation-ready specification
Product owner decision: new Hermes-native desktop plugin; no adaptation of any legacy application
Target plugin id: `pixel-agents`
Primary route: `/pixel-agents`

## 1. Recommendation

Build V1 as a read-only Hermes Desktop disk plugin with two contributions:

1. a full `/pixel-agents` operational dashboard reached from the Hermes sidebar; and
2. an optional `Pixel Office` pane docked below the workspace and movable by the user.

The dashboard is the product. The office is a compact, supplementary spatial rendering of the same normalized snapshot. Both consume one read-only data adapter. No plugin-owned backend, filesystem reader, shell command, transcript parser, PID probe, service, listener, or externally reachable endpoint is permitted.

The implementation must stop at the contract-verification gate if the installed Hermes gateway does not expose a sanctioned read-only Kanban/delegation snapshot over `host.request`. Do not bridge the gap with `ctx.rest`, direct SQLite access, generic shell execution, or app internals. Add or obtain a sanctioned core read RPC first, then continue.

## 2. Goals and non-goals

### Goals

- Show current Hermes agents and task lifecycle state at a glance.
- Remain useful at 5, 50, and 500 task/agent rows through totals, search, filters, a virtualizable list/card view, and a selected-agent inspector.
- Reuse Hermes navigation, pane layout, React Query client, controls, status semantics, and theme tokens.
- Represent only sanctioned Hermes state with explicit freshness, source, and projection rules.
- Preserve privacy by minimizing fields before data reaches render components.
- Supply a deterministic, provenance-checked asset pipeline.
- Prove behavior with browser-level tests and a live Hermes Desktop smoke test.

### Non-goals

V1 does not:

- create, edit, assign, block, unblock, complete, archive, or comment on tasks;
- spawn, stop, message, configure, or otherwise mutate agents;
- send chat messages or expose composer extensions;
- infer activity from Claude hooks, transcript files, process IDs, logs, shell output, filesystem state, or timing heuristics outside sanctioned response fields;
- ship a Python `plugin_api.py`, web server, WebSocket endpoint, service install, or network listener;
- reproduce Pixel Agent Desk assets, source, layouts, names, animations, or implementation details;
- make the office view the only or primary operational interface;
- promise remote operation beyond what the Hermes gateway and desktop SDK already support.

## 3. User experience

### 3.1 Sidebar and route

Register a sidebar row labeled **Pixel Agents** with codicon `organization` and path `/pixel-agents`. It opens a full route in the workspace pane.

Dashboard layout, top to bottom:

1. **Header:** title, gateway/freshness indicator, last successful refresh, manual retry button.
2. **State totals:** All, Running, Ready, Blocked, Waiting, Done, Unknown. Totals are buttons that set the state filter.
3. **Controls:** Hermes `SearchField`; state, profile, and board filters using native `Select`/`SegmentedControl`; list/card density toggle.
4. **Primary results:** keyboard-navigable agent cards/list. Each row shows display name/profile, normalized state, current task title if safe, elapsed/staleness, and board. Results are sorted deterministically: actionable severity, most recent transition, stable id.
5. **Selected-agent inspector:** responsive right column on wide viewports and inline/detail tab on narrow viewports. It shows only allowlisted context fields described below.
6. **Empty/error states:** native `Skeleton`, `EmptyState`, and `ErrorState`; stale data remains visible with a warning after refresh failure.

The query string or plugin storage may remember presentation-only state (filters, selected stable id, office visibility). It must never persist task bodies, comments, results, prompts, tool data, or other operational payloads.

### 3.2 Agent identity and grouping

An “agent” is a view-model projection, not a new Hermes entity:

- active worker: group current task/run by the canonical profile/assignee identity supplied by Hermes;
- idle known profile: include only if the sanctioned snapshot explicitly includes it;
- multiple concurrent runs for one profile: one agent card with a run count and deterministic primary run; inspector lists all current safe task summaries;
- unassigned task: appears in totals/task results only, never as a fabricated agent;
- unknown or missing identity: group under a stable opaque source id and label `Unknown agent`.

Do not infer identity from task prose, workspace paths, email, model text, or process metadata.

### 3.3 Pixel Office pane

Register a pane titled **Pixel Office** with `placement: 'bottom'`, `dock: { pane: 'workspace', pos: 'bottom' }`, and initial `height: '220px'`. The user can move/close it using native layout behavior.

The pane renders at most 24 active/recent agents in deterministic lanes (running, queued, blocked, idle). Above that threshold it shows 23 representatives plus a `+N` aggregate tile; the dashboard remains the complete view. Selecting a character selects the same stable agent id and navigates to `/pixel-agents` only on an explicit “Open dashboard” action.

Use DOM/CSS sprites for V1 unless a measured spike proves canvas materially simpler. If canvas is chosen, it must use `ResizeObserver`, resize both bitmap dimensions and CSS dimensions for device pixel ratio, derive colors via `getComputedStyle(...).getPropertyValue('--ui-*')`, provide an equivalent accessible DOM list, and suspend animation when hidden or `prefers-reduced-motion` is set. No decorative animation may imply lifecycle state that is not present in the snapshot.

## 4. Architecture and contracts

### 4.1 Desktop SDK surface (confirmed)

The authoritative SDK reference is:
`https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk/`.

Use only imports supported by the installed target version: `@hermes/plugin-sdk`, `react`, and `react/jsx-runtime`. Disk plugins are uncompiled ESM, so use `jsx()`/`jsxs()` rather than JSX.

Required contributions:

| Purpose | SDK area/export | Contract |
|---|---|---|
| Full page | `ROUTES_AREA` | `data: { path: '/pixel-agents' }`, `render` |
| Sidebar row | `SIDEBAR_NAV_AREA` | `data: { path, label: 'Pixel Agents', codicon: 'organization' }` |
| Office | `PANES_AREA` / `'panes'` | `title`, `render`, `data: { placement, dock, height }` |
| Optional command | `PALETTE_AREA` | read-only navigation command calling `host.navigate('/pixel-agents')` |

Required SDK facilities: `host.state.gateway`, `host.state.profile`, `host.state.viewport`, `host.request`, `host.onEvent`, `useQuery`, `queryClient`, `useValue`, native UI controls, `StatusDot`, `relativeTime`, and theme variables. Do not import app internals. Do not call `host.restartGateway`, `useMutation`, `ctx.rest`, or `ctx.socket` in V1.

### 4.2 Pre-code contract-verification gate

The SDK documentation confirms that `host.request(method, params)` reaches gateway JSON-RPC and `host.onEvent(type, fn)` subscribes to gateway events, but documentation alone does not freeze a Kanban/delegation payload. Before feature code, record the installed Hermes version and verify the actual method registry, event names, envelope, board scoping, remote behavior, and authorization.

Create `docs/research/hermes-read-contract.md` during implementation with captured, redacted examples and a version/date. The build may continue only if all rows below are answered from current official docs/source and a live gateway call:

| Area to verify | Required answer/proof |
|---|---|
| Read method | Exact existing method name(s) for a Kanban/delegation snapshot. If none exists, identify the sanctioned core RPC change; never invent a renderer-only fallback. |
| Request params | Exact board/profile/status filters, pagination/cursor, maximum page size, and whether omitted board means current/default. |
| Response | Exact schema, nullable fields, enum values, stable IDs, timestamp unit/timezone, redaction already applied, and pagination/freshness metadata. |
| Events | Exact event type(s) and envelope fields for task/run/profile lifecycle changes; prove whether event payload is full data or invalidation-only. |
| Reconnect | Behavior after gateway reconnect, dropped events, profile switch, board switch, and OAuth remote use. |
| Authorization | Confirm calls use the desktop’s existing authenticated gateway bridge and expose no extra network surface. |
| Read-only boundary | Prove the adapter calls only allowlisted read methods. Add a test that fails if an unapproved method string enters production code. |

Preferred gateway contract if an equivalent does not already exist (names are **proposed**, not claims about the current SDK):

```ts
type PixelAgentsSnapshotRequest = {
  board?: string
  cursor?: string
  limit: number // <= 500
}

type PixelAgentsSnapshot = {
  schemaVersion: 1
  generatedAt: string // RFC 3339 UTC
  nextCursor: string | null
  profiles: Array<{ id: string; displayName: string | null }>
  tasks: Array<{
    id: string
    board: string
    title: string | null
    status: 'triage'|'todo'|'ready'|'running'|'blocked'|'done'|'archived'|string
    assigneeId: string | null
    updatedAt: string
    blockedKind: 'dependency'|'needs_input'|'capability'|'transient'|null
  }>
  runs: Array<{
    id: string
    taskId: string
    profileId: string
    status: 'running'|'completed'|'failed'|string
    startedAt: string | null
    endedAt: string | null
  }>
}
```

The minimal contract intentionally excludes body, comments, prompts, tool calls/results, workspace path, environment, command lines, attachments, recipient identifiers, model transcripts, and raw run errors. A lifecycle event should carry `{ schemaVersion, board, entityType, entityId, revision }` and trigger React Query invalidation; polling remains the correctness path.

### 4.3 Data flow

```text
Hermes authenticated gateway
  -> allowlisted read RPC via host.request
  -> strict runtime decoder (reject unknown schema version; tolerate unknown enum values)
  -> redaction/minimization projector
  -> normalized immutable PixelAgentsSnapshot
  -> React Query cache (5 s active refetch; 30 s background; event invalidation)
  -> selectors (totals/search/grouping/selection)
  -> Dashboard + Pixel Office
```

Rules:

- One query key: `['pixel-agents', 'snapshot', schemaVersion, board, profile]`.
- Events only invalidate; they do not become authoritative state.
- Abort or ignore superseded requests on board/profile changes.
- Keep last good snapshot on transient failure and label it stale.
- After two polling intervals without success, show `stale`; after gateway closes, show `disconnected` immediately.
- Unknown statuses map to `unknown`, remain visible, and never map to `idle` or `done`.
- Search operates only over allowlisted display name, profile id, safe task title, safe task id, status, and board.
- All sorting uses stable IDs as final tie-breakers.

## 5. Privacy, redaction, and threat model

### Assets and trust boundaries

- Desktop plugins execute in the renderer realm with full app authority; SDK error isolation is not a sandbox.
- Gateway responses and lifecycle text are untrusted display data.
- Bundled third-party images are supply-chain inputs.
- Plugin storage is durable local state.
- Browser/Electron rendering can leak content through DOM, accessibility trees, screenshots, logs, and copy actions.

### Threats and controls

| Threat | Control |
|---|---|
| Prompt injection in task titles/status text | Treat all fields as inert text; React text children only; no `dangerouslySetInnerHTML`, Markdown, URL activation, code evaluation, or instruction following. |
| Secret/PII exposure | Data contract excludes bodies/comments/results/errors/workspace paths. Projector allowlists fields and applies a final secret/PII-pattern masking pass to displayable titles without retaining the original in UI state. |
| Over-broad RPC authority | Static allowlist with one/few read methods; no dynamic method names; contract test rejects mutation methods and forbidden imports/APIs. |
| Cross-board/profile leakage | Explicit query-key scoping; clear selection and cached view on scope change; verify gateway authorization and board semantics. |
| Stale/misleading state | Visible freshness and gateway indicators; last-good-data warning; unknown state is explicit. |
| XSS/DOM injection | Text rendering only, no HTML parser, sanitize accessible labels, bounded string lengths. |
| Storage leakage | Persist presentation preferences and stable selected id only; never persist snapshot payloads. |
| Asset supply-chain substitution | Pinned source URL, archive SHA-256, per-file hashes, licence snapshot, manifest validation, deterministic crop/export. |
| Network/service exposure | No backend, listener, external server, fetch/XHR, service install, or remote asset loading. Assets bundle locally. |
| Resource exhaustion | Pagination/bounds, string length caps, selector memoization, office cap, virtualization threshold, reduced animation. |

Redaction boundary: raw RPC response exists only inside the query/decoder call long enough to validate and project. Render components receive `SafeAgentView`/`SafeTaskView`, never transport objects. Development fixtures must be synthetic. Logs may contain counts, schema/version, duration, and opaque error classes, but no response payload or user-derived strings.

## 6. Proposed repository structure and expected artifacts

```text
README.md
package.json
src/
  plugin.js                         # plugin export and contribution registration only
  data/
    contract.js                     # exact method constants and runtime decoder
    fetch-snapshot.js               # host.request wrapper
    normalize.js                    # transport -> safe immutable model
    redact.js                       # bounded display-field masking
    use-pixel-agents.js             # React Query + event invalidation
  model/
    states.js                       # lifecycle mapping and severity order
    selectors.js                    # totals, filters, grouping, stable sort
  dashboard/
    PixelAgentsPage.js
    DashboardHeader.js
    StateTotals.js
    AgentFilters.js
    AgentList.js
    AgentCard.js
    AgentInspector.js
  office/
    PixelOfficePane.js
    OfficeScene.js
    layout.js
  ui/
    FreshnessBadge.js
  assets/
    generated/                      # deterministic approved outputs only
    manifest.json                   # source and output provenance
  styles.css                        # only if SDK loader supports local style delivery; otherwise scoped classes in plugin
scripts/
  verify-assets.mjs
  build-assets.mjs
tests/
  unit/contract.test.mjs
  unit/normalize.test.mjs
  unit/redact.test.mjs
  unit/selectors.test.mjs
  unit/office-layout.test.mjs
  browser/pixel-agents.spec.ts
  browser/fixtures/snapshot-v1.json
docs/
  specs/clean-room-v1.md
  research/asset-licensing-shortlist.md
  research/hermes-read-contract.md  # implementation-stage verification artifact
  review/clean-room-audit.md         # implementation-stage provenance audit
THIRD_PARTY_ASSETS.md
```

Before implementation, Felix must confirm whether the target distribution is a no-build disk plugin or a separately built package that emits the single uncompiled `plugin.js`. The shipped install artifact must obey the disk-plugin import restriction and place files under `$HERMES_HOME/desktop-plugins/pixel-agents/`. Do not add a backend manifest.

## 7. Clean-room migration/non-migration matrix

The legacy repository is reference-only, dirty, and out of bounds. Do not open it during implementation unless Nathan commissions a separate clean-room audit. No file, asset, snippet, fixture, schema, name list, generated output, commit, dependency lock, or build configuration may be copied or imported.

| Potentially useful legacy element | Decision | Clean-room handling |
|---|---|---|
| Product idea: agents in a pixel office | Reimplement concept | Use this specification and public Hermes SDK only. |
| Operational agent cards, filters, totals, inspector | Reimplement concept | New information architecture and components using Hermes native controls. |
| Standalone app / VS Code architecture | Do not migrate | Native desktop route and pane only. |
| Claude hooks/provider adapters | Do not migrate | Forbidden; sanctioned Hermes gateway RPC only. |
| Transcript/log parsing | Do not migrate | Forbidden data source. |
| PID/process inspection | Do not migrate | Forbidden data source. |
| Shell/CLI bridge and service installer | Do not migrate | Forbidden; no server/service. |
| Task/agent mutation controls | Do not migrate | V1 read-only. |
| State model and lifecycle mappings | Reimplement after audit | Derive solely from verified Hermes enums; unknown values remain unknown. |
| Office layout concept | Reimplement | New deterministic lane algorithm with scale/accessibility limits. |
| UI source/styles/components | Do not migrate | Hermes SDK controls and theme variables; new code. |
| Pixel Agent Desk or legacy graphics | Do not migrate | Restrictive/uncleared for this use; approved manifest assets only. |
| Tests/acceptance ideas | Concepts may be reimplemented | Rewrite synthetic fixtures and assertions from this spec; no copied test text/code. |
| Documentation wording/screenshots | Do not migrate | New docs and synthetic screenshots only. |
| Dependencies/build scripts/config | Do not migrate blindly | Select the minimum current toolchain from clean-room requirements. |

`docs/review/clean-room-audit.md` must list every implementation input (this spec, official Hermes docs/source/version, approved asset pages/licence snapshots) and attest that no legacy repository files were read or copied.

## 8. Sequenced implementation plan

### Phase 0 — verification gate

1. Record clean git baseline and create `docs/research/hermes-read-contract.md`.
2. Verify installed SDK exports, disk asset/style loading behavior, route/sidebar/pane payloads, gateway RPC method(s), event names/envelope, pagination, board/profile scope, and remote behavior against official source plus live calls.
3. Decide whether the existing read contract suffices. If not, stop and create a separate Hermes core RPC card; do not implement a workaround.
4. Add synthetic contract fixtures and a failing allowlist test.

Exit: exact, redacted contract evidence exists and independent reviewer agrees it is sanctioned and read-only.

### Phase 1 — bootstrap/plugin shell

1. Initialize the minimal test/build package without a backend or network dependency.
2. Register `/pixel-agents`, sidebar nav, palette navigation command, and bottom office pane.
3. Render native skeleton/empty placeholders and verify hot reload, enable/disable, route activation, pane docking/dragging, narrow viewport, and theme switching.
4. Add import-boundary lint/test: only the three allowed specifiers; forbid `fetch`, XHR, WebSocket, Node built-ins, child processes, filesystem, SQL/SQLite, `ctx.rest/socket`, `host.restartGateway`, and mutation hooks.

Exit: plugin shell loads without toast/console errors and has no data access yet.

### Phase 2 — data adapter

1. Implement method constants and strict decoder from the verified contract.
2. Write redaction and normalization tests first, including malformed payloads, unknown schema/status, oversized strings, missing identity, duplicate ids, and sensitive title patterns.
3. Add `host.request` query, event-driven invalidation, polling fallback, scope-key isolation, last-good snapshot, and freshness model.
4. Prove raw transport objects never cross the adapter boundary and no payload is logged or persisted.

Exit: deterministic safe snapshot and selectors pass unit/contract tests; network/runtime failures are visible and non-fatal.

### Phase 3 — dashboard

1. Implement totals and filters, then search and deterministic sorting.
2. Implement accessible list/card results and responsive inspector.
3. Add virtualization or windowing at the measured threshold without importing an unsupported runtime module; if a dependency cannot bundle into the single artifact, implement a small fixed-row window locally.
4. Cover keyboard navigation, focus retention after refresh, empty/error/stale states, 200% zoom, and reduced motion.

Exit: dashboard remains responsive with a synthetic 500-row snapshot and is fully operable without the office.

### Phase 4 — office pane

1. Implement pure deterministic lane/layout functions with tests.
2. Render locally bundled sprites, semantic labels, representative cap, `+N`, selection sync, and explicit dashboard navigation.
3. Add `ResizeObserver` only if canvas is approved; suspend hidden/reduced-motion work.
4. Prove office removal/disable does not affect dashboard or data adapter.

Exit: supplementary pane resizes cleanly, never fabricates state, and meets accessibility fallback requirements.

### Phase 5 — asset pipeline

1. Approve sources from `asset-licensing-shortlist.md`; do not download until approval is recorded in the manifest.
2. Pin source archive URL, retrieval date, source page snapshot/hash, licence URL/snapshot/hash, archive SHA-256, selected inputs, transformations, and output hashes.
3. Generate only required sprites deterministically; enforce nearest-neighbor scaling, palette/theme contrast checks, dimensions, orphan-file rejection, and no remote URLs.
4. Generate `THIRD_PARTY_ASSETS.md`, retaining voluntary Kenney credit although CC0 does not require attribution.

Exit: clean checkout can verify every bundled byte against the manifest and reproduce generated outputs.

### Phase 6 — test and review gates

1. Run unit, contract, asset, browser, package, and forbidden-capability scans.
2. Run live Desktop smoke tests on light/dark themes, narrow/wide layouts, gateway disconnect/reconnect, plugin enable/disable, and pane dragging.
3. Complete clean-room and licence audit.
4. Independent reviewer inspects contract evidence, RPC allowlist, redaction boundary, browser evidence, assets, package contents, and git diff.

Exit: all objective SHIP criteria below pass; any blocker is NO-SHIP.

## 9. Browser-level acceptance tests

Use Playwright against the desktop renderer test harness or Electron app. Intercept only the verified gateway bridge in tests; fixtures are synthetic and schema-valid.

1. Sidebar row opens `/pixel-agents` and active styling follows route changes.
2. Route and pane mount independently; closing/moving the pane does not affect the page.
3. Loading shows native skeleton; empty valid snapshot shows native empty state.
4. Totals exactly match normalized fixture states, including unknown and multi-run profiles.
5. Search is case-insensitive, bounded to allowlisted fields, and clears predictably.
6. Combined state/profile/board filters produce the expected stable ordered IDs.
7. Selecting with mouse and keyboard updates the inspector; removed selection falls back deterministically.
8. 500-row fixture remains interactive and does not render all heavy office characters.
9. Unknown enum/schema handling never crashes or silently labels work idle/done.
10. Injected `<img onerror=...>`, Markdown links, bidi controls, long strings, secret-shaped tokens, phone/email-shaped text, and prompt-injection prose render as inert, bounded, masked text with no HTML execution or outbound request.
11. Inspector/DOM/storage contain no task body, comment, result, raw error, workspace path, attachment path, prompt, or tool payload fixture sentinel.
12. Refresh failure preserves last good data with stale warning; reconnect refetches and removes warning only after success.
13. Event invalidates the query; dropped/no events still converge through polling.
14. Board/profile switch clears cross-scope selection and never flashes the previous scope’s rows.
15. Light/dark/custom theme screenshots contain no hardcoded-color contrast regressions.
16. 200% zoom, narrow viewport, keyboard-only use, focus visibility, screen-reader labels, and reduced motion pass.
17. Pane resize produces no blank/blurry canvas area if canvas is used.
18. No test observes `fetch`, external request, backend route, mutation RPC, filesystem/shell/process API, or persistent snapshot payload.
19. Plugin disable removes all contributions and listeners; re-enable registers one copy only.
20. Production package contains only approved code/docs/assets and no legacy paths, source maps with sensitive fixtures, or unmanifested binary.

## 10. Build card brief — Felix

**Title:** Build clean-room Hermes Pixel Agents desktop plugin V1

**Inputs:** this specification, `asset-licensing-shortlist.md`, current official Hermes Desktop Plugin SDK docs/source, and verified live gateway contract. The legacy repository and Pixel Agent Desk are prohibited inputs.

**Deliverables:** repository structure in section 6; installable `pixel-agents` disk plugin; synthetic tests; verified asset manifest; `THIRD_PARTY_ASSETS.md`; contract and clean-room audit docs; browser/live-smoke evidence.

**Execution rule:** complete Phase 0 first. If a sanctioned read-only snapshot contract is absent, block with exact evidence and create/route a separate Hermes core RPC task. Do not add a backend or direct database reader.

**Objective SHIP criteria:**

- all six phases complete in order and every exit gate evidenced;
- exact RPC and event contract is versioned, live-verified, read-only, and statically allowlisted;
- forbidden capability/import scan is clean;
- dashboard works at 500 rows and office remains supplementary/capped;
- all 20 browser acceptance tests pass;
- unit/contract/asset/package tests pass from a clean checkout;
- light/dark/narrow/wide/disconnect/reconnect/enable-disable live smoke passes without console errors or plugin error toast;
- render state contains only minimized safe view models and storage contains presentation preferences only;
- all bundled assets are manifest-pinned, reproducible, CC0 or original, and no unmanifested binary exists;
- clean-room audit confirms no legacy/Pixel Agent Desk material was read or copied;
- independent review returns SHIP with zero blockers/high findings.

**Explicit non-goals:** no V1 mutations, messaging, agent control, backend/server/service, direct database/filesystem/shell/process access, transcript/log parsing, remote asset loading, legacy migration, or office-first UI.

## 11. Independent-review brief — Melvin

Review from a clean checkout without relying on Felix’s narrative. Inspect the full diff, built artifact, contract evidence, asset archives/manifests, and real test output.

Required review:

1. trace every rendered field from exact RPC response through decoder, projector, selectors, DOM, and storage;
2. independently verify method/event names and schemas against the pinned Hermes version and live gateway;
3. search production code and bundle for mutation methods, dynamic RPC names, backend/network calls, shell/filesystem/process/SQLite access, transcript/log parsing, forbidden imports, raw HTML/Markdown, payload logging, and legacy paths/strings;
4. recompute archive/output hashes and compare asset source/licence evidence to primary URLs;
5. replay all browser tests and desktop smoke matrix, including malicious strings and scope changes;
6. confirm dashboard scale/accessibility independently of the office;
7. confirm package contents and clean-room audit.

**SHIP:** all Felix criteria pass; zero blocker/high findings; no ambiguous licence or contract; no decision is being silently deferred to runtime.
**NO-SHIP:** any unsanctioned data path, mutation capability, ambiguous/missing contract field, privacy sentinel leak, unverified/unmanifested asset, legacy material, office-only operational state, failed acceptance test, or irreproducible evidence.

Review output: `docs/review/pixel-agents-v1-independent-review.md` with finding severity, file/line evidence, commands and real outputs, residual risks, and final `SHIP`/`NO-SHIP` verdict.

## 12. Decisions and residual risks

No Nathan decision is required to start. The product direction, read-only boundary, dashboard primacy, clean-room rule, and candidate asset strategy are fixed.

Implementation may surface one legitimate blocker rather than a product-choice request: the current Hermes version may lack a sanctioned read-only Kanban/delegation RPC suitable for desktop plugins. That is a core capability dependency and must be resolved explicitly; it is not permission to use a local backend or direct database access.

The two highest residual risks are SDK/RPC contract drift and accidental information disclosure through “helpful” context fields. Versioned contract fixtures, live verification, minimal transport schema, unknown-safe decoding, and independent field-level review are mandatory controls.
