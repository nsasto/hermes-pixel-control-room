import { mountControlRoom } from './control-room.js'

export function registerDashboardPlugin(sdk = globalThis.__HERMES_PLUGIN_SDK__, registry = globalThis.__HERMES_PLUGINS__) {
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
