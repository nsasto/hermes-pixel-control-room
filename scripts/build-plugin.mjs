import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const entry = readFileSync(join(root, 'src/plugin.js'), 'utf8')
mkdirSync(join(root, 'dist'), { recursive: true })
writeFileSync(join(root, 'dist/plugin.js'), entry, 'utf8')
