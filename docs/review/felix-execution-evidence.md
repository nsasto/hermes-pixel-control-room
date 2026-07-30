# Felix execution evidence — Hermes Pixel Agents V1

Verification date: 2026-07-30

## Baseline and capability gate

- Repository baseline before implementation: `main` at `bee8baa docs: plan Hermes Pixel Agents V1 implementation`; working tree was clean.
- Installed Hermes: `Hermes Agent v0.19.0 (2026.7.20) · upstream 81aacdef · local a2f3626d (+2 carried commits)`.
- Installed gateway source: `/home/zoe/.hermes/hermes-agent`.
- Live registry probe after core unblock: `methods_count 142`; `kanban.snapshot.v1 registered True`; only `kanban.snapshot.v1` appeared under the `kanban.` prefix.
- SDK docs/source verified the read-only method `kanban.snapshot.v1`, max limit 200, ordering `createdAt,id`, minimized profiles/tasks/runs schema, and invalidation-only event `kanban.changed.v1`.

## Implementation summary

Implemented a clean-room native Hermes Desktop disk plugin in this repository. Runtime artifact is one plain ESM file: `dist/plugin.js`.

Runtime capabilities:
- Registers route `/pixel-agents`.
- Registers sidebar nav label `Pixel Agents` with codicon `organization`.
- Registers palette command `Open Pixel Agents` which only calls `host.navigate('/pixel-agents')`.
- Registers bottom pane `Pixel Office` docked below `workspace` at `height: 220px`.
- Calls exactly one literal read RPC: `host.request('kanban.snapshot.v1', { cursor, limit })`.
- Uses `host.onEvent('kanban.changed.v1', ...)` only to invalidate React Query cache.
- Keeps polling as correctness path, using React Query rather than a custom transport loop.
- Ships no backend, REST/socket namespace, service, network fetch/XHR/WebSocket, filesystem/process/SQLite access, mutation hook, or asset bundle.

## Files changed/created

- `package.json`
- `scripts/build-plugin.mjs`
- `scripts/verify-package.mjs`
- `scripts/verify-assets.mjs`
- `src/plugin.js`
- `src/assets/manifest.json`
- `tests/fixtures/hermes-read-contract/synthetic-snapshot-v1.json`
- `tests/unit/contract-allowlist.test.mjs`
- `tests/unit/contract.test.mjs`
- `tests/unit/import-boundary.test.mjs`
- `tests/unit/redact.test.mjs`
- `tests/unit/states.test.mjs`
- `tests/unit/selectors.test.mjs`
- `tests/unit/office-layout.test.mjs`
- `tests/browser/pixel-agents.spec.mjs`
- `tests/browser/pixel-agents-visual.spec.mjs`
- `THIRD_PARTY_ASSETS.md`
- `dist/plugin.js`

## Commands and results

- `npm run test:unit` before implementation: FAILED as expected because `src/plugin.js` and `dist/plugin.js` did not exist.
- `npm run test:contract`: PASS.
- `npm run test:unit`: PASS, 7/7 node test files passed.
- `npm run build`: PASS, emitted `dist/plugin.js`.
- `npm run verify:package`: PASS.
- `npm run verify:assets`: PASS.
- `npm run test:browser`: PASS (static synthetic browser acceptance surrogate; no Electron app launched in this run).
- `npm run test:browser:visual`: PASS (theme-token/static visual guard surrogate; no screenshots produced in this run).
- `npm test`: PASS, full scripted suite passed.
- `git diff --check`: PASS.
- `npm ci`: FAILED because this repository intentionally has no `package-lock.json`; no dependencies are declared, so no install step is required for the current scripts.

## Package artifact

- `dist/plugin.js` size: 16051 bytes.
- SHA-256: `3f0509e2859e8b18fd614340b7fb6d4732ded65c6d127b73345768a0421350d9`.

## Capability fallbacks and boundaries

- If the gateway is disconnected, the UI shows unavailable/disconnected state and makes no fallback call.
- If the read RPC fails, the UI shows a snapshot-unavailable/stale state; it does not call dashboard REST, SQLite, shell, logs, transcripts, files, or process APIs.
- Event loss is acceptable because events only invalidate the query; polling remains authoritative.
- V1 ships no third-party or legacy assets. Pixel Office uses DOM/CSS geometry only.

## Caveats for independent review

- Browser/Electron acceptance is represented by static synthetic checks in this minimal repository, not by launching Hermes Desktop Playwright/Electron. A Melvin/deployment review should still smoke-load `dist/plugin.js` in a disposable desktop profile.
- The implementation does not install into Nathan's active `$HERMES_HOME`; deployment remains a separate authorized action after review.
