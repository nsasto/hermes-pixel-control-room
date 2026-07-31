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
const requiredFiles = [
  join(sourceRoot, 'START_HERE.txt'),
  join(sourceRoot, themeDefinition.license.documentation),
  sceneSource,
  ...themeDefinition.characters.map((character) => join(characterSourceRoot, character.file))
]
const ready = requiredFiles.every(existsSync)

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
    ...character,
    asset: ready ? `./themes/${themeDefinition.id}/characters/${String(index + 1).padStart(2, '0')}.png` : null
  })),
  stations: themeDefinition.stations,
  rendering: themeDefinition.rendering
}

if (ready) {
  mkdirSync(characterOutputRoot, { recursive: true })
  copyFileSync(sceneSource, join(outputRoot, 'office-empty.png'))
  themeDefinition.characters.forEach((character, index) => {
    copyFileSync(join(characterSourceRoot, character.file), join(characterOutputRoot, `${String(index + 1).padStart(2, '0')}.png`))
  })
}

const catalog = { schemaVersion: 1, themes: [webTheme] }
const entry = readFileSync(join(root, 'src/plugin.js'), 'utf8').replace(
  '/*__THEME_CATALOG__*/ { themes: [] }',
  JSON.stringify(catalog)
)
writeFileSync(join(distRoot, 'plugin.js'), entry, 'utf8')
writeFileSync(join(distRoot, 'theme-catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
