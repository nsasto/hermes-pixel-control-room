import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../../src/plugin.js', import.meta.url), 'utf8')
for (const fn of ['function normalizeSnapshot','function buildAgents','function applyFilters','function officeLayout']) assert.ok(src.includes(fn), fn)
assert.ok(src.includes('MAX_OFFICE_OCCUPANTS = 24'))
