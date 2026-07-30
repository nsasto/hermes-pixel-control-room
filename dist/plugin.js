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
const MAX_PAGES = 3
const MAX_TEXT = 120
const MAX_OFFICE_OCCUPANTS = 24
const THEME_TOKEN_SENTINELS = ['var(--ui-text-secondary)', 'var(--ui-stroke-secondary)']

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

function normalizeSnapshot(raw) {
  const value = assertObject(raw, 'snapshot')
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('unsupported schema version')
  if (value.ordering !== 'createdAt,id') throw new Error('unsupported ordering')
  const board = safeId(value.board || 'default', 'board')
  const profileScope = value.profile == null ? null : safeId(value.profile, 'profile')
  const profiles = assertArray(value.profiles, 'profiles', 500).map((item) => {
    const p = assertObject(item, 'profile')
    return Object.freeze({
      id: safeId(p.name, 'profile'),
      label: redactText(p.name, 'Unknown agent'),
      onDisk: Boolean(p.onDisk),
      taskCounts: Object.freeze({ ...(p.taskCounts || {}) })
    })
  })
  const profileIds = new Set(profiles.map((p) => p.id))
  const tasks = assertArray(value.tasks, 'tasks', 1000).map((item) => {
    const t = assertObject(item, 'task')
    const status = normalizeStatus(t.status, t.statusKnown)
    const assigneeId = t.assignee == null ? null : safeId(t.assignee, 'profile')
    if (assigneeId) profileIds.add(assigneeId)
    return Object.freeze({
      id: safeId(t.id, 'task'),
      board,
      title: redactText(t.title, 'Untitled task'),
      status,
      group: STATE_GROUPS[status] || 'unknown',
      assigneeId,
      priority: Number.isFinite(t.priority) ? Number(t.priority) : 0,
      createdAt: Number.isFinite(t.createdAt) ? Number(t.createdAt) : 0,
      startedAt: Number.isFinite(t.startedAt) ? Number(t.startedAt) : null,
      completedAt: Number.isFinite(t.completedAt) ? Number(t.completedAt) : null,
      currentRunId: Number.isFinite(t.currentRunId) ? Number(t.currentRunId) : null
    })
  })
  const taskIds = new Set(tasks.map((t) => t.id))
  const runs = assertArray(value.runs, 'runs', 1500).map((item) => {
    const r = assertObject(item, 'run')
    return Object.freeze({
      id: safeId(r.id, 'run'),
      taskId: safeId(r.taskId, 'task'),
      profileId: r.profile == null ? 'profile:unknown' : safeId(r.profile, 'profile'),
      status: clampText(r.status, 'unknown').toLowerCase(),
      statusKnown: r.statusKnown !== false,
      startedAt: Number.isFinite(r.startedAt) ? Number(r.startedAt) : 0,
      endedAt: Number.isFinite(r.endedAt) ? Number(r.endedAt) : null,
      outcome: r.outcome == null ? null : clampText(r.outcome, 'unknown')
    })
  }).filter((run) => taskIds.has(run.taskId))
  return Object.freeze({
    schemaVersion: SCHEMA_VERSION,
    board,
    profile: profileScope,
    revision: Number.isFinite(value.revision) ? Number(value.revision) : 0,
    ordering: 'createdAt,id',
    hasMore: Boolean(value.hasMore),
    nextCursor: value.nextCursor == null ? null : clampText(value.nextCursor, ''),
    profiles: Object.freeze(profiles),
    tasks: Object.freeze(tasks),
    runs: Object.freeze(runs),
    profileIds: Object.freeze([...profileIds])
  })
}

async function readSnapshotPage(cursor) {
  const page = await host.request('kanban.snapshot.v1', { cursor: cursor || undefined, limit: PAGE_LIMIT })
  return normalizeSnapshot(page)
}

