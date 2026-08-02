import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { loadPluginCore } from './load-plugin-core.mjs'
const src = readFileSync(new URL('../../src/plugin.js', import.meta.url), 'utf8')
for (const lane of ['running','queued','blocked','idle']) assert.ok(src.includes(lane), lane)
assert.ok(src.includes("label: `+${overflow}`"), 'office overflow aggregate exists')

test('theme visuals place the Main Agent at reception with the receptionist identity', async () => {
  const { assignThemeVisuals, resolveMainProfileId } = await loadPluginCore()
  const theme = {
    characters: [
      { role: 'executive', asset: './executive.png' },
      { role: 'employee', asset: './employee.png' },
      { role: 'receptionist', asset: './receptionist.png' }
    ],
    stations: [
      { id: 'reception-main', x: 38, y: 77 },
      { id: 'workstation-1', x: 27, y: 35 }
    ]
  }
  const visuals = assignThemeVisuals([
    { id: 'main', label: 'Main Agent', group: 'idle' },
    { id: 'research', label: 'Research', group: 'running' }
  ], theme, 'main')
  assert.deepEqual(
    { role: visuals[0].character.role, station: visuals[0].station.id, x: visuals[0].station.x, y: visuals[0].station.y },
    { role: 'receptionist', station: 'reception-main', x: 38, y: 77 }
  )
  assert.equal(visuals[1].character.role, 'executive')
  assert.equal(visuals[1].station.id, 'workstation-1')
  assert.equal(resolveMainProfileId({ profiles: [{ id: 'research', label: 'Research' }, { id: 'main', label: 'Main Agent' }] }, 'research'), 'main')
  assert.equal(resolveMainProfileId({ profiles: [{ id: 'custom', label: 'Orchestrator' }, { id: 'main', label: 'Main Agent' }] }, 'main', 'custom'), 'custom')
})
