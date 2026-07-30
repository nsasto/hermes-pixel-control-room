# Hermes Pixel Agents V1 — independent review

Review date: 2026-07-30
Reviewed commit: `443c30b Implement clean-room Pixel Agents desktop plugin V1`
Reviewer: Melvin / Scout
Final verdict: **NO-SHIP**

## Executive decision

The artifact has a narrow read-only capability boundary, reproduces the expected SHA-256, and the installed Hermes gateway independently exposes the documented `kanban.snapshot.v1` method and `kanban.changed.v1` invalidation event. Those gates pass.

The implementation does not satisfy the V1 product, runtime, privacy-verification, or acceptance-test gates. Most importantly, `readSnapshot()` re-normalizes already-normalized page objects and corrupts profile/assignee identity on every successful read; the claimed browser and visual suites are static source-string checks rather than browser/Electron tests; and major required dashboard, inspector, scope, freshness, scale, accessibility, and lifecycle behavior is absent. These are blocker/high findings, so the objective SHIP rule cannot pass.

No deployment to Nathan's active profile was performed.

## Independent contract verification

Installed Hermes inspected at `/home/zoe/.hermes/hermes-agent`:

- `hermes --version`: Hermes Agent v0.19.0 (2026.7.20), local commit `a2f3626d`.
- Live registry import: `methods_count 142`.
- Live registry Kanban methods: exactly `['kanban.snapshot.v1']`.
- Installed implementation: `tui_gateway/methods_kanban.py` registers only `kanban.snapshot.v1` and returns the minimized version-1 profiles/tasks/runs schema with stable `createdAt,id` pagination, limit 1–200, board/profile scope, and no mutation method.
- Installed event implementation: `tui_gateway/server.py` broadcasts `kanban.changed.v1`; `tui_gateway/methods_kanban.py` constructs only `{schemaVersion, board, entityType, entityId, revision}`.
- Installed contract tests cover minimized output, unknown states, cursor/scope validation, cross-board isolation, mutation rejection, and invalidation-only event payloads.

Contract conclusion: **PASS** for method/event existence, names, minimized schema, and read-only gateway boundary.

## Rendered-field trace

Transport fields retained by `normalizeSnapshot()`:

| Transport field | Safe-model field | Render/use site | Review |
|---|---|---|---|
| `board` | `snapshot.board`, copied to each task | Header; search | Bounded via `safeId`; no board selector/query scope exists. |
| `profile` | `snapshot.profile` | Query result only | Not rendered; request does not send profile despite query key containing active profile. |
| `revision` | `snapshot.revision` | Header | Numeric fallback; displayed as inert React text. |
| `profiles[].name` | `id`, redacted `label` | Agent card/office identity | Intended safe path, but destroyed by the second normalization in `readSnapshot()`. |
| `profiles[].onDisk` | `onDisk` | Not rendered | Boolean projection. |
| `profiles[].taskCounts` | copied object | Not rendered | Not strictly decoded; arbitrary keys/values survive into query state. |
| `tasks[].id` | `task.id` | Card/search | Bounded inert ID. Duplicate/invalid IDs collapse to shared fallback rather than rejecting. |
| `tasks[].title` | redacted `task.title` | Card/search | Bounded and masked, React text only. Tests do not execute the redactor. |
| `tasks[].assignee` | `assigneeId` | Agent grouping | Intended safe path, but lost during second normalization. |
| task status fields | `status`, `group` | Totals/card/search/office | Unknown task status maps to `unknown`; scheduled/review metadata is not preserved separately. |
| task timestamps | numeric safe fields | Relative-time display/sort | Type fallback only; malformed values are silently replaced rather than strict rejection. |
| `currentRunId` | safe numeric field | Not rendered | Retained but unused. |
| run identity/status/time/outcome | normalized run object | Grouping and run count | Run status/outcome are retained but not safely summarized or inspected; primary-task choice does not follow the required primary-run rule. |

Storage trace: production code does not call plugin storage, so no snapshot is persisted. Presentation preferences and selected identity are also not implemented.

DOM/accessibility trace: visible user-derived text is passed as React children/title/ARIA strings, with no HTML/Markdown renderer or `dangerouslySetInnerHTML`. However, no mounted-DOM or accessibility-tree test proves forbidden sentinels absent.

