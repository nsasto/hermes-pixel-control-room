import {
  Button,
  EmptyState,
  ErrorState,
  PALETTE_AREA,
  PANES_AREA,
  ROUTES_AREA,
  ScrollArea,
  SearchField,
  SIDEBAR_NAV_AREA,
  Skeleton,
  StatusDot,
  host,
  queryClient,
  relativeTime,
  useQuery,
  useValue
} from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'

const SNAPSHOT_METHOD = 'kanban.snapshot.v1'
const CHANGE_EVENT = 'kanban.changed.v1'
const ROUTE = '/pixel-agents'
const SCHEMA_VERSION = 1
const PAGE_LIMIT = 200
const MAX_PAGES = 10
const MAX_TEXT = 120
const MAX_OFFICE_OCCUPANTS = 24
const THEME_TOKEN_SENTINELS = ['var(--ui-text-secondary)', 'var(--ui-stroke-secondary)']
const THEME_CATALOG = /*__THEME_CATALOG__*/ { themes: [] }

const KNOWN_TASK_STATES = new Set(['triage', 'todo', 'scheduled', 'ready', 'running', 'blocked', 'review', 'done', 'archived'])
const STATE_GROUPS = {
  running: 'running',
  ready: 'queued',
  todo: 'queued',
  triage: 'queued',
  scheduled: 'queued',
  review: 'queued',
  blocked: 'blocked',
  done: 'done',
  archived: 'done'
}
const SEVERITY = { blocked: 0, running: 1, queued: 2, unknown: 3, done: 4, idle: 5 }

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi
const SECRET_RE = /\b(?:sk|pk|xox[baprs]|ghp|gho|github_pat|hf|ya29)[_-]?[A-Za-z0-9_=-]{12,}\b/g
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g

function clampText(value, fallback = '') {
  if (value == null) return fallback
  return String(value).replace(CONTROL_RE, '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT)
}

function redactText(value, fallback = 'Untitled task') {
  return clampText(value, fallback)
    .replace(SECRET_RE, '[secret]')
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(URL_RE, '[url]') || fallback
}

function safeId(value, prefix) {
  const text = clampText(value, '')
  return /^[A-Za-z0-9_.:-]{1,96}$/.test(text) ? text : `${prefix}:unknown`
}

function normalizeStatus(status, known) {
  const raw = clampText(status, 'unknown').toLowerCase()
  if (known === false) return 'unknown'
  if (!KNOWN_TASK_STATES.has(raw)) return 'unknown'
  return raw
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value
}

function assertArray(value, label, max = 1000) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`)
  if (value.length > max) throw new Error(`${label} is too large`)
  return value
}

function requireSafeId(value, prefix, label = prefix) {
  const text = clampText(value, '')
  if (!/^[A-Za-z0-9_.:-]{1,96}$/.test(text)) throw new Error(`invalid ${label} id`)
  return text
}

function safeOptionalId(value, prefix, label = prefix) {
  if (value == null) return null
  return requireSafeId(value, prefix, label)
}

function safeNumber(value, label, nullable = false) {
  if (value == null && nullable) return null
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`)
  return Number(value)
}

function normalizeTaskCounts(value) {
  if (value == null) return Object.freeze({})
  const object = assertObject(value, 'taskCounts')
  const output = {}
  for (const [key, count] of Object.entries(object)) {
    const safeKey = clampText(key, '').toLowerCase()
    if (!/^[a-z_:-]{1,32}$/.test(safeKey) || !Number.isFinite(count)) throw new Error('taskCounts must contain finite numeric safe keys')
    output[safeKey] = Number(count)
  }
  return Object.freeze(output)
}

function normalizeRunStatus(value, known) {
  const raw = clampText(value, 'unknown').toLowerCase()
  if (known === false) return 'unknown'
  if (!/^[a-z_:-]{1,32}$/.test(raw)) throw new Error('invalid run status')
  return raw
}

function assertUnique(id, seen, label) {
  if (seen.has(id)) throw new Error(`duplicate ${label} id ${id}`)
  seen.add(id)
}

