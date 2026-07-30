# Hermes read-only Kanban/delegation contract verification

Verification date: 2026-07-30T08:47:53Z
Repository baseline: `main` with clean working tree before Phase 0.
Installed Hermes: `Hermes Agent v0.19.0 (2026.7.20) · upstream c55159f1 · local 1f1b92a1 (+2 carried commits)`
Install directory inspected: `/home/zoe/.hermes/hermes-agent`
Active profile home: `/home/zoe/.hermes/profiles/felix`

Clean-room boundary: this research used only the current repository, official Hermes documentation/source, and the installed Hermes package. It did not inspect or copy from `/home/zoe/projects/hermes-pixel-agents`, Pixel Agent Desk, or any other legacy codebase.

## Result

NO-GO for Pixel Agents V1 Phase 1 on the currently installed Hermes Desktop/gateway.

The Desktop plugin SDK exposes a sanctioned authenticated JSON-RPC bridge via `host.request(method, params)` and gateway events via `host.onEvent(type, fn)`, but the installed gateway method registry does not expose a sanctioned read-only Kanban/delegation snapshot suitable for a disk plugin. The only nearby live read methods found are generic/non-Kanban (`agents.list`, `session.active_list`) and they do not provide task lifecycle snapshot data.

Per the clean-room spec, do not continue by adding a plugin backend, HTTP server, direct SQLite/file access, shell/CLI bridge, polling process, transcript/log parser, or workaround. Add a Hermes-core read RPC first, then resume implementation.

## Desktop SDK surface verified

Official docs and installed source agree on the disk plugin constraints:

- Disk plugin location: `$HERMES_HOME/desktop-plugins/<id>/plugin.js`.
- Disk plugins are plain uncompiled ESM; JSX syntax is not supported.
- Allowed import specifiers: `@hermes/plugin-sdk`, `react`, and `react/jsx-runtime` only.
- Full route contribution: `ROUTES_AREA` with `data: { path }` and `render`.
- Sidebar nav contribution: `SIDEBAR_NAV_AREA` with `data: { path, label, codicon }`.
- Bottom pane contribution: `PANES_AREA` / `'panes'` with `data: { placement, dock, height }`; `dock: { pane: 'workspace', pos: 'bottom' }` is documented.
- SDK state atoms include `host.state.gateway`, `host.state.profile`, and `host.state.viewport`.
- SDK data/event APIs include `host.request`, `host.onEvent`, `useQuery`, `useMutation`, `useQueryClient`, and `queryClient`.
- SDK UI exports include `SearchField`, `Select`, `SegmentedControl`, `Skeleton`, `EmptyState`, `ErrorState`, `StatusDot`, `relativeTime`/time helpers, and theme/UI helpers.
- V1 must not use `host.restartGateway`, `useMutation`, `ctx.rest`, or `ctx.socket` for the data path.

Evidence:

- Official docs URL retrieved successfully: `https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk/` (`178881` bytes fetched on 2026-07-30).
- Installed docs/source inspected:
  - `/home/zoe/.hermes/hermes-agent/website/docs/developer-guide/desktop-plugin-sdk.md`
  - `/home/zoe/.hermes/hermes-agent/apps/desktop/src/sdk/index.ts`
  - `/home/zoe/.hermes/hermes-agent/apps/shared/src/json-rpc-gateway.ts`

Key installed SDK source facts:

```ts
host.request<T>(method: string, params: Record<string, unknown> = {}): Promise<T>
host.onEvent(type, fn)
export const PANES_AREA = 'panes'
export { type RouteContribution, ROUTES_AREA, SIDEBAR_NAV_AREA }
```

## Gateway JSON-RPC registry and live probe

Installed TUI/Desktop gateway source: `/home/zoe/.hermes/hermes-agent/tui_gateway/server.py`

The gateway dispatches JSON-RPC by exact method name through `_methods`; unknown methods return JSON-RPC error `-32601`.

A live installed-registry probe loaded the current gateway method registry and tested likely Kanban/delegation snapshot names. Redacted output:

```text
methods_count 141
kanban.snapshot    -> error -32601 unknown method: kanban.snapshot
kanban.list        -> error -32601 unknown method: kanban.list
kanban.board       -> error -32601 unknown method: kanban.board
kanban.tasks       -> error -32601 unknown method: kanban.tasks
delegation.snapshot -> error -32601 unknown method: delegation.snapshot
agents.snapshot    -> error -32601 unknown method: agents.snapshot
agents.list        -> result {"processes": []}
session.active_list -> result {"sessions": []}
```

The full installed registry contained no method starting with `kanban.` and no delegation/Kanban snapshot method. `agents.list` is not a Kanban/delegation task lifecycle snapshot; it returned only an empty process list in this profile. `session.active_list` is a live chat/session registry, not board/task state.

