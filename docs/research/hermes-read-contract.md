# Hermes read-only Kanban/delegation contract verification

Verification date: 2026-07-30T12:22:00Z
Repository baseline: `main` with clean working tree before Phase 0.
Installed Hermes: `Hermes Agent v0.19.0 (2026.7.20) · upstream 81aacdef · local a2f3626d (+2 carried commits)`
Install directory inspected: `/home/zoe/.hermes/hermes-agent`
Active profile home: `/home/zoe/.hermes/profiles/felix`

Clean-room boundary: this research used only the current repository, official Hermes documentation/source, and the installed Hermes package. It did not inspect or copy from `/home/zoe/projects/hermes-pixel-agents`, Pixel Agent Desk, or any other legacy codebase.

## Result

GO for Pixel Agents V1 Phase 1 on the currently installed Hermes Desktop/gateway.

The Desktop plugin SDK exposes a sanctioned authenticated JSON-RPC bridge via `host.request(method, params)` and gateway events via `host.onEvent(type, fn)`. After Hermes core commit `a2f3626d`, the installed gateway method registry exposes the sanctioned read-only Kanban snapshot method `kanban.snapshot.v1`, and SDK docs define the invalidation-only event `kanban.changed.v1`.

Per the clean-room spec, Pixel Agents V1 may now proceed against exactly that read contract. It still must not add a plugin backend, HTTP server, direct SQLite/file access, shell/CLI bridge, polling process, transcript/log parser, or workaround.

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
methods_count 142
kanban.snapshot.v1 registered True
kanban methods ['kanban.snapshot.v1']
```

The full installed registry contains exactly one `kanban.` read method: `kanban.snapshot.v1`. No `kanban.*` mutation methods are part of the Desktop gateway contract.

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
| Read method | `kanban.snapshot.v1`, exposed through the existing authenticated Desktop JSON-RPC bridge. |
| Request params | `{ board?: string, profile?: string, cursor?: string, limit?: number }`; omitted board selects active board; omitted profile includes all assignees; default limit 100, max 200; cursor is opaque and scope-bound. |
| Response schema | Schema version 1 minimized snapshot: `board`, `profile`, `revision`, `ordering: 'createdAt,id'`, `limit`, `hasMore`, `nextCursor`, `profiles`, `tasks`, and `runs`. It excludes bodies, comments, results, raw errors, attachments, workspace paths, prompts, tool payloads, transcripts, env, command lines, recipient IDs, and private config. |
| Events | `kanban.changed.v1`, invalidation only: `{ schemaVersion, board, entityType: 'task'|'run'|'profile', entityId, revision }`. |
| Reconnect | Polling snapshot remains authoritative; events may be dropped/coalesced and only trigger query invalidation/refetch. |
| Authorization | `host.request` uses the desktop app's existing gateway WebSocket bridge; no extra network surface is added by `host.request` itself. The missing part is the authorized read method. |
| Read-only boundary | `tests/unit/contract-allowlist.test.mjs` statically allowlists only `kanban.snapshot.v1` and fails if production code introduces a non-approved method string or forbidden API/import. |

## Field-level minimization requirement for the future core RPC

The future sanctioned snapshot must return only these field families:

- Snapshot metadata: `schemaVersion`, `generatedAt`, `nextCursor`, freshness/revision.
- Profiles: stable opaque id and nullable display name only.
- Tasks: stable id, board, nullable safe title, status, nullable assignee id, update timestamp, nullable blocked kind.
- Runs: stable id, task id, profile id, status, nullable start/end timestamps.

It must exclude task bodies, comments, results, summaries beyond short allowlisted safe title, prompts, tool calls/results, attachments, stored paths, workspace paths, command lines, raw errors, environment, credentials, profile private config, transcripts, logs, and recipient identifiers.

## Recommendation

GO for Phase 1 with the exact `kanban.snapshot.v1` / `kanban.changed.v1` contract above. Any drift, missing method, missing event, or broader payload is an automatic NO-SHIP until revalidated.

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
