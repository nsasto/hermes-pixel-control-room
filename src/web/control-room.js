const STATUS_LABELS = Object.freeze({ unknown: 'Unknown', idle: 'Idle', working: 'Running', queued: 'Queued', done: 'Done', blocked: 'Blocked', input: 'Needs input' })
const SNAPSHOT_URL = '/api/plugins/hermes-pixel-control-room/snapshot'
const SETTINGS_KEY = 'hermes.control-room.settings.v1'

function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag)
  let deferredValue
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value
    else if (key === 'textContent') node.textContent = value
    else if (key === 'style' && value) Object.assign(node.style, value)
    else if (key === 'value') deferredValue = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (value != null) node.setAttribute(key, value)
  }
  for (const child of children.flat()) if (child != null && child !== '') node.append(child)
  if (deferredValue != null) node.value = deferredValue
  return node
}

function durableStatus(status) {
  return status === 'running' ? 'working' : status === 'ready' || status === 'queued' || status === 'todo' || status === 'scheduled' ? 'queued' : status === 'blocked' ? 'blocked' : status === 'done' || status === 'archived' ? 'done' : status === 'idle' ? 'idle' : 'unknown'
}

function activityPresentation(event) {
  if (!event) return { label: 'Unknown', detail: 'No recent observation' }
  if (event.kind === 'subagent.started') return { label: 'Delegating', detail: event.summary || 'Temporary Helper started' }
  if (event.kind === 'subagent.completed') return { label: 'Reviewing delegation', detail: event.summary || 'Temporary Helper completed' }
  if (event.kind.startsWith('tool.')) {
    const category = event.toolCategory ? event.toolCategory[0].toUpperCase() + event.toolCategory.slice(1) : 'Tool'
    return { label: category, detail: event.toolName || event.summary || event.kind }
  }
  if (event.kind.startsWith('execution.')) return { label: event.kind === 'execution.started' ? 'Starting' : 'Finishing', detail: event.summary || event.kind }
  return { label: 'Observed', detail: event.summary || event.kind }
}

function activityRow(event) {
  const presentation = activityPresentation(event)
  return Object.freeze({ id: event.eventId, occurredAt: event.occurredAt, kind: event.kind, label: event.summary || `${presentation.label} · ${presentation.detail}`, raw: event })
}

export function projectControlRoom(snapshot, options = {}) {
  const profiles = snapshot?.profiles || []
  const tasks = snapshot?.tasks || []
  const runs = snapshot?.runs || []
  const activities = [...(options.activities || [])].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
  const agents = profiles.map((profile) => {
    const agentTasks = tasks.filter((task) => task.assignee === profile.name).sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    const primaryTask = agentTasks[0] || null
    const agentRuns = runs.filter((run) => run.profile === profile.name)
    const agentActivities = activities.filter((event) => event.profileName === profile.name)
    return Object.freeze({
      id: profile.name,
      label: profile.name,
      status: durableStatus(primaryTask?.status),
      activity: activityPresentation(agentActivities[0]),
      task: primaryTask,
      executions: Object.freeze(agentTasks.map((task) => Object.freeze({ id: task.id, title: task.title || 'Untitled execution', status: durableStatus(task.status), startedAt: task.startedAt, completedAt: task.completedAt, run: agentRuns.find((run) => run.taskId === task.id) || null }))),
      activities: Object.freeze(agentActivities.map(activityRow))
    })
  }).sort((a, b) => a.label.localeCompare(b.label))
  const selected = agents.find((agent) => agent.id === options.selectedId) || agents[0] || null
  return Object.freeze({ board: snapshot?.board || 'default', revision: snapshot?.revision ?? null, agents: Object.freeze(agents), selected })
}

function loadSettings() {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(SETTINGS_KEY) || 'null')
    if (value?.schemaVersion === 1) return { schemaVersion: 1, themeId: value.themeId || null, mainAgentId: value.mainAgentId || null, motion: value.motion || 'system', zoom: Number(value.zoom) || 1 }
  } catch { /* presentation storage is optional */ }
  return { schemaVersion: 1, themeId: null, mainAgentId: null, motion: 'system', zoom: 1 }
}