function normalizeSnapshot(raw) {
  const value = assertObject(raw, 'snapshot')
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('unsupported schema version')
  if (value.ordering !== 'createdAt,id') throw new Error('unsupported ordering')
  const board = requireSafeId(value.board || 'default', 'board', 'board')
  const profileScope = safeOptionalId(value.profile, 'profile', 'profile')
  const profileSeen = new Set()
  const profiles = assertArray(value.profiles, 'profiles', 500).map((item) => {
    const p = assertObject(item, 'profile')
    const id = requireSafeId(p.name, 'profile', 'profile')
    assertUnique(id, profileSeen, 'profile')
    return Object.freeze({ id, label: redactText(p.name, 'Unknown agent'), onDisk: Boolean(p.onDisk), taskCounts: normalizeTaskCounts(p.taskCounts) })
  })
  const profileIds = new Set(profiles.map((p) => p.id))
  const taskSeen = new Set()
  const tasks = assertArray(value.tasks, 'tasks', 1000).map((item) => {
    const t = assertObject(item, 'task')
    const id = requireSafeId(t.id, 'task', 'task')
    assertUnique(id, taskSeen, 'task')
    const status = normalizeStatus(t.status, t.statusKnown)
    const assigneeId = safeOptionalId(t.assignee, 'profile', 'profile')
    if (assigneeId) profileIds.add(assigneeId)
    return Object.freeze({ id, board, title: redactText(t.title, 'Untitled task'), status, group: STATE_GROUPS[status] || 'unknown', assigneeId, blockedKind: t.blockedKind == null ? null : clampText(t.blockedKind, 'unknown').toLowerCase(), priority: Number.isFinite(t.priority) ? Number(t.priority) : 0, createdAt: safeNumber(t.createdAt, 'task.createdAt'), startedAt: safeNumber(t.startedAt, 'task.startedAt', true), completedAt: safeNumber(t.completedAt, 'task.completedAt', true), currentRunId: safeNumber(t.currentRunId, 'task.currentRunId', true) })
  })
  const taskIds = new Set(tasks.map((t) => t.id))
  const runSeen = new Set()
  const runs = assertArray(value.runs, 'runs', 1500).map((item) => {
    const r = assertObject(item, 'run')
    const id = requireSafeId(r.id, 'run', 'run')
    assertUnique(id, runSeen, 'run')
    return Object.freeze({ id, taskId: requireSafeId(r.taskId, 'task', 'task'), profileId: r.profile == null ? 'profile:unknown' : requireSafeId(r.profile, 'profile', 'profile'), status: normalizeRunStatus(r.status, r.statusKnown), statusKnown: r.statusKnown !== false, startedAt: safeNumber(r.startedAt, 'run.startedAt'), endedAt: safeNumber(r.endedAt, 'run.endedAt', true), outcome: r.outcome == null ? null : clampText(r.outcome, 'unknown') })
  }).filter((run) => taskIds.has(run.taskId))
  return Object.freeze({ schemaVersion: SCHEMA_VERSION, board, profile: profileScope, revision: safeNumber(value.revision, 'revision'), ordering: 'createdAt,id', hasMore: Boolean(value.hasMore), nextCursor: value.nextCursor == null ? null : requireSafeId(value.nextCursor, 'cursor', 'cursor'), profiles: Object.freeze(profiles), tasks: Object.freeze(tasks), runs: Object.freeze(runs), profileIds: Object.freeze([...profileIds]) })
}

function assertPageScope(page, scope, index) {
  if (page.board !== scope.board) throw new Error(`inconsistent board on page ${index}`)
  if ((page.profile || null) !== (scope.profile || null)) throw new Error(`inconsistent profile on page ${index}`)
  if (page.ordering !== 'createdAt,id') throw new Error('inconsistent ordering')
}

