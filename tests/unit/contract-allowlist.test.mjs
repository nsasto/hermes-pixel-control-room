import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = new URL('../..', import.meta.url).pathname
const approvedReadMethods = new Set([
  // Intentionally empty until Hermes core adds a sanctioned read-only snapshot RPC.
  // Example future shape: 'kanban.snapshot.v1'. Do not add renderer-invented names.
])

const forbiddenMethodFragments = [
  'create', 'update', 'delete', 'remove', 'archive', 'assign', 'block', 'unblock',
  'complete', 'comment', 'attach', 'upload', 'spawn', 'stop', 'kill', 'exec',
  'shell', 'sqlite', 'db', 'file', 'transcript', 'log'
]

const forbiddenApis = [
  'ctx.rest', 'ctx.socket', 'host.restartGateway', 'useMutation', 'fetch(',
  'XMLHttpRequest', 'WebSocket', 'child_process', 'fs/promises', 'better-sqlite3',
  'sqlite3'
]

const productionRoots = ['src']

function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(path, out)
    else if (/\.(m?js|c?js|ts|tsx)$/.test(entry.name)) out.push(path)
  }
  return out
}

const fixturePath = join(repoRoot, 'tests/fixtures/hermes-read-contract/synthetic-snapshot-v1.json')
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
assert.equal(fixture.schemaVersion, 1)
assert.ok(Array.isArray(fixture.profiles))
assert.ok(Array.isArray(fixture.tasks))
assert.ok(Array.isArray(fixture.runs))

for (const method of approvedReadMethods) {
  assert.match(method, /^[a-z0-9_.-]+$/)
  for (const fragment of forbiddenMethodFragments) {
    assert.ok(!method.includes(fragment), `approved method ${method} contains forbidden fragment ${fragment}`)
  }
}

for (const root of productionRoots) {
  const abs = join(repoRoot, root)
  if (!existsSync(abs)) continue
  const files = collectFiles(abs)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const api of forbiddenApis) {
      assert.ok(!text.includes(api), `${file} uses forbidden API ${api}`)
    }
    for (const match of text.matchAll(/host\.request\(\s*['"]([^'"]+)['"]/g)) {
      const method = match[1]
      assert.ok(approvedReadMethods.has(method), `${file} uses unapproved host.request method ${method}`)
    }
  }
}
