import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const manifest = JSON.parse(readFileSync(new URL('../src/assets/manifest.json', import.meta.url), 'utf8'))
assert.equal(manifest.version, 1)
assert.deepEqual(manifest.approvedOutputs, [
  'dist/themes/modern-corporate-v1/office-empty.png',
  'dist/themes/modern-corporate-v1/characters/*.png'
])
const root = fileURLToPath(new URL('..', import.meta.url))
const catalog = JSON.parse(readFileSync(join(root, 'dist/theme-catalog.json'), 'utf8'))
const theme = catalog.themes.find((candidate) => candidate.id === 'modern-corporate-v1')
assert.ok(theme, 'Modern Corporate Office must be declared')
if (theme.ready) {
  assert.ok(existsSync(join(root, 'dist/themes/modern-corporate-v1/office-empty.png')))
  assert.equal(theme.characters.filter((character) => character.asset).length, 8)
}