function mergeSnapshotPages(inputPages, scope = {}) {
  if (!inputPages.length) throw new Error('snapshot returned no pages')
  const pages = inputPages.map((page) => page.profileIds ? page : normalizeSnapshot(page))
  const expected = { board: scope.board || pages[0].board, profile: scope.profile ?? pages[0].profile }
  const merged = { ...pages[0], profiles: [], tasks: [], runs: [], profileIds: [], hasMore: false, nextCursor: null }
  const profileSeen = new Set(), taskSeen = new Set(), runSeen = new Set(), profileIds = new Set()
  let revision = pages[0].revision
  pages.forEach((page, index) => {
    assertPageScope(page, expected, index)
    if (page.revision < revision) throw new Error('revision moved backwards between pages')
    revision = page.revision
    if (index < pages.length - 1 && (!page.hasMore || !page.nextCursor)) throw new Error('missing cursor before final page')
    if (index === pages.length - 1 && page.hasMore && !page.nextCursor) throw new Error('hasMore requires cursor')
    if (index === pages.length - 1 && page.hasMore) throw new Error('Snapshot pagination exceeded safe page budget; narrow board/profile scope or retry after pagination completes')
    for (const p of page.profiles) { if (!profileSeen.has(p.id)) { profileSeen.add(p.id); merged.profiles.push(p); profileIds.add(p.id) } }
    for (const t of page.tasks) { assertUnique(t.id, taskSeen, 'task'); merged.tasks.push(t); if (t.assigneeId) profileIds.add(t.assigneeId) }
    for (const r of page.runs) { assertUnique(r.id, runSeen, 'run'); merged.runs.push(r); profileIds.add(r.profileId) }
    merged.hasMore = page.hasMore; merged.nextCursor = page.nextCursor
  })
  return Object.freeze({ ...merged, board: expected.board, profile: expected.profile, revision, profiles: Object.freeze(merged.profiles), tasks: Object.freeze(merged.tasks), runs: Object.freeze(merged.runs), profileIds: Object.freeze([...profileIds]) })
}

async function readSnapshotPage(scope, cursor) {
  return host.request(SNAPSHOT_METHOD, { board: scope.board, profile: scope.profile || undefined, cursor: cursor || undefined, limit: PAGE_LIMIT })
}

async function readSnapshot(scope = {}) {
  let cursor = null
  const pages = []
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
    const rawPage = await readSnapshotPage(scope, cursor)
    const checked = normalizeSnapshot(rawPage)
    pages.push(checked)
    if (!checked.hasMore || !checked.nextCursor) break
    cursor = checked.nextCursor
  }
  return mergeSnapshotPages(pages, scope)
}

function queryKey(board, profile, gateway) {
  return ['pixel-agents', 'snapshot', SCHEMA_VERSION, board || 'default', profile || 'all-profiles', gateway || 'unknown-gateway']
}

function isSafeEventForScope(payload, scope) {
  if (!payload || payload.schemaVersion !== SCHEMA_VERSION || typeof payload.board !== 'string') return false
  const board = safeId(payload.board, 'board')
  const profile = payload.profile == null ? null : safeId(payload.profile, 'profile')
  return board === scope.board && (profile == null || profile === (scope.profile || null))
}

function freshnessState({ gateway, lastSuccessAt, consecutiveFailures, now }) {
  if (gateway !== 'open') return { label: 'disconnected', kind: 'danger' }
  if (!lastSuccessAt) return { label: 'loading', kind: 'info' }
  if (consecutiveFailures >= 2) return { label: 'stale', kind: 'warning' }
  if (consecutiveFailures > 0) return { label: 'last-good', kind: 'warning' }
  return { label: 'fresh', kind: 'success' }
}

function resolveSelectedAgentId(agents, selectedId) {
  if (!agents.length) return null
  if (selectedId && agents.some((agent) => agent.id === selectedId)) return selectedId
  const preferred = agents.find((agent) => agent.group === 'blocked') || agents.find((agent) => agent.group === 'running') || agents[0]
  return preferred.id
}

function visibleAgentWindow(agents, { start = 0, size = 48, maxRows = 500 } = {}) {
  const totalSafeRows = Math.min(agents.length, maxRows)
  const safeStart = Math.max(0, Math.min(Number(start) || 0, totalSafeRows))
  const safeSize = Math.max(1, Math.min(Number(size) || 48, 80))
  return Object.freeze({
    rows: Object.freeze(agents.slice(safeStart, Math.min(totalSafeRows, safeStart + safeSize))),
    start: safeStart,
    totalSafeRows,
    totalRows: agents.length,
    truncated: agents.length > maxRows
  })
}

