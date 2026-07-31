export const fixtureSnapshot = Object.freeze({
  generatedAt: '2026-07-30T12:00:00.000Z',
  agents: Object.freeze([
    Object.freeze({ id: 'default', label: 'Main / EA', status: 'idle', station: 'reception-main', task: null }),
    Object.freeze({ id: 'builder', label: 'Builder', status: 'working', station: 'workstation-01', task: 'Build the control room shell' }),
    Object.freeze({ id: 'researcher', label: 'Researcher', status: 'waiting', station: 'waiting-lounge', task: 'Waiting for source material' })
  ])
})
