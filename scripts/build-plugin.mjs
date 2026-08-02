import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distRoot = join(root, 'dist')
const dashboardDistRoot = join(root, 'dashboard', 'dist')
const themeDefinition = JSON.parse(readFileSync(join(root, 'src/themes/modern-corporate-v1.json'), 'utf8'))
const officePacks = JSON.parse(readFileSync(join(root, 'src/themes/office-packs.json'), 'utf8'))
const sourceRoot = join(root, themeDefinition.sourceRoot)
const outputRoot = join(distRoot, 'themes', themeDefinition.id)
const characterSourceRoot = join(sourceRoot, '02_Characters', 'Individual_PNG')
const characterOutputRoot = join(outputRoot, 'characters')
const dashboardOutputRoot = join(dashboardDistRoot, 'themes', themeDefinition.id)
const dashboardCharacterOutputRoot = join(dashboardOutputRoot, 'characters')
const sceneSource = join(sourceRoot, themeDefinition.base.emptyScene)
const licenseSource = join(sourceRoot, themeDefinition.license.documentation)
const requiredFiles = [
  join(sourceRoot, 'START_HERE.txt'),
  licenseSource,
  sceneSource,
  ...themeDefinition.characters.map((character) => join(characterSourceRoot, character.file))
]
const ready = requiredFiles.every(existsSync)

function prepareWebAssets(pairs) {
  const result = spawnSync('python', [join(root, 'scripts', 'prepare-web-assets.py'), ...pairs.flat()], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || 'web asset preparation failed')
}

function collectPngs(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? collectPngs(path) : entry.name.toLowerCase().endsWith('.png') ? [path] : []
  }).sort()
}

