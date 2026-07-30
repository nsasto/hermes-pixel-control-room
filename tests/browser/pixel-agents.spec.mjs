import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const dist = readFileSync(new URL('../../dist/plugin.js', import.meta.url), 'utf8')
for (const s of ["path: '/pixel-agents'", "label: 'Pixel Agents'", "codicon: 'organization'", "title: 'Pixel Office'", "dock: { pane: 'workspace', pos: 'bottom' }"]) assert.ok(dist.includes(s), s)
assert.ok(!dist.includes('dangerouslySetInnerHTML'))
