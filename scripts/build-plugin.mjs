import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distRoot = join(root, 'dist')
const themeDefinition = JSON.parse(readFileSync(join(root, 'src/themes/modern-corporate-v1.json'), 'utf8'))
const sourceRoot = join(root, themeDefinition.sourceRoot)
const outputRoot = join(distRoot, 'themes', themeDefinition.id)
const characterSourceRoot = join(sourceRoot, '02_Characters', 'Individual_PNG')
const characterOutputRoot = join(outputRoot, 'characters')
const sceneSource = join(sourceRoot, themeDefinition.base.emptyScene)
const licenseSource = join(sourceRoot, themeDefinition.license.documentation)
const requiredFiles = [
  join(sourceRoot, 'START_HERE.txt'),
  licenseSource,
  sceneSource,
  ...themeDefinition.characters.map((character) => join(characterSourceRoot, character.file))
]
const ready = requiredFiles.every(existsSync)

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function validateThemeDefinition(theme) {
  assert.equal(theme.license.localOnly, true)
  assert.equal(theme.license.redistributionAllowed, false)
  assert.equal(theme.characters.filter((character) => character.role === 'receptionist').length, 1, 'theme requires one receptionist')
  assert.ok(theme.characters.some((character) => character.role !== 'receptionist'), 'theme requires a non-receptionist identity')
  assert.ok(theme.stations.some((station) => station.id === 'reception-main'), 'theme requires reception-main')
  assert.ok(theme.stations.some((station) => station.id.startsWith('workstation-')), 'theme requires a workstation')
  for (const station of theme.stations) {
    assert.ok(Number.isFinite(station.x) && station.x >= 0 && station.x <= 100, `invalid station x: ${station.id}`)
    assert.ok(Number.isFinite(station.y) && station.y >= 0 && station.y <= 100, `invalid station y: ${station.id}`)
  }
}

function validatePng(path, expectedWidth, expectedHeight) {
  const bytes = readFileSync(path)
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG', `${path} is not a PNG`)
  if (expectedWidth != null) assert.equal(bytes.readUInt32BE(16), expectedWidth, `${path} width mismatch`)
  if (expectedHeight != null) assert.equal(bytes.readUInt32BE(20), expectedHeight, `${path} height mismatch`)
}

validateThemeDefinition(themeDefinition)
if (ready) {
  assert.equal(sha256(sceneSource), themeDefinition.base.sha256, 'office scene hash mismatch')
  assert.equal(sha256(licenseSource), themeDefinition.license.sha256, 'licence hash mismatch')
  validatePng(sceneSource, themeDefinition.base.width, themeDefinition.base.height)
  themeDefinition.characters.forEach((character) => {
    const path = join(characterSourceRoot, character.file)
    assert.equal(sha256(path), character.sha256, `character hash mismatch: ${character.file}`)
    validatePng(path)
  })
}

mkdirSync(distRoot, { recursive: true })
rmSync(join(distRoot, 'themes'), { recursive: true, force: true })

const webTheme = {
  id: themeDefinition.id,
  label: themeDefinition.label,
  description: themeDefinition.description,
  ready,
  expectedLocalPath: themeDefinition.sourceRoot,
  base: {
    width: themeDefinition.base.width,
    height: themeDefinition.base.height,
    asset: ready ? `./themes/${themeDefinition.id}/office-empty.png` : null
  },
  characters: themeDefinition.characters.map((character, index) => ({
    role: character.role,
    asset: ready ? `./themes/${themeDefinition.id}/characters/${String(index + 1).padStart(2, '0')}.png` : null
  })),
  stations: themeDefinition.stations,
  rendering: themeDefinition.rendering,
  provenance: {
    sourceUrl: themeDefinition.sourceUrl,
    packVersion: themeDefinition.packVersion,
    sourceHashes: ready ? {
      [themeDefinition.base.emptyScene]: themeDefinition.base.sha256,
      [themeDefinition.license.documentation]: themeDefinition.license.sha256,
      ...Object.fromEntries(themeDefinition.characters.map((character) => [`02_Characters/Individual_PNG/${character.file}`, character.sha256]))
    } : {},
    outputHashes: {}
  }
}

if (ready) {
  mkdirSync(characterOutputRoot, { recursive: true })
  copyFileSync(sceneSource, join(outputRoot, 'office-empty.png'))
  themeDefinition.characters.forEach((character, index) => {
    copyFileSync(join(characterSourceRoot, character.file), join(characterOutputRoot, `${String(index + 1).padStart(2, '0')}.png`))
  })
  webTheme.provenance.outputHashes = {
    [`themes/${themeDefinition.id}/office-empty.png`]: sha256(join(outputRoot, 'office-empty.png')),
    ...Object.fromEntries(themeDefinition.characters.map((character, index) => {
      const output = join(characterOutputRoot, `${String(index + 1).padStart(2, '0')}.png`)
      return [`themes/${themeDefinition.id}/characters/${String(index + 1).padStart(2, '0')}.png`, sha256(output)]
    }))
  }
}

const catalog = { schemaVersion: 1, themes: [webTheme] }
const marker = '/*__THEME_CATALOG__*/ { themes: [] }'
const source = readFileSync(join(root, 'src/plugin.js'), 'utf8')
assert.equal(source.split(marker).length, 2, 'plugin source must contain exactly one theme catalog marker')
const entry = source.replace(
  marker,
  JSON.stringify(catalog)
)
writeFileSync(join(distRoot, 'plugin.js'), entry, 'utf8')
writeFileSync(join(distRoot, 'theme-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
