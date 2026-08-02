import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../..', import.meta.url))
const themeRoot = join(root, 'dist/themes/modern-corporate-v1')

test('local build prepares a complete Modern Corporate Office web theme', () => {
  const catalog = JSON.parse(readFileSync(join(root, 'dist/theme-catalog.json'), 'utf8'))
  const theme = catalog.themes.find((candidate) => candidate.id === 'modern-corporate-v1')
  assert.equal(theme.ready, true)
  assert.equal(theme.base.asset, './themes/modern-corporate-v1/office-empty.webp')
  assert.equal(theme.characters.length, 8)
  assert.equal(theme.characters.at(-1).role, 'receptionist')
  assert.ok(existsSync(join(themeRoot, 'office-empty.webp')))
  assert.equal(readdirSync(join(themeRoot, 'characters')).filter((name) => name.endsWith('.webp')).length, 8)
  assert.equal(readdirSync(join(themeRoot, 'characters')).filter((name) => name.endsWith('.png')).length, 0)
  assert.ok(!existsSync(join(themeRoot, 'office-with-characters.png')), 'reference composition is not packaged')
  assert.ok(!existsSync(join(themeRoot, 'LICENSE_EN.txt')), 'source documentation is not packaged')
})

test('plugin bundle contains the prepared theme catalog', () => {
  const plugin = readFileSync(join(root, 'dist/plugin.js'), 'utf8')
  assert.match(plugin, /Modern Corporate Office/)
  assert.match(plugin, /office-empty\.webp/)
  assert.doesNotMatch(plugin, /__THEME_CATALOG__/)
})