## Existing Kanban dashboard plugin is not acceptable for V1

Installed source includes a dashboard backend plugin at `/home/zoe/.hermes/hermes-agent/plugins/kanban/dashboard/plugin_api.py` with REST endpoints including:

- `GET /api/plugins/kanban/board`
- `GET /api/plugins/kanban/tasks/{task_id}`
- mutation endpoints such as `POST /tasks` and attachment endpoints
- an `/events` WebSocket implemented by tailing the Kanban database event table

That route is a dashboard/plugin backend over HTTP/WebSocket and is intentionally broader than the V1 contract. It serializes many fields that V1 explicitly excludes, including task body on detail endpoints, comments, events, attachments, run metadata/errors, workspace paths through task objects, and mutation capabilities. Using it from Pixel Agents V1 would violate the spec's ban on plugin-owned/backend HTTP, direct DB-derived dashboard APIs, mutation-capable routes, and over-broad payloads.

## Required contract table

| Area | Verified answer |
|---|---|
| Read method | No existing sanctioned read-only Kanban/delegation snapshot RPC was found in the installed gateway registry. Required core change: add a narrow read method such as `kanban.snapshot.v1` or `pixel_agents.snapshot.v1`; name must be finalized in Hermes core, not invented in the renderer. |
| Request params | Unresolved because no method exists. Required minimum: `{ board?: string, profile?: string, cursor?: string, limit?: number }`, with documented default board/profile semantics and maximum page size. |
| Response schema | Unresolved because no method exists. Required minimum is the Phase 0 proposed schema or equivalent, excluding bodies, comments, results, raw errors, attachments, workspace paths, prompts, tool payloads, transcripts, env, and command lines. |
| Events | No Kanban lifecycle event type/envelope is exposed through the gateway registry/docs for desktop plugins. Existing generic gateway event envelope is `{ type, payload?, profile?, session_id? }`; documented built-ins include session/message/tool/status events, not Kanban task/run lifecycle invalidations. Required core change: invalidation-only lifecycle event such as `{ schemaVersion, board, entityType, entityId, revision }`. |
| Reconnect | SDK client rejects pending calls when the WebSocket closes and callers can reconnect/retry. No Kanban-specific dropped-event recovery can be proven because no snapshot/event contract exists. Required behavior: polling snapshot remains correctness path after reconnect/profile switch/board switch/OAuth remote use. |
| Authorization | `host.request` uses the desktop app's existing gateway WebSocket bridge; no extra network surface is added by `host.request` itself. The missing part is the authorized read method. |
| Read-only boundary | Added a synthetic allowlist test in `tests/unit/contract-allowlist.test.mjs`; it currently encodes the absence of an approved method. It will fail if production code introduces a non-approved method string or forbidden API/import. |

## Field-level minimization requirement for the future core RPC

The future sanctioned snapshot must return only these field families:

- Snapshot metadata: `schemaVersion`, `generatedAt`, `nextCursor`, freshness/revision.
- Profiles: stable opaque id and nullable display name only.
- Tasks: stable id, board, nullable safe title, status, nullable assignee id, update timestamp, nullable blocked kind.
- Runs: stable id, task id, profile id, status, nullable start/end timestamps.

It must exclude task bodies, comments, results, summaries beyond short allowlisted safe title, prompts, tool calls/results, attachments, stored paths, workspace paths, command lines, raw errors, environment, credentials, profile private config, transcripts, logs, and recipient identifiers.

## Recommendation

NO-GO for Phase 1 until Hermes core exposes and documents a sanctioned read-only snapshot RPC plus lifecycle invalidation events.

Precise build-card recommendation:

Title: Add Hermes Desktop read-only Pixel Agents snapshot RPC

Acceptance criteria:

1. Add a gateway JSON-RPC read method with an exact documented name, e.g. `kanban.snapshot.v1`.
2. Parameters: `board?`, `profile?`, `cursor?`, `limit?`, documented default scope, documented max page size.
3. Response: schema-versioned minimized snapshot with profiles/tasks/runs only, no bodies/comments/results/errors/attachments/workspace paths/prompts/tool payloads.
4. Events: invalidation-only lifecycle event(s) for task/run/profile changes with `{ schemaVersion, board, entityType, entityId, revision }`; polling snapshot remains authoritative after reconnect/dropped events.
5. Authorization: method is available only over the existing authenticated desktop gateway bridge; no new HTTP/plugin backend/network surface.
6. Tests: gateway method registry includes the read method; schema fixtures cover pagination, unknown enum, board/profile scope, and redaction/minimization; mutation attempts remain unavailable from the Pixel Agents adapter allowlist.
7. Docs: update Desktop Plugin SDK or gateway RPC docs with method name, params, schema, event envelope, reconnect behavior, and OAuth remote behavior.
