import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function loadPluginCore() {
  const root = fileURLToPath(new URL('../..', import.meta.url))
  const source = readFileSync(join(root, 'src/plugin.js'), 'utf8')
  const transformed = source
    .replace(/import \{[\s\S]*?\} from '@hermes\/plugin-sdk'\r?\n/, `const Button = 'button'\nconst EmptyState = 'empty-state'\nconst ErrorState = 'error-state'\nconst PALETTE_AREA = 'palette'\nconst PANES_AREA = 'panes'\nconst ROUTES_AREA = 'routes'\nconst ScrollArea = 'scroll-area'\nconst SearchField = 'search-field'\nconst SIDEBAR_NAV_AREA = 'sidebar'\nconst Skeleton = 'skeleton'\nconst StatusDot = 'status-dot'\nconst host = globalThis.__pixelHost\nconst queryClient = globalThis.__pixelQueryClient\nconst relativeTime = (d) => d.toISOString()\nconst useQuery = globalThis.__pixelUseQuery\nconst useValue = (v) => typeof v === 'function' ? v() : v\n`)
    .replace(/import \{ useMemo, useState \} from 'react'\r?\n/, `const useMemo = (fn) => fn()\nconst useState = (initial) => [initial, () => {}]\n`)
    .replace(/import \{ jsx, jsxs \} from 'react\/jsx-runtime'\r?\n/, `const jsx = (type, props, key) => ({ type, props: props || {}, key })\nconst jsxs = jsx\n`)
    .replace(/export default \{/, 'const pluginDefault = {')
    + `\nexport { SNAPSHOT_METHOD, CHANGE_EVENT, queryKey, normalizeSnapshot, mergeSnapshotPages, readSnapshot, buildAgents, applyFilters, stateTotals, officeLayout, assignThemeVisuals, resolveMainProfileId, freshnessState, isSafeEventForScope, registerInvalidationListener, visibleAgentWindow, resolveSelectedAgentId, pluginDefault }\n`
  const encoded = Buffer.from(transformed, 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}-${Math.random()}`)
}

export function installHarness(overrides = {}) {
  const requests = []
  const invalidations = []
  const pages = overrides.pages || []
  globalThis.__pixelHost = {
    state: {
      gateway: () => overrides.gateway || 'open',
      profile: () => overrides.profile || 'felix',
      board: () => overrides.board || 'default'
    },
    request: async (method, params) => {
      requests.push({ method, params })
      const page = pages.shift()
      if (!page) throw new Error('no fixture page')
      return page
    },
    onEvent: () => () => {},
    navigate: () => {}
  }
  globalThis.__pixelQueryClient = { invalidateQueries: (arg) => invalidations.push(arg) }
  globalThis.__pixelUseQuery = (arg) => ({ ...arg, data: overrides.data, isLoading: false, isError: false, isFetching: false, refetch: () => {} })
  return { requests, invalidations }
}