function saveSettings(settings) {
  try { globalThis.localStorage?.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch { /* presentation storage is optional */ }
}

function themeCatalog() { return globalThis.__CONTROL_ROOM_THEMES__?.themes || [] }
function selectedTheme(settings) {
  if (settings.themeId) return themeCatalog().find((theme) => theme.id === settings.themeId && theme.ready) || null
  return themeCatalog().find((theme) => theme.ready) || null
}

function preferredMainAgent(view, settings) {
  return view.agents.find((agent) => agent.id === settings.mainAgentId)?.id
    || view.agents.find((agent) => /^(main|default)$/i.test(agent.id) || /^(main agent|main \/ ea|ea)$/i.test(agent.label))?.id
    || view.agents[0]?.id || null
}

function stationFor(agent, theme, mainAgentId, index) {
  const byId = (id) => theme?.stations.find((station) => station.id === id)
  if (agent.id === mainAgentId && byId('reception-main')) return byId('reception-main')
  if (agent.status === 'blocked' && byId('approval-desk')) return byId('approval-desk')
  if (agent.status === 'queued' && byId('waiting-lounge')) return byId('waiting-lounge')
  if (agent.status === 'working') {
    const active = ['research-console', 'focus-office', 'boardroom', 'archive', 'repair-bay'].map(byId).filter(Boolean)
    if (active.length) return active[index % active.length]
  }
  const desks = theme?.stations.filter((station) => station.id.startsWith('workstation-')) || []
  return desks[index % desks.length] || (theme?.stations?.length ? theme.stations[index % theme.stations.length] : null) || { id: 'office', x: 20 + (index % 4) * 20, y: 30 + Math.floor(index / 4) * 20 }
}

function characterFor(agent, theme, mainAgentId, index) {
  const receptionist = theme?.characters.find((character) => character.role === 'receptionist')
  const others = theme?.characters.filter((character) => character !== receptionist) || []
  return agent.id === mainAgentId ? receptionist : others[index % others.length]
}

function formatTime(value) {
  if (!value) return '—'
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function statusPill(status) { return el('span', { className: `cr-status cr-status-${status}`, textContent: STATUS_LABELS[status] || 'Unknown' }) }

function renderHeader(state, rerender) {
  const themes = themeCatalog()
  const themeSelect = el('select', { className: 'cr-select', value: state.settings.themeId || selectedTheme(state.settings)?.id || 'simple', 'aria-label': 'Office theme', onChange: (event) => { state.settings.themeId = event.target.value; saveSettings(state.settings); rerender() } }, [
    el('option', { value: 'simple', textContent: 'Simple office' }),
    ...themes.map((theme) => el('option', { value: theme.id, textContent: theme.ready ? theme.label : `${theme.label} (missing locally)`, disabled: theme.ready ? null : 'disabled' }))
  ])
  const mainId = preferredMainAgent(state.view, state.settings)
  const mainSelect = el('select', { className: 'cr-select', value: mainId || '', 'aria-label': 'Main Agent at reception', onChange: (event) => { state.settings.mainAgentId = event.target.value; saveSettings(state.settings); rerender() } }, state.view.agents.map((agent) => el('option', { value: agent.id, textContent: agent.label })))
  const motionSelect = el('select', { className: 'cr-select cr-select-small', value: state.settings.motion, 'aria-label': 'Motion preference', onChange: (event) => { state.settings.motion = event.target.value; saveSettings(state.settings); rerender() } }, ['system', 'on', 'off'].map((value) => el('option', { value, textContent: value[0].toUpperCase() + value.slice(1) })))
  return el('header', { className: 'cr-header' }, [
    el('div', { className: 'cr-title-group' }, [el('h1', { textContent: 'Control Room' }), el('span', { className: `cr-freshness ${state.error ? 'is-stale' : 'is-live'}`, textContent: state.error ? '● Stale' : '● Live' })]),
    el('div', { className: 'cr-controls' }, [
      el('label', {}, [el('span', { textContent: 'Theme' }), themeSelect]),
      el('label', {}, [el('span', { textContent: 'Reception' }), mainSelect]),
      el('button', { type: 'button', className: 'cr-button', textContent: 'Focus selected', onClick: () => { state.focusedId = state.view.selected?.id || null; rerender() } }),
      el('label', {}, [el('span', { textContent: 'Motion' }), motionSelect]),
      el('div', { className: 'cr-zoom', 'aria-label': 'Room zoom controls' }, [
        el('button', { type: 'button', className: 'cr-button', textContent: '−', 'aria-label': 'Zoom out', onClick: () => { state.settings.zoom = Math.max(.75, state.settings.zoom - .25); saveSettings(state.settings); rerender() } }),
        el('span', { textContent: `${Math.round(state.settings.zoom * 100)}%` }),
        el('button', { type: 'button', className: 'cr-button', textContent: '+', 'aria-label': 'Zoom in', onClick: () => { state.settings.zoom = Math.min(2, state.settings.zoom + .25); saveSettings(state.settings); rerender() } })
      ])
    ])
  ])
}

function renderRoom(state, rerender) {
  const theme = selectedTheme(state.settings)
  const mainAgentId = preferredMainAgent(state.view, state.settings)
  const stage = el('section', { className: `cr-room${theme?.ready ? ' has-theme' : ' is-simple'}`, 'aria-label': 'Pixel office room', style: { '--cr-room-zoom': String(state.settings.zoom) } })
  if (theme?.ready) stage.append(el('img', { className: 'cr-room-background', src: theme.base.asset, alt: '', draggable: 'false' }))
  else stage.append(el('div', { className: 'cr-simple-room', textContent: state.settings.themeId === 'simple' ? 'Simple office' : 'Theme assets are not prepared on this installation.' }))
  const layer = el('div', { className: 'cr-agent-layer', role: 'list', 'aria-label': 'Configured Hermes Agents' })
  state.view.agents.slice(0, 24).forEach((agent, index) => {
    const station = stationFor(agent, theme, mainAgentId, index)
    const character = characterFor(agent, theme, mainAgentId, index)
    const isSelected = state.view.selected?.id === agent.id
    const presence = el('button', {
      type: 'button', role: 'listitem',
      className: `cr-presence pixel-agent-sprite cr-status-${agent.status}${isSelected ? ' is-selected' : ''}${state.focusedId === agent.id ? ' is-focused' : ''}`,
      style: { left: `${station.x}%`, top: `${station.y}%` },
      'aria-label': `${agent.label}, ${STATUS_LABELS[agent.status] || 'Unknown'}, ${agent.activity.label}, at ${station.id}`,
      onClick: () => { state.selectedId = agent.id; state.view = projectControlRoom(state.snapshot, { selectedId: state.selectedId, activities: state.activities }); rerender() }
    }, [
      character?.asset ? el('span', { className: 'cr-character-stack', 'aria-hidden': 'true' }, [
        el('img', { className: 'cr-character cr-character-body', src: character.asset, alt: '', draggable: 'false' }),
        el('img', { className: 'cr-character cr-character-head', src: character.asset, alt: '', draggable: 'false' })
      ]) : el('span', { className: 'cr-fallback-character', textContent: agent.label.slice(0, 1).toUpperCase() }),
      el('span', { className: 'cr-presence-label' }, [el('strong', { textContent: agent.label }), el('small', { textContent: agent.activity.label })]),
      el('span', { className: 'cr-presence-status', title: STATUS_LABELS[agent.status] || 'Unknown' })
    ])
    layer.append(presence)
  })
  stage.append(layer)
  return el('div', { className: 'cr-room-viewport', 'data-motion': state.settings.motion }, [stage])
}

function renderPanel(state, rerender) {
  const selected = state.view.selected
  if (!selected) return el('aside', { className: 'cr-panel' }, [el('p', { textContent: 'No configured Agents found.' })])
  const executions = selected.executions.length ? selected.executions.map((execution) => el('article', { className: 'cr-execution' }, [
    el('div', { className: 'cr-row-between' }, [el('strong', { textContent: execution.title }), statusPill(execution.status)]),
    el('small', { textContent: `${execution.id} · started ${formatTime(execution.startedAt)}` })
  ])) : [el('p', { className: 'cr-empty', textContent: 'No active or recent executions.' })]
  const activities = selected.activities.length ? selected.activities.map((activity) => el('details', { className: 'cr-activity' }, [
    el('summary', {}, [el('time', { textContent: formatTime(activity.occurredAt) }), el('span', { textContent: activity.label })]),
    el('pre', { textContent: JSON.stringify(activity.raw, null, 2) })
  ])) : [el('p', { className: 'cr-empty', textContent: 'No live observations yet. Durable work status remains authoritative.' })]
  const roster = state.view.agents.map((agent) => el('button', { type: 'button', className: `cr-agent-row${agent.id === selected.id ? ' is-selected' : ''}`, onClick: () => { state.selectedId = agent.id; state.view = projectControlRoom(state.snapshot, { selectedId: agent.id, activities: state.activities }); rerender() } }, [el('span', { textContent: agent.label }), statusPill(agent.status)]))
  return el('aside', { className: 'cr-panel', 'aria-labelledby': 'selected-agent-heading' }, [
    el('section', { className: 'cr-panel-section cr-agent-summary' }, [
      el('div', { className: 'cr-row-between' }, [el('h2', { id: 'selected-agent-heading', textContent: selected.label }), statusPill(selected.status)]),
      el('dl', {}, [
        el('div', {}, [el('dt', { textContent: 'Activity' }), el('dd', { textContent: selected.activity.label })]),
        el('div', {}, [el('dt', { textContent: 'Observed' }), el('dd', { textContent: selected.activity.detail })]),
        el('div', {}, [el('dt', { textContent: 'Executions' }), el('dd', { textContent: String(selected.executions.length) })])
      ])
    ]),
    el('section', { className: 'cr-panel-section' }, [el('h3', { textContent: 'Executions' }), ...executions]),
    el('section', { className: 'cr-panel-section' }, [el('h3', { textContent: 'Recent activity' }), ...activities]),
    el('section', { className: 'cr-panel-section' }, [el('h3', { textContent: 'Agents' }), el('div', { className: 'cr-agent-roster' }, roster)])
  ])
}

function render(root, state) {
  const rerender = () => render(root, state)
  root.replaceChildren(el('div', { className: 'cr-app' }, [
    renderHeader(state, rerender),
    state.error ? el('div', { className: 'cr-warning', textContent: 'Live refresh failed; showing the last successful snapshot.' }) : null,
    state.settings.themeId && state.settings.themeId !== 'simple' && !selectedTheme(state.settings) ? el('div', { className: 'cr-warning', textContent: 'The selected theme is missing locally. Showing the simple office until its prepared assets are available.' }) : null,
    el('main', { className: 'cr-layout' }, [renderRoom(state, rerender), renderPanel(state, rerender)])
  ]))
}

export function mountControlRoom(root, options = {}) {
  const state = { snapshot: null, activities: [], view: projectControlRoom(null), selectedId: null, focusedId: null, settings: loadSettings(), error: null }
  let timer = null
  let disposed = false
  const load = async () => {
    if (disposed || document.hidden) return
    try {
      if (typeof options.fetchJSON !== 'function') throw new Error('dashboard SDK unavailable')
      state.snapshot = await options.fetchJSON(SNAPSHOT_URL)
      state.view = projectControlRoom(state.snapshot, { selectedId: state.selectedId, activities: state.activities })
      state.selectedId = state.view.selected?.id || null
      state.error = null
    } catch (error) { state.error = error }
    render(root, state)
  }
  const start = () => { if (!timer && !document.hidden) { load(); timer = setInterval(load, 30000) } }
  const stop = () => { if (timer) clearInterval(timer); timer = null }
  const visibility = () => document.hidden ? stop() : start()
  document.addEventListener('visibilitychange', visibility)
  render(root, state)
  start()
  return () => { disposed = true; stop(); document.removeEventListener('visibilitychange', visibility); options.onUnmount?.(); root.replaceChildren() }
}