function usePixelAgentsData(boardOverride) {
  const gateway = useValue(host.state.gateway)
  const profile = useValue(host.state.profile)
  const boardState = host.state.board ? useValue(host.state.board) : 'default'
  const board = boardOverride || boardState || 'default'
  return useQuery({
    queryKey: queryKey(board, profile, gateway),
    queryFn: () => readSnapshot({ board, profile }),
    enabled: gateway === 'open',
    refetchInterval: gateway === 'open' ? 30000 : false,
    staleTime: 30000,
    keepPreviousData: true
  })
}

function taskRecency(task) {
  return task.startedAt || task.completedAt || task.createdAt || 0
}

function runRecency(run) { return run.startedAt || run.endedAt || 0 }

function buildAgents(snapshot) {
  if (!snapshot) return []
  const byProfile = new Map()
  for (const p of snapshot.profiles) byProfile.set(p.id, { id: p.id, label: p.label, tasks: [], runs: [] })
  for (const task of snapshot.tasks) {
    if (!task.assigneeId) continue
    if (!byProfile.has(task.assigneeId)) byProfile.set(task.assigneeId, { id: task.assigneeId, label: redactText(task.assigneeId, task.assigneeId), tasks: [], runs: [] })
    byProfile.get(task.assigneeId).tasks.push(task)
  }
  for (const run of snapshot.runs) {
    const id = run.profileId
    if (id === 'profile:unknown') continue
    if (!byProfile.has(id)) byProfile.set(id, { id, label: redactText(id, id), tasks: [], runs: [] })
    byProfile.get(id).runs.push(run)
  }
  return [...byProfile.values()].map((agent) => {
    const runningRuns = agent.runs.filter((r) => r.endedAt == null && r.status === 'running').sort((a, b) => runRecency(b) - runRecency(a) || String(a.id).localeCompare(String(b.id)))
    const runTaskIds = new Set(runningRuns.map((r) => r.taskId))
    const activeTasks = agent.tasks.filter((t) => runTaskIds.has(t.id) || !['done', 'archived'].includes(t.status))
    const primaryTask = (runningRuns.length ? agent.tasks.find((t) => t.id === runningRuns[0].taskId) : null) || [...activeTasks].sort((a, b) => (SEVERITY[a.group] ?? 9) - (SEVERITY[b.group] ?? 9) || taskRecency(b) - taskRecency(a) || a.id.localeCompare(b.id))[0] || null
    const group = primaryTask ? primaryTask.group : 'idle'
    return Object.freeze({ ...agent, group, primaryTask, currentTasks: Object.freeze(activeTasks), runCount: runningRuns.length })
  }).sort((a, b) => (SEVERITY[a.group] ?? 9) - (SEVERITY[b.group] ?? 9) || a.id.localeCompare(b.id))
}

function applyFilters(agents, filters) {
  const text = clampText(filters.search || '', '').toLowerCase()
  return agents.filter((agent) => {
    if (filters.state !== 'all' && agent.group !== filters.state) return false
    if (text) {
      const haystack = [agent.id, agent.label, agent.group, agent.primaryTask?.id, agent.primaryTask?.title, agent.primaryTask?.status, agent.primaryTask?.board].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(text)) return false
    }
    return true
  })
}

function stateTotals(agents, tasks = []) {
  const totals = { all: agents.length, running: 0, queued: 0, blocked: 0, done: 0, unknown: 0, idle: 0 }
  for (const agent of agents) totals[agent.group] = (totals[agent.group] || 0) + 1
  for (const task of tasks) if (!task.assigneeId) totals[task.group] = (totals[task.group] || 0) + 1
  return totals
}

