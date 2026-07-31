const STATUS_LABELS = Object.freeze({ idle: 'Idle', working: 'Working', queued: 'Queued', done: 'Done', blocked: 'Blocked', input: 'Needs input' })
const STATUS_CLASS = Object.freeze({ idle: 'status-idle', working: 'status-working', queued: 'status-queued', done: 'status-done', blocked: 'status-blocked', input: 'status-input' })
const SNAPSHOT_URL = '/api/plugins/hermes-pixel-control-room/snapshot'

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
function normalize(snapshot) {
  const agents = new Map((snapshot.profiles || []).map((p) => [p.name, { id: p.name, label: p.name, status: 'idle', station: 'desk', task: null }]))
  for (const task of snapshot.tasks || []) {
    if (!task.assignee) continue
    const agent = agents.get(task.assignee) || { id: task.assignee, label: task.assignee, status: 'idle', station: 'desk', task: null }
    agents.set(agent.id, agent)
    if (!agent.task || Number(task.createdAt) > Number(agent.task.createdAt)) {
      agent.task = task
      agent.status = task.status === 'running' ? 'working' : task.status === 'queued' ? 'queued' : task.status === 'blocked' ? 'blocked' : task.status === 'done' ? 'done' : 'idle'
    }
  }
  return [...agents.values()].sort((a, b) => a.label.localeCompare(b.label))
}
function sprite(agent, index, select) {
  return el('button', { type: 'button', className: `pixel-agent-sprite ${STATUS_CLASS[agent.status] || 'status-unknown'} pixel-walk-${index % 4}`, 'aria-label': `${agent.label}, ${statusLabel(agent.status)}`, onClick: () => select(agent.id) }, [
    el('span', { className: 'pixel-head', 'aria-hidden': 'true' }), el('span', { className: 'pixel-body', 'aria-hidden': 'true' }), el('span', { className: 'pixel-name', textContent: agent.label })
  ])
}
function render(root, state) {
  const selected = state.agents.find((a) => a.id === state.selectedId) || state.agents[0]
  const room = root.querySelector('[data-room]')
  room.replaceChildren(...state.agents.slice(0, 23).map((agent, i) => sprite(agent, i, (id) => { state.selectedId = id; render(root, state) })), state.agents.length > 23 ? el('span', { className: 'pixel-overflow', textContent: `+${state.agents.length - 23}` }) : '')
  const list = root.querySelector('[data-agent-list]')
  list.replaceChildren(...state.agents.map((agent) => el('button', { type: 'button', className: `agent-row${agent.id === selected?.id ? ' is-selected' : ''}`, onClick: () => { state.selectedId = agent.id; render(root, state) } }, [el('strong', { textContent: agent.label }), el('small', { textContent: `${statusLabel(agent.status)} · ${agent.task?.title || 'No active task'}` })])))
  root.querySelector('[data-agent-details]').replaceChildren(selected ? el('section', { className: 'agent-details' }, [el('h3', { textContent: selected.label }), el('p', { textContent: `Status: ${statusLabel(selected.status)}` }), el('p', { textContent: selected.task?.title || 'No active task' })]) : el('p', { textContent: 'No agents found.' }))
}
export function mountControlRoom(root, options = {}) {
  const state = { agents: [], selectedId: null }
  const room = el('section', { className: 'pixel-room', 'aria-label': 'Pixel office room', 'data-room': '' })
  const panel = el('aside', { className: 'control-room-panel' }, [el('h2', { textContent: 'Hermes Control Room' }), el('p', { className: 'control-room-subtitle', textContent: 'Live, read-only Kanban view' }), el('h3', { textContent: 'Agents' }), el('div', { 'data-agent-list': '' }), el('div', { 'data-agent-details': '' })])
  root.replaceChildren(el('div', { className: 'control-room-shell' }, [room, panel]))
  const load = async () => { try { if (typeof options.fetchJSON !== 'function') throw new Error('dashboard SDK unavailable'); state.agents = normalize(await options.fetchJSON(SNAPSHOT_URL)); if (!state.selectedId) state.selectedId = state.agents[0]?.id || null; render(root, state) } catch { panel.prepend(el('p', { className: 'control-room-error', textContent: 'Live snapshot unavailable.' })) } }
  load(); const timer = setInterval(load, 30000)
  return () => { clearInterval(timer); options.onUnmount?.(); root.replaceChildren() }
}
