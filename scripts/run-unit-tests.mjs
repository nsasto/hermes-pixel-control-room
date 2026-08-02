import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('..', import.meta.url))
const unitRoot = join(root, 'tests', 'unit')
const tests = readdirSync(unitRoot)
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => join(unitRoot, name))
const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit' })
process.exitCode = result.status ?? 1