function officeLayout(agents) {
  const visible = agents.length > MAX_OFFICE_OCCUPANTS ? agents.slice(0, MAX_OFFICE_OCCUPANTS - 1) : agents.slice(0, MAX_OFFICE_OCCUPANTS)
  const overflow = Math.max(0, agents.length - visible.length)
  const lanes = { running: 0, queued: 1, blocked: 2, idle: 3, done: 3, unknown: 3 }
  const tiles = visible.map((agent, index) => Object.freeze({
    id: agent.id,
    label: agent.label,
    lane: agent.group === 'queued' ? 'queued' : agent.group === 'blocked' ? 'blocked' : agent.group === 'running' ? 'running' : 'idle',
    x: 8 + (index % 12) * 54,
    y: 18 + (lanes[agent.group] ?? 3) * 42
  }))
  if (overflow > 0) tiles.push(Object.freeze({ id: 'overflow', label: `+${overflow}`, lane: 'idle', x: 8 + (visible.length % 12) * 54, y: 18 + 3 * 42 }))
  return Object.freeze(tiles)
}

function assignThemeVisuals(agents, theme, mainProfileId) {
  if (!theme) return []
  const receptionist = theme.characters.find((character) => character.role === 'receptionist') || theme.characters.at(-1)
  const employees = theme.characters.filter((character) => character !== receptionist)
  const reception = theme.stations.find((station) => station.id === 'reception-main') || theme.stations[0]
  const workstations = theme.stations.filter((station) => station.id.startsWith('workstation-'))
  const secondaryIds = agents.filter((agent) => agent.id !== mainProfileId).map((agent) => agent.id).sort()
  return agents.map((agent) => {
    const isMain = agent.id === mainProfileId
    const assignmentIndex = isMain ? -1 : secondaryIds.indexOf(agent.id)
    return Object.freeze({
      ...agent,
      character: isMain ? receptionist : employees[assignmentIndex % employees.length],
      station: isMain ? reception : workstations[assignmentIndex % workstations.length]
    })
  })
}

function themeAssetUrl(asset) {
  return asset ? new URL(asset, import.meta.url).href : null
}

function ThemeSelector({ themeId, onChange }) {
  return jsxs('label', { className: 'flex items-center gap-2 text-xs text-(--ui-text-secondary)', children: [
    jsx('span', { children: 'Theme' }),
    jsxs('select', { value: themeId, onChange: (event) => onChange(event.target.value), className: 'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-primary) px-2 py-1 text-(--ui-text-primary)', 'aria-label': 'Office theme', children: [
      jsx('option', { value: 'fixture', children: 'Simple office' }),
      ...THEME_CATALOG.themes.map((theme) => jsx('option', { value: theme.id, disabled: !theme.ready, children: theme.ready ? theme.label : `${theme.label} (missing locally)` }, theme.id))
    ] })
  ] })
}

function ThemeRoom({ agents, theme, mainProfileId, selectedId, onSelect, compact = false }) {
  if (!theme?.ready) {
    const tiles = officeLayout(agents)
    return jsx('div', { className: 'relative min-h-[180px] rounded-md border border-(--ui-stroke-secondary)', role: 'list', 'aria-label': 'Pixel Office agents', children: tiles.map((tile) => jsx('button', { type: 'button', role: 'listitem', className: 'absolute rounded px-2 py-1 text-(--ui-text-secondary)', style: { left: `${tile.x}px`, top: `${tile.y}px` }, onClick: () => tile.id !== 'overflow' && onSelect?.(tile.id), title: `${tile.label} ${tile.lane}`, children: tile.label }, tile.id)) })
  }
  const visuals = assignThemeVisuals(agents, theme, mainProfileId)
  return jsx('div', {
    className: 'relative w-full overflow-hidden rounded-md border border-(--ui-stroke-secondary)',
    role: 'list',
    'aria-label': `${theme.label} agents`,
    style: { aspectRatio: `${theme.base.width} / ${theme.base.height}`, backgroundImage: `url("${themeAssetUrl(theme.base.asset)}")`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: '100% 100%', imageRendering: 'pixelated' },
    children: visuals.map((visual) => jsx('button', {
      type: 'button',
      role: 'listitem',
      className: `absolute -translate-x-1/2 -translate-y-1/2 rounded-sm focus:outline-none focus:ring-2 ${visual.id === selectedId ? 'ring-2 ring-(--ui-accent)' : ''}`,
      style: { left: `${visual.station.x}%`, top: `${visual.station.y}%`, width: compact ? '6%' : '5%' },
      onClick: () => onSelect?.(visual.id),
      title: `${visual.label} · ${visual.group} · ${visual.station.id}`,
      'aria-label': `${visual.label}, ${visual.group}, at ${visual.station.id}`,
      children: jsxs('span', { className: 'relative block', children: [
        jsx('img', { src: themeAssetUrl(visual.character.asset), alt: '', draggable: 'false', className: 'block h-auto w-full select-none', style: { imageRendering: 'pixelated' } }),
        compact ? null : jsx('span', { className: 'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-(--ui-surface-primary) px-1 text-[10px] text-(--ui-text-primary)', children: visual.label })
      ] })
    }, visual.id))
  })
}

