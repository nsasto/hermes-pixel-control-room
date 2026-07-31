import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../../src/plugin.js', import.meta.url), 'utf8')
for (const lane of ['running','queued','blocked','idle']) assert.ok(src.includes(lane), lane)
assert.ok(src.includes("label: `+${overflow}`"), 'office overflow aggregate exists')