async function readSnapshot() {
  let cursor = null
  let merged = null
  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
    const page = await readSnapshotPage(cursor)
    if (!merged) merged = { ...page, profiles: [...page.profiles], tasks: [...page.tasks], runs: [...page.runs] }
    else {
      merged.profiles.push(...page.profiles)
      merged.tasks.push(...page.tasks)
      merged.runs.push(...page.runs)
      merged.hasMore = page.hasMore
      merged.nextCursor = page.nextCursor
      merged.revision = page.revision
    }
    if (!page.hasMore || !page.nextCursor) break
    cursor = page.nextCursor
  }
  return normalizeSnapshot(merged)
}

function queryKey(profile, gateway) {
  return ['pixel-agents', 'snapshot', SCHEMA_VERSION, profile || 'default-profile', gateway || 'unknown-gateway']
}

function usePixelAgentsData() {
  const gateway = useValue(host.state.gateway)
  const profile = useValue(host.state.profile)
  return useQuery({
    queryKey: queryKey(profile, gateway),
    queryFn: readSnapshot,
    enabled: gateway === 'open',
    refetchInterval: gateway === 'open' ? 5000 : false,
    staleTime: 10000,
    keepPreviousData: false
  })
}

function taskRecency(task) {
  return task.startedAt || task.completedAt || task.createdAt || 0
}

