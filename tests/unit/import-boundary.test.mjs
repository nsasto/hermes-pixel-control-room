import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const root = new URL('../..', import.meta.url).pathname
const dist = join(root, 'dist/plugin.js')
const source = join(root, 'src/plugin.js')
const text = readFileSync(existsSync(dist) ? dist : source, 'utf8')
assert.equal((text.match(/from\s+['"][.\/]/g) || []).length, 0)
assert.ok(text.includes("host.request('kanban.snapshot.v1'"), 'literal approved RPC is present')
