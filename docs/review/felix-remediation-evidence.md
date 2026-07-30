# Pixel Agents V1 remediation evidence

Date: 2026-07-30
Base reviewed commit: 443c30b
Remediation scope: native disk-plugin, read-only, clean-room. No REST/HTTP/plugin backend, SQLite/file reads, shell bridge, polling process, task mutation, service exposure, or active-profile installation was added.

## Changes made

- Fixed snapshot pagination identity corruption by removing double-normalization: raw pages are decoded exactly once for validation and merged as typed safe pages.
- Added scope-aware requests for board/profile, scoped query keys, 30s refresh configuration, last-good/stale freshness state helper, and scoped invalidation matching for `kanban.changed.v1`.
- Hardened decoder behavior: safe IDs are strict, duplicates are rejected, primitive/timestamp types are validated, taskCounts are numeric-only, and run status strings are bounded/safe.
- Corrected grouping: unassigned tasks contribute to totals only; profiles are not fabricated from unassigned work; primary task selection prefers active running runs deterministically.
- Corrected Pixel Office overflow behavior: exactly 24 agents render as 24 tiles; overflow begins above 24 with a representative cap.
- Replaced key static unit coverage with executable tests that load and execute the plugin logic through an SDK harness stub.

## Executed verification

- `node --test tests/unit/snapshot-adapter.test.mjs tests/unit/selectors-executable.test.mjs` — PASS (6 executable regression tests).
- `npm test` — PASS. This ran contract/unit/build/package/assets/browser/visual scripts.
- `npm run build` — PASS.
- `git diff --check` — PASS.
- `sha256sum dist/plugin.js` — `c1dcda00a291b865dcd58685548d24c78533326739ecd12c239f191776b27c61` after remediation build.

## Browser / desktop acceptance caveat

The repo still does not have a real installed Hermes Desktop Playwright/Electron harness checked in. The existing `test:browser` and `test:browser:visual` scripts still execute but remain lightweight package/source acceptance checks rather than a full disposable-HERMES_HOME Electron smoke matrix. This is a residual review risk and should be treated as a Melvin review focus item rather than a deployment approval.

## Fresh review focus

Melvin should specifically re-check:

1. No double-normalization remains and identity is preserved across one-page and multi-page snapshots.
2. Scope matching is exact enough for board/profile requests, query cache, and changed events.
3. The selected-agent/product-surface gaps are sufficiently remediated for V1, or still require a second pass.
4. Browser/Electron evidence is adequate; I expect this remains the weakest area because no real desktop harness was available in-repo.
5. Bundle remains read-only and clean-room with no forbidden data path or mutation surface.
