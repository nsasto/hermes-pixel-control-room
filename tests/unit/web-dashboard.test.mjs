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

test('Modern Corporate Office theme descriptor is local-only and pixel-safe', async () => {
  const theme = JSON.parse(await readFile(resolve(root, 'src/themes/modern-corporate-v1.json'), 'utf8'))
  assert.equal(theme.id, 'modern-corporate-v1')
  assert.equal(theme.sourceRoot, 'assets/pixel_art/Modern_Corporate_Office_Pixel_Art_Asset_Pack_v1.0')
  assert.deepEqual([theme.base.width, theme.base.height], [1536, 1024])
  assert.equal(theme.characters.length, 8)
  assert.equal(theme.characters[0].file, '01_Executive_Manager_Seated.png')
  assert.equal(theme.characters[0].role, 'executive')
  assert.equal(theme.characters.at(-1).file, '08_Receptionist_Front_Seated.png')
  assert.equal(theme.characters.at(-1).role, 'receptionist')
  assert.equal(theme.stations.find((station) => station.id === 'reception-main').x, 50)
  assert.equal(theme.animation.authoritative, false)
  assert.equal(theme.license.localOnly, true)
  assert.equal(theme.license.redistributionAllowed, false)
  assert.equal(theme.rendering.filter, 'nearest-neighbor')
})

test('built bundle contains dashboard registration without desktop imports', async () => {
  const bundle = await readFile(resolve(root, 'dashboard/dist/index.js'), 'utf8')
  assert.match(bundle, /__HERMES_PLUGIN_SDK__/)
  assert.match(bundle, /hermes-pixel-control-room/)
  assert.doesNotMatch(bundle, /@hermes\/plugin-sdk/)
})

test('browser bundle presents the office-first Control Room surface', async () => {
  const bundle = await readFile(resolve(root, 'dashboard/dist/index.js'), 'utf8')
  for (const label of ['Control Room', 'Office theme', 'Focus selected', 'Executions', 'Recent activity']) {
    assert.match(bundle, new RegExp(label), `missing browser UI label: ${label}`)
  }
  assert.match(bundle, /__CONTROL_ROOM_THEMES__/)
  assert.match(bundle, /projectControlRoom/)
})

test('control room uses the authenticated snapshot endpoint and renders head-only motion', async () => {
  const source = await readFile(resolve(root, 'src/web/control-room.js'), 'utf8')
  const css = await readFile(resolve(root, 'dashboard/dist/style.css'), 'utf8')
  const api = await readFile(resolve(root, 'dashboard/plugin_api.py'), 'utf8')
  assert.match(source, /\/api\/plugins\/hermes-pixel-control-room\/snapshot/)
  assert.match(source, /pixel-agent-sprite/)
  assert.match(source, /aria-label.*Pixel office room/)
  assert.match(css, /@keyframes cr-head-bob/)
  assert.doesNotMatch(css, /@keyframes pixel-mill/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(api, /build_snapshot/)
  assert.doesNotMatch(api, /fixtureSnapshot/)
})
