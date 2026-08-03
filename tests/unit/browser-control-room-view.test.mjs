import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { mountControlRoom, projectControlRoom } from '../../src/web/control-room.js'

const snapshot = {
  schemaVersion: 1,
  board: 'default',
  revision: 12,
  profiles: [
    { name: 'main', onDisk: true },
    { name: 'research', onDisk: true }
  ],
  tasks: [
    { id: 't-main', title: 'Coordinate release', assignee: 'main', status: 'running', createdAt: 20, startedAt: 21, completedAt: null, currentRunId: 7 },
    { id: 't-research', title: 'Compare sources', assignee: 'research', status: 'blocked', createdAt: 10, startedAt: 11, completedAt: null, currentRunId: 8 }
  ],
  runs: [
    { id: 7, taskId: 't-main', profile: 'main', status: 'running', startedAt: 21, endedAt: null, outcome: null },
    { id: 8, taskId: 't-research', profile: 'research', status: 'running', startedAt: 11, endedAt: null, outcome: null }
  ]
}

test('browser Control Room separates durable work status from observed activity', () => {
  const view = projectControlRoom(snapshot, {
    selectedId: 'main',
    activities: [
      { eventId: 'e3', profileName: 'main', occurredAt: new Date().toISOString(), kind: 'semantic.report', state: 'working', activity: 'planning', summary: 'Planning release coordination' },
      { eventId: 'e2', profileName: 'main', occurredAt: '2026-08-02T10:41:00Z', kind: 'subagent.started', summary: 'Delegated research' },
      { eventId: 'e1', profileName: 'main', occurredAt: '2026-08-02T10:40:00Z', kind: 'tool.started', toolCategory: 'browsing', toolName: 'web_search' },
      { eventId: 'e4', profileName: 'research', occurredAt: new Date().toISOString(), kind: 'semantic.report', state: 'blocked', activity: 'researching', summary: 'Comparing sources', blocker: 'Awaiting primary source' }
    ]
  })

  assert.equal(view.selected.label, 'main')
  assert.equal(view.selected.status, 'working')
  assert.equal(view.selected.activity.label, 'planning')
  assert.equal(view.selected.activity.detail, 'Planning release coordination')
  assert.equal(view.selected.executions.length, 1)
  assert.equal(view.selected.executions[0].title, 'Coordinate release')
  assert.deepEqual(view.selected.activities.map((activity) => activity.label), ['Planning release coordination', 'Delegated research', 'Browsing · web_search'])
  assert.equal(view.agents.find((agent) => agent.id === 'research').status, 'blocked')
})

class FakeNode {
  constructor(tag = 'div') { this.tag = tag; this.children = []; this.style = {}; this.attributes = {}; this.listeners = {}; this.textContent = ''; this._value = '' }
  set value(value) { this._value = this.tag === 'select' && !this.children.some((child) => child.value === value) ? '' : value }
  get value() { return this._value }
  append(...children) {
    this.children.push(...children)
    if (this.tag === 'select' && !this._value && children.length) this._value = children[0].value
  }
  replaceChildren(...children) { this.children = [...children] }
  setAttribute(key, value) { this.attributes[key] = String(value) }
  addEventListener(type, listener) { this.listeners[type] = listener }
}

function visibleText(node) {
  if (typeof node === 'string') return node
  return [node.textContent, ...node.children.map(visibleText)].filter(Boolean).join(' ')
}

function findNode(node, predicate) {
  if (predicate(node)) return node
  for (const child of node.children || []) {
    const found = findNode(child, predicate)
    if (found) return found
  }
  return null
}

test('browser Control Room mounts the office-first screen and cleans up', async () => {
  const previousDocument = globalThis.document
  const previousStorage = globalThis.localStorage
  const previousThemes = globalThis.__CONTROL_ROOM_THEMES__
  const documentListeners = {}
  globalThis.document = {
    hidden: false,
    createElement: (tag) => new FakeNode(tag),
    addEventListener: (type, listener) => { documentListeners[type] = listener },
    removeEventListener: (type) => { delete documentListeners[type] }
  }
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }
  globalThis.__CONTROL_ROOM_THEMES__ = { themes: [{ id: 'modern-corporate-v1', label: 'Modern Corporate Office', ready: true, base: { asset: '/office.webp' }, characters: [], stations: [] }] }
  const root = new FakeNode()
  let unmounted = false
  const cleanup = mountControlRoom(root, { fetchJSON: async () => snapshot, onUnmount: () => { unmounted = true } })
  await new Promise((resolve) => setTimeout(resolve, 0))

  const text = visibleText(root)
  for (const label of ['Control Room', 'Focus selected', 'Executions', 'Recent activity', 'Coordinate release']) assert.match(text, new RegExp(label))
  const themeSelect = findNode(root, (node) => node.attributes?.['aria-label'] === 'Office theme')
  assert.equal(themeSelect.value, 'modern-corporate-v1')
  themeSelect.listeners.change({ target: { value: 'simple' } })
  assert.match(visibleText(root), /Simple office/)
  assert.equal(documentListeners.visibilitychange instanceof Function, true)

  cleanup()
  assert.equal(root.children.length, 0)
  assert.equal(unmounted, true)
  assert.equal(documentListeners.visibilitychange, undefined)
  globalThis.document = previousDocument
  globalThis.localStorage = previousStorage
  globalThis.__CONTROL_ROOM_THEMES__ = previousThemes
})

test('browser styles animate only the character head and keep labels legible', () => {
  const css = readFileSync(new URL('../../dashboard/dist/style.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /\.cr-presence\{[^}]*animation:/)
  assert.match(css, /\.cr-character-head\s*\{[^}]*animation:cr-head-bob/)
  assert.match(css, /\.cr-presence-label\s*\{[^}]*background:#12201f[^}]*color:#f5efe3/)
  assert.match(css, /\.cr-panel\s*\{[^}]*color:#f5efe3/)
  assert.match(css, /\.cr-presence-label\s*\{[^}]*opacity:0/)
  assert.match(css, /\.cr-presence:hover \.cr-presence-label[^}]*opacity:1/)
})