function FreshnessBadge({ query, gateway }) {
  const freshness = freshnessState({ gateway, lastSuccessAt: query.dataUpdatedAt ? Math.floor(query.dataUpdatedAt / 1000) : (query.data ? Math.floor(Date.now() / 1000) : 0), consecutiveFailures: query.isError ? 2 : 0, now: Math.floor(Date.now() / 1000) })
  const kind = query.isFetching ? 'info' : freshness.kind
  const label = query.isFetching ? 'refreshing' : freshness.label
  return jsxs('div', { className: 'flex items-center gap-2 text-xs text-(--ui-text-secondary)', children: [jsx(StatusDot, { status: kind }), jsx('span', { children: label })] })
}

function PixelAgentsPage() {
  const gateway = useValue(host.state.gateway)
  const mainProfileId = useValue(host.state.profile)
  const query = usePixelAgentsData()
  const [filters, setFilters] = useState({ state: 'all', search: '' })
  const defaultTheme = THEME_CATALOG.themes.find((theme) => theme.ready)?.id || 'fixture'
  const [themeId, setThemeId] = useState(defaultTheme)
  const [selectedId, setSelectedId] = useState(null)
  const agents = useMemo(() => buildAgents(query.data), [query.data])
  const filtered = useMemo(() => applyFilters(agents, filters), [agents, filters])
  const totals = stateTotals(agents, query.data?.tasks || [])
  const theme = THEME_CATALOG.themes.find((candidate) => candidate.id === themeId)
  if (gateway !== 'open') return jsx(ErrorState, { title: 'Pixel Agents unavailable', description: 'Hermes gateway is disconnected. No fallback data path is used.' })
  if (query.isLoading && !query.data) return jsx('div', { className: 'p-4', children: jsx(Skeleton, { className: 'h-40 w-full' }) })
  if (query.isError && !query.data) return jsx(ErrorState, { title: 'Snapshot unavailable', description: 'The approved read-only Kanban snapshot could not be read.' })
  return jsxs('div', { className: 'flex h-full flex-col gap-3 p-4 text-sm', children: [
    jsxs('header', { className: 'flex flex-wrap items-center justify-between gap-3', children: [
      jsxs('div', { children: [jsx('h1', { className: 'text-lg font-semibold', children: 'Pixel Agents' }), jsx('p', { className: 'text-(--ui-text-secondary)', children: query.data ? `Board ${query.data.board} · revision ${query.data.revision}` : 'Read-only Hermes Kanban snapshot' })] }),
      jsxs('div', { className: 'flex items-center gap-3', children: [jsx(ThemeSelector, { themeId, onChange: setThemeId }), jsx(FreshnessBadge, { query, gateway }), jsx(Button, { size: 'sm', variant: 'secondary', onClick: () => query['refetch'](), children: 'Retry' })] })
    ] }),
    jsxs('div', { className: 'grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]', children: [
      jsx('section', { className: 'min-w-0', children: jsx(ThemeRoom, { agents, theme, mainProfileId, selectedId, onSelect: setSelectedId }) }),
      jsxs('aside', { className: 'flex min-h-0 flex-col gap-2', children: [
        jsx('div', { className: 'flex flex-wrap gap-2', children: ['all','running','queued','blocked','done','unknown','idle'].map((state) => jsx(Button, { size: 'sm', variant: filters.state === state ? 'primary' : 'secondary', onClick: () => setFilters((f) => ({ ...f, state })), children: `${state} ${totals[state] || 0}` }, state)) }),
        jsx(SearchField, { value: filters.search, onChange: (value) => setFilters((f) => ({ ...f, search: value })), placeholder: 'Search safe fields' }),
        filtered.length === 0 ? jsx(EmptyState, { title: 'No matching agents', description: 'Try clearing filters or wait for the next read-only snapshot.' }) : jsx(ScrollArea, { className: 'min-h-0 flex-1', children: jsx('div', { className: 'grid gap-2', children: filtered.slice(0, 500).map((agent) => jsx(AgentCard, { agent }, agent.id)) }) })
      ] })
    ] })
  ] })
}

