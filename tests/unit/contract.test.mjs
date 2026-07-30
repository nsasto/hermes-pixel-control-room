import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const root = new URL('../..', import.meta.url).pathname
const src = readFileSync(join(root, 'src/plugin.js'), 'utf8')
assert.ok(src.includes("const SNAPSHOT_METHOD = 'kanban.snapshot.v1'"))
assert.ok(src.includes("const CHANGE_EVENT = 'kanban.changed.v1'"))
assert.ok(src.includes("host.request('kanban.snapshot.v1'"), 'request method must be literal and allowlisted')
const fixture = JSON.parse(readFileSync(join(root, 'tests/fixtures/hermes-read-contract/synthetic-snapshot-v1.json'), 'utf8'))
assert.equal(fixture.schemaVersion, 1)
assert.equal(fixture.ordering, 'createdAt,id')
assert.equal(fixture.limit, 100)
assert.equal(fixture.hasMore, false)
assert.ok(Array.isArray(fixture.profiles))
assert.ok(Array.isArray(fixture.tasks))
assert.ok(Array.isArray(fixture.runs))
for (const forbidden of ['body','comments','result','error','workspace','metadata','prompt','tool','transcript','env','command','recipient']) {
  assert.ok(!JSON.stringify(fixture).toLowerCase().includes(forbidden), `fixture leaks forbidden sentinel ${forbidden}`)
}
