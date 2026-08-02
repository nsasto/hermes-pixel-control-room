(function () {
"use strict";
globalThis.__CONTROL_ROOM_THEMES__ = {"schemaVersion":1,"themes":[{"id":"modern-corporate-v1","label":"Modern Corporate Office","description":"Local office theme for the first Control Room release.","ready":true,"expectedLocalPath":"assets/pixel_art/Modern_Corporate_Office_Pixel_Art_Asset_Pack_v1.0","base":{"width":1536,"height":1024,"asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/office-empty.png"},"characters":[{"role":"executive","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/01.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/02.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/03.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/04.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/05.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/06.png"},{"role":"employee","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/07.png"},{"role":"receptionist","asset":"/dashboard-plugins/hermes-pixel-control-room/dist/themes/modern-corporate-v1/characters/08.png"}],"stations":[{"id":"reception-main","x":38,"y":77},{"id":"workstation-1","x":27,"y":35},{"id":"workstation-2","x":43,"y":35},{"id":"workstation-3","x":27,"y":47},{"id":"workstation-4","x":43,"y":47},{"id":"workstation-5","x":27,"y":60},{"id":"workstation-6","x":43,"y":60},{"id":"focus-office","x":44,"y":13},{"id":"boardroom","x":82,"y":19},{"id":"research-console","x":78,"y":38},{"id":"archive","x":68,"y":53},{"id":"waiting-lounge","x":80,"y":82},{"id":"approval-desk","x":48,"y":75},{"id":"repair-bay","x":91,"y":42}],"rendering":{"filter":"nearest-neighbor","integerScalePreferred":true,"preserveAlpha":true},"provenance":{"sourceUrl":"https://lennoxstudio.itch.io/luxury-office-pixel-art-asset-pack","packVersion":"1.0","sourceHashes":{"01_Scenes/Modern_Corporate_Office_Empty.png":"8997c626f7789405445ef4424e61e90770a7e6a44934271a0354d055cbb95dce","05_Documentation/LICENSE_EN.txt":"5c906abfbba31500c22ad83f5360c66efa4d97191745cb814051e4050a0c6ec4","02_Characters/Individual_PNG/01_Executive_Manager_Seated.png":"5df05118cc51f53b0f01466edc96fbc00d902d13accd08e75f29b766088d1fc7","02_Characters/Individual_PNG/02_Employee_White_Shirt_Seated.png":"2932584093acc6f1399b7b9c9a9f824ba64d3f98d27432193d3f34dd284e1a71","02_Characters/Individual_PNG/03_Employee_Yellow_Top_Seated.png":"9336688a84befaf017f6489accef6f7e4e19510f50eaf713b8c977bdc27fb61d","02_Characters/Individual_PNG/04_Employee_Green_Top_Seated.png":"97424be312f224555e4d7db5879bb986fac3e8ac1a3645f5aea494d8bb4d2245","02_Characters/Individual_PNG/05_Employee_Purple_Top_Seated.png":"6e52818e20699fa82db8d6d90ce84c3c79d42b6b54aa4659950b3dbd3123f7e6","02_Characters/Individual_PNG/06_Employee_Blue_Top_Seated.png":"72278cb3f0e2f471178e2099e56a9c548faa8b299aa036b0271774cf9df7268a","02_Characters/Individual_PNG/07_Employee_Burgundy_Top_Seated.png":"7cb14160e963a8bc69daf744dd131f708b7747d5bf3ff19f3cb51e5e80c7af5d","02_Characters/Individual_PNG/08_Receptionist_Front_Seated.png":"e2ded3ae5eb554467d06a74d50a808a8277e1d80201bbdfdf8550fbbe523f40d"},"outputHashes":{"themes/modern-corporate-v1/office-empty.png":"8997c626f7789405445ef4424e61e90770a7e6a44934271a0354d055cbb95dce","themes/modern-corporate-v1/characters/01.png":"5df05118cc51f53b0f01466edc96fbc00d902d13accd08e75f29b766088d1fc7","themes/modern-corporate-v1/characters/02.png":"2932584093acc6f1399b7b9c9a9f824ba64d3f98d27432193d3f34dd284e1a71","themes/modern-corporate-v1/characters/03.png":"9336688a84befaf017f6489accef6f7e4e19510f50eaf713b8c977bdc27fb61d","themes/modern-corporate-v1/characters/04.png":"97424be312f224555e4d7db5879bb986fac3e8ac1a3645f5aea494d8bb4d2245","themes/modern-corporate-v1/characters/05.png":"6e52818e20699fa82db8d6d90ce84c3c79d42b6b54aa4659950b3dbd3123f7e6","themes/modern-corporate-v1/characters/06.png":"72278cb3f0e2f471178e2099e56a9c548faa8b299aa036b0271774cf9df7268a","themes/modern-corporate-v1/characters/07.png":"7cb14160e963a8bc69daf744dd131f708b7747d5bf3ff19f3cb51e5e80c7af5d","themes/modern-corporate-v1/characters/08.png":"e2ded3ae5eb554467d06a74d50a808a8277e1d80201bbdfdf8550fbbe523f40d"}}}]};
const STATUS_LABELS = Object.freeze({ idle: 'Idle', working: 'Running', queued: 'Queued', done: 'Done', blocked: 'Blocked', input: 'Needs input' })
const SNAPSHOT_URL = '/api/plugins/hermes-pixel-control-room/snapshot'
const SETTINGS_KEY = 'hermes.control-room.settings.v1'

function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value
    else if (key === 'textContent') node.textContent = value
    else if (key === 'style' && value) Object.assign(node.style, value)
    else if (key === 'value') node.value = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (value != null) node.setAttribute(key, value)
  }
  for (const child of children.flat()) if (child != null && child !== '') node.append(child)
  return node
}

function durableStatus(status) {
  return status === 'running' ? 'working' : status === 'ready' || status === 'queued' || status === 'todo' || status === 'scheduled' ? 'queued' : status === 'blocked' ? 'blocked' : status === 'done' || status === 'archived' ? 'done' : 'idle'
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

function projectControlRoom(snapshot, options = {}) {
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
function selectedTheme(settings) { return themeCatalog().find((theme) => theme.id === settings.themeId) || themeCatalog().find((theme) => theme.ready) || null }

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
  else stage.append(el('div', { className: 'cr-simple-room', textContent: 'Theme assets are not prepared on this installation.' }))
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
      character?.asset ? el('img', { className: 'cr-character', src: character.asset, alt: '', draggable: 'false' }) : el('span', { className: 'cr-fallback-character', textContent: agent.label.slice(0, 1).toUpperCase() }),
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
    el('main', { className: 'cr-layout' }, [renderRoom(state, rerender), renderPanel(state, rerender)])
  ]))
}

function mountControlRoom(root, options = {}) {
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


function registerDashboardPlugin(sdk = globalThis.__HERMES_PLUGIN_SDK__, registry = globalThis.__HERMES_PLUGINS__) {
  if (!sdk || !registry) throw new Error('Hermes dashboard Plugin SDK is unavailable')
  function ControlRoomPage() {
    const ref = sdk.React.useRef(null)
    sdk.React.useEffect(() => ref.current ? mountControlRoom(ref.current, { fetchJSON: sdk.fetchJSON }) : undefined, [ref])
    return sdk.React.createElement('div', { ref, className: 'control-room-route' })
  }
  registry.register('hermes-pixel-control-room', ControlRoomPage)
  return ControlRoomPage
}

if (globalThis.__HERMES_PLUGIN_SDK__ && globalThis.__HERMES_PLUGINS__) registerDashboardPlugin()

})();
