import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'dashboard/dist/index.js')
const files = ['src/web/fixture.js', 'src/web/control-room.js', 'src/web/plugin-entry.js']
let bundle = ''
for (const file of files) bundle += `\n${await readFile(resolve(root, file), 'utf8')}\n`
bundle = bundle.replace(/export const /g, 'const ').replace(/export function /g, 'function ')
bundle = bundle.replace(/import \{ fixtureSnapshot \} from '\.\/fixture\.js'\n/g, '').replace(/import \{ mountControlRoom \} from '\.\/control-room\.js'\n/g, '')
await mkdir(dirname(output), { recursive: true })
await writeFile(output, `(function () {\n"use strict";\n${bundle}\n})();\n`, 'utf8')
