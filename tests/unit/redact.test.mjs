import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../../src/plugin.js', import.meta.url), 'utf8')
assert.ok(src.includes('function redactText'))
for (const pattern of ['EMAIL_RE', 'PHONE_RE', 'URL_RE', 'SECRET_RE', 'CONTROL_RE']) assert.ok(src.includes(pattern), pattern)
