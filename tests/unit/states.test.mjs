import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../../src/plugin.js', import.meta.url), 'utf8')
for (const state of ['triage','todo','scheduled','ready','running','blocked','review','done','archived']) assert.ok(src.includes(`'${state}'`), state)
assert.ok(src.includes("return 'unknown'"), 'unknown statuses stay unknown')
