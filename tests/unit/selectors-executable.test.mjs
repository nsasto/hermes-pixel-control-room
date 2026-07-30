import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from '../fixtures/hermes-read-contract/synthetic-snapshot-v1.json' with { type: 'json' }
import { installHarness, loadPluginCore } from './load-plugin-core.mjs'

function clone(value) { return JSON.parse(JSON.stringify(value)) }
function snapshot(overrides = {}) { return { ...clone(fixture), ...overrides } }

test('selectors do not fabricate unknown agents for unassigned tasks and pick primary by running run first', async () => {
  installHarness()
  const core = await loadPluginCore()
  const safe = core.normalizeSnapshot(snapshot({
    profiles: [{ name: 'felix', onDisk: true, taskCounts: { running: 1 } }],
    tasks: [
      { ...fixture.tasks[0], id: 't_done', assignee: 'felix', status: 'done', currentRunId: null, completedAt: 200 },
      { ...fixture.tasks[0], id: 't_running', assignee: 'felix', status: 'running', currentRunId: 101, startedAt: 150 },
      { ...fixture.tasks[0], id: 't_unassigned', assignee: null, status: 'blocked', currentRunId: null }
    ],
    runs: [{ ...fixture.runs[0], id: 101, taskId: 't_running', profile: 'felix', status: 'running', startedAt: 150, endedAt: null }]
  }))
  const agents = core.buildAgents(safe)
  assert.deepEqual(agents.map((a) => a.id), ['felix'])
  assert.equal(agents[0].primaryTask.id, 't_running')
  assert.equal(agents[0].currentTasks.length, 1)
  const totals = core.stateTotals(agents, safe.tasks)
  assert.equal(totals.blocked, 1, 'unassigned task appears in totals')
})

test('office layout shows all 24 agents and overflows only above the cap', async () => {
  installHarness()
  const core = await loadPluginCore()
  const agents24 = Array.from({ length: 24 }, (_, i) => ({ id: `p${i}`, label: `p${i}`, group: 'idle' }))
  const tiles24 = core.officeLayout(agents24)
  assert.equal(tiles24.length, 24)
  assert.ok(!tiles24.some((t) => t.id === 'overflow'))
  const tiles25 = core.officeLayout([...agents24, { id: 'p24', label: 'p24', group: 'idle' }])
  assert.equal(tiles25.length, 24)
  assert.equal(tiles25.at(-1).label, '+2')
})

test('freshness and event invalidation are scoped to exact board/profile and retain last-good semantics', async () => {
  installHarness()
  const core = await loadPluginCore()
  assert.equal(core.freshnessState({ gateway: 'closed', lastSuccessAt: 10, consecutiveFailures: 0, now: 20 }).label, 'disconnected')
  assert.equal(core.freshnessState({ gateway: 'open', lastSuccessAt: 1, consecutiveFailures: 2, now: 61 }).label, 'stale')
  assert.equal(core.freshnessState({ gateway: 'open', lastSuccessAt: 50, consecutiveFailures: 0, now: 55 }).label, 'fresh')
  assert.equal(core.isSafeEventForScope({ schemaVersion: 1, board: 'default', profile: 'felix' }, { board: 'default', profile: 'felix' }), true)
  assert.equal(core.isSafeEventForScope({ schemaVersion: 1, board: 'other', profile: 'felix' }, { board: 'default', profile: 'felix' }), false)
})
