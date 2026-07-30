import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

test('dashboard manifest registers a browser tab and backend route', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'dashboard/manifest.json'), 'utf8'))
  assert.equal(manifest.tab.path, '/control-room')
  assert.equal(manifest.entry, 'dist/index.js')
  assert.equal(manifest.api, 'plugin_api.py')
})

test('built bundle contains dashboard registration and fixture labels', async () => {
  const bundle = await readFile(resolve(root, 'dashboard/dist/index.js'), 'utf8')
  assert.match(bundle, /__HERMES_PLUGIN_SDK__/)
  assert.match(bundle, /hermes-pixel-control-room/)
  assert.match(bundle, /Main \/ EA/)
  assert.doesNotMatch(bundle, /@hermes\/plugin-sdk/)
})

test('fixture room exposes an accessible agent contract and cleanup hook', async () => {
  const source = await readFile(resolve(root, 'src/web/control-room.js'), 'utf8')
  assert.match(source, /aria-label.*Configured Hermes agents/)
  assert.match(source, /aria-labelledby.*selected-agent-heading/)
  assert.match(source, /onUnmount/)
})
