(function () {
"use strict";

const fixtureSnapshot = Object.freeze({
  generatedAt: '2026-07-30T12:00:00.000Z',
  agents: Object.freeze([
    Object.freeze({ id: 'default', label: 'Main / EA', status: 'idle', station: 'reception-main', task: null }),
    Object.freeze({ id: 'builder', label: 'Builder', status: 'working', station: 'workstation-01', task: 'Build the control room shell' }),
    Object.freeze({ id: 'researcher', label: 'Researcher', status: 'waiting', station: 'waiting-lounge', task: 'Waiting for source material' })
  ])
})



const STATUS_LABELS = Object.freeze({ idle: 'Idle', working: 'Working', waiting: 'Waiting', error: 'Error', blocked: 'Blocked', input: 'Needs input' })
const STATUS_CLASS = Object.freeze({ idle: 'status-idle', working: 'status-working', waiting: 'status-waiting', error: 'status-error', blocked: 'status-blocked', input: 'status-input' })

function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value
    else if (key === 'textContent') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value)
    else node.setAttribute(key, value)
  }
  for (const child of children) node.append(child)
  return node
}

function statusLabel(status) { return STATUS_LABELS[status] || 'Unknown' }

function renderCharacter(agent, onSelect) {
  const button = el('button', {
    type: 'button', className: `control-room-character ${STATUS_CLASS[agent.status] || 'status-unknown'}`,
    'aria-label': `${agent.label}, ${statusLabel(agent.status)}, ${agent.station}`, onClick: () => onSelect(agent.id)
  })
  button.append(el('span', { className: 'character-silhouette', 'aria-hidden': 'true', textContent: '●' }), el('span', { className: 'character-name', textContent: agent.label }), el('span', { className: 'character-status', textContent: statusLabel(agent.status) }))
  return button
}

function renderPanel(root, state) {
  const selected = state.snapshot.agents.find((agent) => agent.id === state.selectedId) || state.snapshot.agents[0]
  const agentList = el('div', { className: 'control-room-agent-list', role: 'list', 'aria-label': 'Configured Hermes agents' })
  for (const agent of state.snapshot.agents) {
    const row = el('button', { type: 'button', className: `agent-row${agent.id === selected?.id ? ' is-selected' : ''}`, role: 'listitem', 'aria-pressed': String(agent.id === selected?.id), onClick: () => { state.selectedId = agent.id; renderPanel(root, state); renderRoom(root, state) } })
    row.append(el('span', { className: `status-dot ${STATUS_CLASS[agent.status] || 'status-unknown'}`, 'aria-hidden': 'true' }), el('span', { className: 'agent-row-copy' }, [el('strong', { textContent: agent.label }), el('small', { textContent: `${statusLabel(agent.status)} · ${agent.station}` })]))
    agentList.append(row)
  }
  const details = selected ? el('section', { className: 'agent-details', 'aria-labelledby': 'selected-agent-heading' }, [el('h3', { id: 'selected-agent-heading', textContent: selected.label }), el('p', { className: 'detail-status', textContent: `${statusLabel(selected.status)} · ${selected.station}` }), el('p', { className: 'detail-task', textContent: selected.task || 'No active task' })]) : el('p', { className: 'empty-copy', textContent: 'No configured agents yet.' })
  root.querySelector('[data-agent-list]').replaceChildren(agentList)
  root.querySelector('[data-agent-details]').replaceChildren(details)
}

function renderRoom(root, state) {
  const room = root.querySelector('[data-room]')
  room.replaceChildren(...state.snapshot.agents.map((agent) => {
    const character = renderCharacter(agent, (id) => { state.selectedId = id; renderPanel(root, state); renderRoom(root, state) })
    if (agent.id === state.selectedId) character.classList.add('is-selected')
    return character
  }))
}

function mountControlRoom(root, options = {}) {
  const snapshot = options.snapshot || fixtureSnapshot
  const state = { snapshot, selectedId: snapshot.agents[0]?.id || null }
  const room = el('section', { className: 'pixel-room', 'aria-label': 'Pixel office room', 'data-room': '' })
  const panel = el('aside', { className: 'control-room-panel', 'aria-label': 'Agent details and activity' }, [
    el('div', { className: 'panel-heading' }, [el('h2', { textContent: 'Hermes Control Room' }), el('p', { className: 'control-room-subtitle', textContent: 'Fixture mode · view only' })]),
    el('section', { className: 'panel-section', 'aria-labelledby': 'agents-heading' }, [el('h3', { id: 'agents-heading', textContent: 'Agents' }), el('div', { 'data-agent-list': '' })]),
    el('section', { className: 'panel-section', 'aria-labelledby': 'activity-heading' }, [el('h3', { id: 'activity-heading', textContent: 'Activity' }), el('p', { className: 'empty-copy', textContent: 'Live Hermes activity will appear here when the adapter is connected.' })]),
    el('div', { 'data-agent-details': '' })
  ])
  root.replaceChildren(el('div', { className: 'control-room-shell' }, [room, panel]))
  renderPanel(root, state); renderRoom(root, state)
  const onVisibility = () => document.hidden ? options.onHidden?.() : options.onVisible?.()
  document.addEventListener('visibilitychange', onVisibility)
  return () => { document.removeEventListener('visibilitychange', onVisibility); options.onUnmount?.(); root.replaceChildren() }
}



function registerDashboardPlugin(sdk = globalThis.__HERMES_PLUGIN_SDK__, registry = globalThis.__HERMES_PLUGINS__) {
  if (!sdk || !registry) throw new Error('Hermes dashboard Plugin SDK is unavailable')
  function ControlRoomPage() {
    const ref = sdk.React.useRef(null)
    sdk.React.useEffect(() => ref.current ? mountControlRoom(ref.current) : undefined, [])
    return sdk.React.createElement('div', { ref, className: 'control-room-route' })
  }
  registry.register('hermes-pixel-control-room', ControlRoomPage)
  return ControlRoomPage
}

if (globalThis.__HERMES_PLUGIN_SDK__ && globalThis.__HERMES_PLUGINS__) registerDashboardPlugin()


})();