## Findings

### Blocker — snapshot pagination path corrupts identity on every read

Evidence: `src/plugin.js:157-175`.

Each page is normalized by `readSnapshotPage()`. `readSnapshot()` then builds `merged` from those safe objects and calls `normalizeSnapshot(merged)` again. The second pass expects transport shapes (`profile.name`, `task.assignee`, `run.profile`) but receives safe shapes (`profile.id`, `task.assigneeId`, `run.profileId`). Consequently profiles collapse to `profile:unknown`, task assignees become `null`, and run profiles become `profile:unknown`, even for a one-page response. The resulting dashboard cannot truthfully group or label agents.

Required remediation: decode each raw page exactly once, merge through an explicitly typed safe-page merger, reject inconsistent board/profile/revision/order scope, and add executable one-page and multi-page tests that assert preserved identities and no duplicates.

### Blocker — required browser/Electron and visual acceptance evidence does not exist

Evidence: `tests/browser/pixel-agents.spec.mjs:1-5`, `tests/browser/pixel-agents-visual.spec.mjs:1-6`, `docs/review/felix-execution-evidence.md:56-57,74-76`.

The scripts named `test:browser` and `test:browser:visual` only read `dist/plugin.js` and search for literal strings/theme tokens. They do not launch a browser or Hermes Desktop, mount React, invoke the RPC adapter, render fixtures, inspect DOM/accessibility/storage/network, exercise reconnect/scope changes, test keyboard behavior, or produce screenshots. This fails the explicit 20-case browser gate and live disposable-profile smoke gate.

Required remediation: use the installed Hermes Desktop Playwright/Electron harness in a disposable `HERMES_HOME`; stub the verified bridge contract; execute the complete acceptance matrix; retain traces/screenshots as review artifacts; and smoke-load the release artifact without touching Nathan's active profile.

### High — most required dashboard product surface is absent

Evidence: `src/plugin.js:263-291`.

Missing required behavior includes profile and board filters, density control, selected-agent state, responsive inspector, all-current-safe-task summaries, blocked kind, last-success timestamp, presentation persistence, keyboard selection/focus retention, deterministic fallback selection, and explicit unavailable/authorization variants. The implementation is a totals/search/card list, not the specified V1 dashboard.

### High — scope isolation and event matching are incomplete

Evidence: `src/plugin.js:152-191,305-310`.

The request never sends `board` or `profile`; there is no board state/control; the query key omits board; and the event listener invalidates every Pixel Agents snapshot after checking only that `board` is a string. It does not match the event board/profile to a scoped query. A profile change changes the cache key without changing the RPC scope, so the key claims isolation the transport does not enforce.

Required remediation: define exact active board/profile scope, send it in every request/page, include both in the key, clear selection/data before scope display, reject cross-scope page responses/cursors, and invalidate only matching scope.

### High — lifecycle and freshness semantics are not implemented

Evidence: `src/plugin.js:181-191,257-260,270-272`.

There is no 30-second background interval, no last-success timestamp, no two-missed-active-interval stale transition, no explicit full refetch after reconnect, and no retained last-good display while disconnected (the route replaces the dashboard with `ErrorState`). `query.isFetching` is labeled `refreshing`, but successful historical freshness is not tracked.

### High — strict decoder and executable privacy tests are missing

Evidence: `src/plugin.js:77-150`; `tests/unit/contract.test.mjs`, `redact.test.mjs`, `selectors.test.mjs`, and `states.test.mjs`.

The tests inspect source text rather than import and execute decoder/redactor/selectors. The decoder does not strictly validate required primitive types, duplicate IDs, timestamp ranges, `limit`, page consistency, cursor invariants, `taskCounts`, or run status/outcome bounds. Invalid IDs collapse to repeated fallback IDs, creating identity collisions. No recursive sentinel test proves transport-only values absent from safe output, DOM, accessibility output, storage, or logs.

### High — agent grouping violates the unassigned-task and primary-run rules

Evidence: `src/plugin.js:198-221`.

