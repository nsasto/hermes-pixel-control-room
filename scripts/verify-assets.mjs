import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const manifest = JSON.parse(readFileSync(new URL('../src/assets/manifest.json', import.meta.url), 'utf8'))
assert.equal(manifest.version, 1)
assert.deepEqual(manifest.approvedOutputs, [])
assert.equal(manifest.note, 'V1 ships no third-party or legacy assets; office uses DOM/CSS geometry only.')
