import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from '../fixtures/hermes-read-contract/synthetic-snapshot-v1.json' with { type: 'json' }
import { installHarness, loadPluginCore } from './load-plugin-core.mjs'

function clone(value) { return JSON.parse(JSON.stringify(value)) }
function page(extra = {}) { return { ...clone(fixture), ...extra } }

test('readSnapshot fails closed instead of silently truncating when page cap is exhausted', async () => {
  const pages = Array.from({ length: 10 }, (_, i) => page({ board: 'default', profile: 'synthetic-felix', hasMore: true, nextCursor: `c${i + 2}`, tasks: [{ ...fixture.tasks[0], id: `t_${i}` }], runs: [] }))
  installHarness({ pages })
  const core = await loadPluginCore()
  await assert.rejects(() => core.readSnapshot({ board: 'default', profile: 'synthetic-felix' }), /Snapshot pagination exceeded safe page budget/)
})

test('changed events invalidate every cached profile query for the same board only', async () => {
  let listener
  const invalidations = []
  globalThis.__pixelHost = {
    state: { gateway: () => 'open', profile: () => 'felix', board: () => 'default' },
    request: async () => page(),
    onEvent: (_name, cb) => { listener = cb; return () => {} },
    navigate: () => {}
  }
  globalThis.__pixelQueryClient = { invalidateQueries: (arg) => invalidations.push(arg) }
  globalThis.__pixelUseQuery = (arg) => ({ ...arg, data: null, isLoading: false, isError: false, isFetching: false, refetch: () => {} })
  const core = await loadPluginCore()
  core.registerInvalidationListener()
  listener({ payload: { schemaVersion: 1, board: 'default', entity: 'task', revision: 20 } })
  listener({ payload: { schemaVersion: 1, board: 'other', entity: 'task', revision: 21 } })
  assert.deepEqual(invalidations, [{ predicate: 'pixel-agents-board', board: 'default' }, { predicate: 'pixel-agents-board', board: 'other' }])
})

test('selection fallback is deterministic and virtual window renders a bounded 500-row UX', async () => {
  installHarness()
  const core = await loadPluginCore()
  const agents = Array.from({ length: 625 }, (_, i) => ({ id: `p${String(i).padStart(3, '0')}`, label: `p${i}`, group: i === 3 ? 'blocked' : 'idle' }))
  assert.equal(core.resolveSelectedAgentId(agents, 'missing'), 'p003')
  const first = core.visibleAgentWindow(agents, { start: 0, size: 40, maxRows: 500 })
  const deep = core.visibleAgentWindow(agents, { start: 480, size: 40, maxRows: 500 })
  assert.equal(first.rows.length, 40)
  assert.equal(deep.rows.length, 20)
  assert.equal(deep.truncated, true)
  assert.equal(deep.totalSafeRows, 500)
})

test('freshness uses two missed active intervals and preserves last-good state', async () => {
  installHarness()
  const core = await loadPluginCore()
  assert.equal(core.freshnessState({ gateway: 'open', lastSuccessAt: 1, consecutiveFailures: 1, now: 999 }).label, 'last-good')
  assert.equal(core.freshnessState({ gateway: 'open', lastSuccessAt: 1, consecutiveFailures: 2, now: 61 }).label, 'stale')
})