Unassigned tasks are grouped into a fabricated `profile:unknown` agent, while the specification requires unassigned tasks to appear only in totals/task results and never as a fabricated agent. Primary selection is task severity/recency rather than the required deterministic running-run-first, latest transition/start, stable run-ID rule. Done/archived tasks can determine an agent card, and concurrent run summaries are not exposed in a read-only inspector.

### High — 500-row scale gate is not met

Evidence: `src/plugin.js:280`.

`filtered.slice(0, 500).map(...)` renders up to all 500 cards. There is no measured threshold, virtualization/windowing, benchmark, or browser interaction evidence. The slice also silently hides records above 500 rather than providing pagination/summary UX.

### Medium — office cap and semantics differ from the specification

Evidence: `src/plugin.js:242-254,294-302`.

At exactly 24 agents the office renders 23 representatives plus `+1`; aggregation should begin only above 24. Tile buttons do not synchronize selection with the dashboard, and the layout has no resize, narrow-pane, reduced-motion, or mounted accessibility verification. It is DOM/CSS and supplementary, which is directionally correct.

### Medium — declared method constant is not used

Evidence: `src/plugin.js:22,152-154`.

`SNAPSHOT_METHOD` is declared but the request repeats the string literal. This is not unsafe by itself, but it undermines the claimed single source of truth. The static allowlist also only detects literal `host.request('...')` calls and would not fail a future dynamic method invocation.

### Medium — source tests produce false confidence

Evidence: all files under `tests/unit/` except the fixture.

The seven reported Node test files predominantly assert that function names or string fragments exist. They do not test behavior, malformed payload rejection, redaction examples, state tables, selectors, office layout, event invalidation, cleanup, or the 500-row case. `npm test` passing therefore does not establish the acceptance claims.

## Forbidden-capability and provenance audit

PASS observations:

- Production imports are limited to `@hermes/plugin-sdk`, `react`, and `react/jsx-runtime`.
- One literal `host.request('kanban.snapshot.v1', ...)` call exists.
- No production `ctx.rest`, `ctx.socket`, `host.restartGateway`, `useMutation`, `fetch`, XHR, WebSocket, Node filesystem/process, SQLite, backend manifest, service, listener, raw HTML, or Markdown rendering was found.
- `dist/` contains only `plugin.js`; no source map, fixture, backend, binary, or asset is shipped.
- Asset manifest intentionally approves no outputs. `THIRD_PARTY_ASSETS.md` records no third-party assets; the office uses DOM/CSS geometry and Hermes theme variables.
- Commit history and reviewed repository diff show a clean-room implementation derived from the specification and installed Hermes source. No legacy code/assets are present in the commit. The author's statement that the prohibited repository was not opened cannot be independently proven from Git contents alone, but no contradictory artifact or copied asset was found.

Boundary caveat: the current static scanner can be bypassed by dynamic `host.request` syntax and does not scan all mutation-shaped strings in the built artifact. It should parse or instrument calls rather than rely solely on substring checks.

## Commands and observed results

- `npm test` — exit 0; seven Node test files plus package/asset/static browser scripts passed.
- `npm run build` — exit 0.
- `npm run build` repeated — output hash remained identical.
- `sha256sum dist/plugin.js` — `3f0509e2859e8b18fd614340b7fb6d4732ded65c6d127b73345768a0421350d9`.
- `git show 443c30b:dist/plugin.js | sha256sum` — same expected hash.
- `sha256sum src/plugin.js dist/plugin.js` — identical hashes.
- `git diff --check` — exit 0.
- Independent installed registry import — 142 methods; exactly one `kanban.*` method, `kanban.snapshot.v1`.

The working tree was clean before this review. This report is the only review-created file.

## Residual risks and release path

Do not deploy this artifact. A remediation implementation should first fix the adapter/identity corruption and replace source-string tests with executable unit tests. It must then complete the missing dashboard/scope/freshness/inspector/scale behavior and run the real disposable-profile Electron acceptance matrix. After those changes, request a fresh independent review and recompute the release hash; the current approved hash will necessarily change.

## Final verdict

**NO-SHIP**

Reason: blocker-level data corruption and absent browser/runtime evidence, plus multiple high-severity specification gaps. The read-only gateway and package boundaries are promising, but they are insufficient for release.