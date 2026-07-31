import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const dist = readFileSync(new URL('../../dist/plugin.js', import.meta.url), 'utf8')
assert.ok(dist.includes('var(--ui-text-secondary)'))
assert.ok(dist.includes('var(--ui-stroke-secondary)'))
assert.ok(!/#(?:000|fff|[0-9a-fA-F]{6})/.test(dist), 'no hardcoded hex colors')
