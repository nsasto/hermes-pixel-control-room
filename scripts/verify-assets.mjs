import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
  assert.equal(Object.keys(theme.provenance.sourceHashes).length, 10)
  assert.equal(Object.keys(theme.provenance.outputHashes).length, 9)
  for (const [relativePath, expectedHash] of Object.entries(theme.provenance.outputHashes)) {
    const actualHash = createHash('sha256').update(readFileSync(join(root, 'dist', relativePath))).digest('hex')
    assert.equal(actualHash, expectedHash, `output hash mismatch: ${relativePath}`)
  }
}
