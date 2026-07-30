import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist/plugin.js')
assert.ok(existsSync(dist), 'dist/plugin.js must exist')
const text = readFileSync(dist, 'utf8')
assert.match(text, /export default\s*\{/, 'plugin must default export an object')
assert.equal((text.match(/sourceMappingURL/g) || []).length, 0, 'no source maps')
assert.equal((text.match(/from\s+['"][.\/]/g) || []).length, 0, 'no relative runtime imports')
for (const spec of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
  assert.ok(['@hermes/plugin-sdk', 'react', 'react/jsx-runtime'].includes(spec[1]), `unsupported import ${spec[1]}`)
}
for (const forbidden of ['ctx.rest','ctx.socket','host.restartGateway','useMutation','fetch(','XMLHttpRequest','WebSocket','child_process','fs/promises','better-sqlite3','sqlite3','dangerouslySetInnerHTML']) {
  assert.ok(!text.includes(forbidden), `forbidden runtime capability ${forbidden}`)
}
const entries = readdirSync(join(root, 'dist'))
assert.deepEqual(entries.sort(), ['plugin.js'], 'dist ships only plugin.js for V1')
assert.ok(statSync(dist).size < 300_000, 'plugin bundle is bounded')