function buildAgents(snapshot) {
  if (!snapshot) return []
  const byProfile = new Map()
  for (const id of snapshot.profileIds) byProfile.set(id, { id, label: id === 'profile:unknown' ? 'Unknown agent' : redactText(id, id), tasks: [], runs: [] })
  for (const p of snapshot.profiles) byProfile.set(p.id, { id: p.id, label: p.label, tasks: [], runs: [] })
  for (const task of snapshot.tasks) {
    const id = task.assigneeId || 'profile:unknown'
    if (!byProfile.has(id)) byProfile.set(id, { id, label: id === 'profile:unknown' ? 'Unknown agent' : redactText(id, id), tasks: [], runs: [] })
    byProfile.get(id).tasks.push(task)
  }
  for (const run of snapshot.runs) {
    if (!byProfile.has(run.profileId)) byProfile.set(run.profileId, { id: run.profileId, label: redactText(run.profileId, run.profileId), tasks: [], runs: [] })
    byProfile.get(run.profileId).runs.push(run)
  }
  return [...byProfile.values()].map((agent) => {
    const primaryTask = [...agent.tasks].sort((a, b) => {
      const sa = SEVERITY[a.group] ?? 9
      const sb = SEVERITY[b.group] ?? 9
      if (sa !== sb) return sa - sb
      return taskRecency(b) - taskRecency(a) || a.id.localeCompare(b.id)
    })[0] || null
    const group = primaryTask ? primaryTask.group : 'idle'
    return Object.freeze({ ...agent, group, primaryTask, runCount: agent.runs.filter((r) => r.endedAt == null).length })
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

function stateTotals(agents) {
  const totals = { all: agents.length, running: 0, queued: 0, blocked: 0, done: 0, unknown: 0, idle: 0 }
  for (const agent of agents) totals[agent.group] = (totals[agent.group] || 0) + 1
  return totals
}

function officeLayout(agents) {
  const visible = agents.slice(0, MAX_OFFICE_OCCUPANTS - 1)
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

function FreshnessBadge({ query, gateway }) {
  const kind = gateway !== 'open' ? 'danger' : query.isError ? 'warning' : query.isFetching ? 'info' : 'success'
  const label = gateway !== 'open' ? 'disconnected' : query.isError ? 'stale' : query.isFetching ? 'refreshing' : 'fresh'
  return jsxs('div', { className: 'flex items-center gap-2 text-xs text-(--ui-text-secondary)', children: [jsx(StatusDot, { status: kind }), jsx('span', { children: label })] })
}

function PixelAgentsPage() {
  const gateway = useValue(host.state.gateway)
  const query = usePixelAgentsData()
  const [filters, setFilters] = useState({ state: 'all', search: '' })
  const agents = useMemo(() => buildAgents(query.data), [query.data])
  const filtered = useMemo(() => applyFilters(agents, filters), [agents, filters])
  const totals = stateTotals(agents)
  if (gateway !== 'open') return jsx(ErrorState, { title: 'Pixel Agents unavailable', description: 'Hermes gateway is disconnected. No fallback data path is used.' })
  if (query.isLoading && !query.data) return jsx('div', { className: 'p-4', children: jsx(Skeleton, { className: 'h-40 w-full' }) })
  if (query.isError && !query.data) return jsx(ErrorState, { title: 'Snapshot unavailable', description: 'The approved read-only Kanban snapshot could not be read.' })
  return jsxs('div', { className: 'flex h-full flex-col gap-3 p-4 text-sm', children: [
    jsxs('header', { className: 'flex items-center justify-between gap-3', children: [
      jsxs('div', { children: [jsx('h1', { className: 'text-lg font-semibold', children: 'Pixel Agents' }), jsx('p', { className: 'text-(--ui-text-secondary)', children: query.data ? `Board ${query.data.board} · revision ${query.data.revision}` : 'Read-only Hermes Kanban snapshot' })] }),
      jsxs('div', { className: 'flex items-center gap-2', children: [jsx(FreshnessBadge, { query, gateway }), jsx(Button, { size: 'sm', variant: 'secondary', onClick: () => query['refetch'](), children: 'Retry' })] })
    ] }),
    jsx('div', { className: 'flex flex-wrap gap-2', children: ['all','running','queued','blocked','done','unknown','idle'].map((state) => jsx(Button, { size: 'sm', variant: filters.state === state ? 'primary' : 'secondary', onClick: () => setFilters((f) => ({ ...f, state })), children: `${state} ${totals[state] || 0}` }, state)) }),
    jsx(SearchField, { value: filters.search, onChange: (value) => setFilters((f) => ({ ...f, search: value })), placeholder: 'Search safe fields' }),
    filtered.length === 0 ? jsx(EmptyState, { title: 'No matching agents', description: 'Try clearing filters or wait for the next read-only snapshot.' }) : jsx(ScrollArea, { className: 'min-h-0 flex-1', children: jsx('div', { className: 'grid gap-2', children: filtered.slice(0, 500).map((agent) => jsx(AgentCard, { agent }, agent.id)) }) })
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
  const query = usePixelAgentsData()
  const agents = buildAgents(query.data)
  const tiles = officeLayout(agents)
  return jsxs('div', { className: 'flex h-full flex-col gap-2 p-3 text-xs', children: [
    jsxs('div', { className: 'flex items-center justify-between', children: [jsx('strong', { children: 'Pixel Office' }), jsx(Button, { size: 'xs', variant: 'secondary', onClick: () => host.navigate(ROUTE), children: 'Open dashboard' })] }),
    gateway !== 'open' ? jsx('div', { className: 'text-(--ui-text-secondary)', children: 'Disconnected; no fallback path.' }) : jsx('div', { className: 'relative min-h-[150px] rounded-md border border-(--ui-stroke-secondary)', role: 'list', 'aria-label': 'Pixel Office agents', children: tiles.map((tile) => jsx('button', { type: 'button', role: 'listitem', className: 'absolute rounded px-2 py-1 text-(--ui-text-secondary)', style: { left: `${tile.x}px`, top: `${tile.y}px` }, title: `${tile.label} ${tile.lane}`, children: tile.label }, tile.id)) })
  ] })
}

function registerInvalidationListener() {
  return host.onEvent(CHANGE_EVENT, (event) => {
    const payload = event?.payload || event
    if (!payload || payload.schemaVersion !== SCHEMA_VERSION || typeof payload.board !== 'string') return
    queryClient.invalidateQueries({ queryKey: ['pixel-agents', 'snapshot'] })
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