function pngSize(path) {
  const bytes = readFileSync(path)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

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
mkdirSync(dashboardDistRoot, { recursive: true })
rmSync(join(distRoot, 'themes'), { recursive: true, force: true })
rmSync(join(dashboardDistRoot, 'themes'), { recursive: true, force: true })

const webTheme = {
  id: themeDefinition.id,
  label: themeDefinition.label,
  description: themeDefinition.description,
  ready,
  expectedLocalPath: themeDefinition.sourceRoot,
  base: {
    width: themeDefinition.base.width,
    height: themeDefinition.base.height,
    asset: ready ? `./themes/${themeDefinition.id}/office-empty.webp` : null
  },
  characters: themeDefinition.characters.map((character, index) => ({
    role: character.role,
    asset: ready ? `./themes/${themeDefinition.id}/characters/${String(index + 1).padStart(2, '0')}.webp` : null
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
  mkdirSync(dashboardCharacterOutputRoot, { recursive: true })
  const assetPairs = [
    [sceneSource, join(outputRoot, 'office-empty.webp')],
    [sceneSource, join(dashboardOutputRoot, 'office-empty.webp')]
  ]
  themeDefinition.characters.forEach((character, index) => {
    const outputName = `${String(index + 1).padStart(2, '0')}.webp`
    assetPairs.push([join(characterSourceRoot, character.file), join(characterOutputRoot, outputName)])
    assetPairs.push([join(characterSourceRoot, character.file), join(dashboardCharacterOutputRoot, outputName)])
  })
  prepareWebAssets(assetPairs)
  webTheme.provenance.outputHashes = {
    [`themes/${themeDefinition.id}/office-empty.webp`]: sha256(join(outputRoot, 'office-empty.webp')),
    ...Object.fromEntries(themeDefinition.characters.map((character, index) => {
      const output = join(characterOutputRoot, `${String(index + 1).padStart(2, '0')}.webp`)
      return [`themes/${themeDefinition.id}/characters/${String(index + 1).padStart(2, '0')}.webp`, sha256(output)]
    }))
  }
}

const additionalThemes = officePacks.map((pack) => {
  const packRoot = join(root, pack.sourceRoot)
  const scene = join(packRoot, pack.scene)
  const availableCharacters = collectPngs(join(packRoot, pack.characters))
  const receptionist = availableCharacters.find((path) => /reception/i.test(path))
  const selectedCharacters = availableCharacters.slice(0, 12)
  if (receptionist && !selectedCharacters.includes(receptionist)) selectedCharacters[selectedCharacters.length - 1] = receptionist
  const packReady = existsSync(scene) && selectedCharacters.length >= 8
  const dimensions = packReady ? pngSize(scene) : { width: 0, height: 0 }
  const packOutputRoot = join(distRoot, 'themes', pack.id)
  const packDashboardRoot = join(dashboardDistRoot, 'themes', pack.id)
  const packTheme = {
    id: pack.id,
    label: pack.label,
    description: `${pack.label} local office theme.`,
    ready: packReady,
    expectedLocalPath: pack.sourceRoot,
    base: { ...dimensions, asset: packReady ? `./themes/${pack.id}/office-empty.webp` : null },
    characters: selectedCharacters.map((path, index) => ({
      role: path === receptionist ? 'receptionist' : 'employee',
      asset: packReady ? `./themes/${pack.id}/characters/${String(index + 1).padStart(2, '0')}.webp` : null
    })),
    stations: pack.stations.map(([id, x, y]) => ({ id, x, y })),
    rendering: { filter: 'nearest-neighbor', integerScalePreferred: true, preserveAlpha: true },
    provenance: { sourceUrl: themeDefinition.sourceUrl, packVersion: pack.id, sourceHashes: {}, outputHashes: {} }
  }
  if (!packReady) return packTheme
  const pairs = [[scene, join(packOutputRoot, 'office-empty.webp')], [scene, join(packDashboardRoot, 'office-empty.webp')]]
  selectedCharacters.forEach((path, index) => {
    const name = `${String(index + 1).padStart(2, '0')}.webp`
    pairs.push([path, join(packOutputRoot, 'characters', name)], [path, join(packDashboardRoot, 'characters', name)])
    packTheme.provenance.sourceHashes[path.slice(packRoot.length + 1).replaceAll('\\', '/')] = sha256(path)
  })
  packTheme.provenance.sourceHashes[pack.scene] = sha256(scene)
  prepareWebAssets(pairs)
  packTheme.provenance.outputHashes = {
    [`themes/${pack.id}/office-empty.webp`]: sha256(join(packOutputRoot, 'office-empty.webp')),
    ...Object.fromEntries(selectedCharacters.map((_, index) => {
      const relative = `themes/${pack.id}/characters/${String(index + 1).padStart(2, '0')}.webp`
      return [relative, sha256(join(distRoot, relative))]
    }))
  }
  return packTheme
})

const catalog = { schemaVersion: 1, themes: [webTheme, ...additionalThemes] }
const marker = '/*__THEME_CATALOG__*/ { themes: [] }'
const source = readFileSync(join(root, 'src/plugin.js'), 'utf8')
assert.equal(source.split(marker).length, 2, 'plugin source must contain exactly one theme catalog marker')
const entry = source.replace(
  marker,
  JSON.stringify(catalog)
)
writeFileSync(join(distRoot, 'plugin.js'), entry, 'utf8')
writeFileSync(join(distRoot, 'theme-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

const dashboardCatalog = JSON.parse(JSON.stringify(catalog))
for (const theme of dashboardCatalog.themes) {
  if (!theme.ready) continue
  theme.base.asset = `/dashboard-plugins/hermes-pixel-control-room/dist/themes/${theme.id}/office-empty.webp`
  theme.characters.forEach((character, index) => {
    character.asset = `/dashboard-plugins/hermes-pixel-control-room/dist/themes/${theme.id}/characters/${String(index + 1).padStart(2, '0')}.webp`
  })
}
const controlRoomSource = readFileSync(join(root, 'src', 'web', 'control-room.js'), 'utf8').replace(/export function /g, 'function ')
const dashboardEntrySource = readFileSync(join(root, 'src', 'web', 'plugin-entry.js'), 'utf8')
  .replace(/^import .*\r?\n/, '')
  .replace(/export function /g, 'function ')
const dashboardBundle = `(function () {\n"use strict";\nglobalThis.__CONTROL_ROOM_THEMES__ = ${JSON.stringify(dashboardCatalog)};\n${controlRoomSource}\n${dashboardEntrySource}\n})();\n`
writeFileSync(join(dashboardDistRoot, 'index.js'), dashboardBundle, 'utf8')
writeFileSync(join(dashboardDistRoot, 'theme-catalog.json'), `${JSON.stringify(dashboardCatalog, null, 2)}\n`, 'utf8')
