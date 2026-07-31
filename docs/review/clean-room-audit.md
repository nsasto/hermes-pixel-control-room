# Clean-room audit — Hermes Pixel Agents V1

## Inputs used

- Current repository `/home/zoe/projects/hermes-pixel-desk`.
- `docs/specs/clean-room-v1.md`.
- `docs/plans/hermes-pixel-v1-implementation-plan.md`.
- `docs/research/hermes-read-contract.md`.
- Installed Hermes source/docs under `/home/zoe/.hermes/hermes-agent` for the Desktop Plugin SDK and the reviewed Kanban snapshot core contract.
- Live gateway registry probe output containing only method counts/names.

## Inputs explicitly not used

- `/home/zoe/projects/hermes-pixel-agents` was not opened, searched, read, copied, or used.
- Pixel Agent Desk source, assets, styles, layouts, names, tests, fixtures, screenshots, or generated outputs were not used.
- No real Kanban task bodies, comments, results, errors, workspaces, paths, prompts, tool payloads, transcripts, recipient identifiers, or credentials were committed as fixtures or evidence.

## Runtime package contents

- The original clean-room V1 review covered `dist/plugin.js` only.
- Theme-enabled local builds additionally contain `dist/theme-catalog.json`, the
  Modern Corporate Office empty scene, and eight individual character PNGs
  under ignored `dist/themes/` output.
- No backend `plugin_api.py` or dashboard manifest.
- No source maps, downloaded archives, fixtures, or Hermes private data.
- The licensed artwork is user-supplied, hash-pinned, copied only during a local
  build, excluded from Git, and must not be included in a public release archive.

## Boundary checks

- Static allowlist permits only `kanban.snapshot.v1` for `host.request`.
- Static scan rejects mutation-shaped method fragments and forbidden runtime APIs: backend REST/socket, gateway restart, mutation hooks, fetch/XHR/WebSocket, Node filesystem/process, and SQLite.
- Renderer projection is field-by-field from minimized schema; transport objects are not spread into component state beyond the decoder/projector boundary.
- Display strings are bounded and masked for control/bidi characters, secret-shaped tokens, emails, phones, and URLs.

## Result

Clean-room status: PASS for the original asset-free V1 implementation. The
theme-enabled extension passes its separate local-only boundary review: inputs
are declared and hash-pinned, generated outputs are verified, licensed binaries
remain ignored, and public release archives must remain asset-free. This result
does not authorize redistribution of the purchased artwork.

Deployment status: NOT DEPLOYED. Installing into Nathan's active Hermes profile remains outside this implementation task and should happen only after independent SHIP review.
