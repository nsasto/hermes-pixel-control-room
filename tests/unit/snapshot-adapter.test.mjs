import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from '../fixtures/hermes-read-contract/synthetic-snapshot-v1.json' with { type: 'json' }
import { installHarness, loadPluginCore } from './load-plugin-core.mjs'

function clone(value) { return JSON.parse(JSON.stringify(value)) }

function page(extra = {}) { return { ...clone(fixture), ...extra } }

test('readSnapshot decodes each raw page once, preserves profile/task/run identity, and sends exact scope', async () => {
  const first = page({ board: 'ops', profile: 'synthetic-felix', hasMore: true, nextCursor: 'c2', tasks: [fixture.tasks[0]], runs: [fixture.runs[0]] })
  const second = page({ board: 'ops', profile: 'synthetic-felix', revision: 8, nextCursor: null, tasks: [{ ...fixture.tasks[0], id: 't_synthetic002', currentRunId: 46, title: 'Second safe task' }], runs: [{ ...fixture.runs[0], id: 46, taskId: 't_synthetic002' }] })
  const { requests } = installHarness({ board: 'ops', profile: 'synthetic-felix', pages: [first, second] })
  const core = await loadPluginCore()
  const snapshot = await core.readSnapshot({ board: 'ops', profile: 'synthetic-felix' })
  assert.deepEqual(requests, [
    { method: 'kanban.snapshot.v1', params: { board: 'ops', profile: 'synthetic-felix', cursor: undefined, limit: 200 } },
    { method: 'kanban.snapshot.v1', params: { board: 'ops', profile: 'synthetic-felix', cursor: 'c2', limit: 200 } }
  ])
  assert.equal(snapshot.profiles[0].id, 'synthetic-felix')
  assert.equal(snapshot.tasks[0].assigneeId, 'synthetic-felix')
  assert.equal(snapshot.runs[0].profileId, 'synthetic-felix')
  assert.equal(snapshot.tasks.length, 2)
})

test('merge rejects inconsistent scope, revisions going backwards, cursor lies, and duplicates', async () => {
  const core = await loadPluginCore()
  assert.throws(() => core.mergeSnapshotPages([page({ hasMore: true, nextCursor: 'c2' }), page({ board: 'other' })], { board: 'default', profile: null }), /inconsistent board/)
  assert.throws(() => core.mergeSnapshotPages([page({ hasMore: true, nextCursor: 'c2', revision: 9 }), page({ revision: 8 })], { board: 'default', profile: null }), /revision/)
  assert.throws(() => core.mergeSnapshotPages([page({ hasMore: true, nextCursor: null })], { board: 'default', profile: null }), /cursor/)
  assert.throws(() => core.mergeSnapshotPages([page({ hasMore: true, nextCursor: 'c2' }), page()], { board: 'default', profile: null }), /duplicate task id/)
})

test('decoder rejects invalid primitives instead of collapsing identities', async () => {
  const core = await loadPluginCore()
  assert.throws(() => core.normalizeSnapshot(page({ tasks: [{ ...fixture.tasks[0], id: '<bad id>' }] })), /invalid task id/)
  assert.throws(() => core.normalizeSnapshot(page({ profiles: [{ name: 'synthetic-felix', taskCounts: { running: 'many' } }] })), /taskCounts/)
  assert.throws(() => core.normalizeSnapshot(page({ runs: [{ ...fixture.runs[0], status: '<script>' }] })), /invalid run status/)
})