function AgentCard({ agent }) {
  const task = agent.primaryTask
  return jsxs('section', { className: 'rounded-md border border-(--ui-stroke-secondary) p-3', tabIndex: 0, 'aria-label': `${agent.label} ${agent.group}`, children: [
    jsxs('div', { className: 'flex items-center justify-between gap-3', children: [jsx('strong', { children: agent.label }), jsx('span', { className: 'text-xs text-(--ui-text-secondary)', children: agent.group })] }),
    jsx('div', { className: 'mt-1 text-(--ui-text-secondary)', children: task ? task.title : 'Idle known profile' }),
    jsx('div', { className: 'mt-1 text-xs text-(--ui-text-tertiary)', children: task ? `${task.id} · ${task.status} · ${relativeTime(new Date(taskRecency(task) * 1000))}` : `${agent.id} · no current task` }),
    agent.runCount > 1 ? jsx('div', { className: 'mt-1 text-xs text-(--ui-text-secondary)', children: `${agent.runCount} concurrent runs` }) : null
  ] })
}

function PixelOfficePane() {
  const gateway = useValue(host.state.gateway)
  const mainProfileId = useValue(host.state.profile)
  const query = usePixelAgentsData()
  const agents = buildAgents(query.data)
  const theme = THEME_CATALOG.themes.find((candidate) => candidate.ready)
  return jsxs('div', { className: 'flex h-full flex-col gap-2 p-3 text-xs', children: [
    jsxs('div', { className: 'flex items-center justify-between', children: [jsx('strong', { children: 'Pixel Office' }), jsx(Button, { size: 'xs', variant: 'secondary', onClick: () => host.navigate(ROUTE), children: 'Open dashboard' })] }),
    gateway !== 'open' ? jsx('div', { className: 'text-(--ui-text-secondary)', children: 'Disconnected; no fallback path.' }) : jsx(ThemeRoom, { agents, theme, mainProfileId, compact: true })
  ] })
}

function registerInvalidationListener() {
  return host.onEvent(CHANGE_EVENT, (event) => {
    const payload = event?.payload || event
    if (!payload || payload.schemaVersion !== SCHEMA_VERSION || typeof payload.board !== 'string') return
    const board = safeId(payload.board, 'board')
    queryClient.invalidateQueries({ predicate: 'pixel-agents-board', board })
  })
}

export default {
  id: 'pixel-agents',
  name: 'Pixel Agents',
  defaultEnabled: true,
  register(ctx) {
    const disposeEvents = registerInvalidationListener()
    const disposeContributions = ctx.registerMany([
      { id: 'route', area: ROUTES_AREA, data: { path: '/pixel-agents' }, render: () => jsx(PixelAgentsPage, {}) },
      { id: 'nav', area: SIDEBAR_NAV_AREA, data: { path: '/pixel-agents', label: 'Pixel Agents', codicon: 'organization' } },
      { id: 'open', area: PALETTE_AREA, data: { id: 'pixel-agents.open', label: 'Open Pixel Agents', keywords: ['pixel', 'agents', 'kanban'], run: () => host.navigate('/pixel-agents') } },
      { id: 'office', area: PANES_AREA, title: 'Pixel Office', data: { placement: 'bottom', dock: { pane: 'workspace', pos: 'bottom' }, height: '220px' }, render: () => jsx(PixelOfficePane, {}) }
    ])
    return () => {
      disposeEvents?.()
      disposeContributions?.()
    }
  }
}
