# Control Room UI and Theme Specification

Status: proposed implementation specification
Date: 2026-07-31
Target: browser-based `hermes dashboard` plugin

## 1. Scope

This document specifies the main Control Room tab, its theme selector, and the first asset-pack integration:

`assets/pixel_art/Modern_Corporate_Office_Pixel_Art_Asset_Pack_v1.0`

The tab is view-only. It observes Hermes profiles, Executions, Activities, statuses, and delegated helpers; it does not start, stop, approve, retry, message, or mutate Hermes work.

The main tab is the product surface. Themes change the room presentation and compatible character/prop assets without changing Hermes state, the side-panel information architecture, or simulation status semantics.

## 2. Main tab layout

### Desktop shell

The tab fills the available dashboard route at a minimum supported width of 1280px.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Control Room · freshness · theme selector · reduced-motion       │
├──────────────────────────────────────────────┬───────────────────┤
│                                              │ Selected Agent    │
│              Pixel office room               │ Executions        │
│              (theme renderer)                │ Current activity  │
│                                              │ Activity log      │
│                                              │ expandable detail │
└──────────────────────────────────────────────┴───────────────────┘
```

### Header

The header contains, left to right:

1. `Control Room` title.
2. Connection/freshness indicator: `Live`, `Reconnecting`, `Stale`, or `Offline`.
3. Theme selector showing the active theme label and a small preview swatch.
4. `Focus selected agent` control.
5. Reduced-motion control with `System`, `On`, and `Off` choices.

The header never displays a theme's raw file path or licensing metadata. A small `Theme info` action may show the human-readable theme description and local asset status.

### Room canvas

The room is the dominant visual region. It must:

- render the selected theme's room base and dynamic Agent Presences;
- keep status markers independent from ambient animation;
- use nearest-neighbor/point filtering for pixel assets;
- preserve the theme's native aspect ratio;
- provide zoom controls and a `Focus selected agent` action;
- expose a parallel accessible agent list for keyboard and assistive technology users;
- stop rendering, timers, SSE, and event processing when the route is unmounted or hidden.

The initial renderer may use a canvas/PixiJS implementation behind the room interface. The DOM panel remains the authoritative accessible surface.

### Side panel

The side panel is always visible on desktop and stacked vertically:

1. **Selected Agent** — display name/profile, persistent character identity, authoritative status/current station, status explanation, and concurrency badge.
2. **Executions** — current/recent executions, title, phase/status, duration, start time, outcome, parent link for temporary helpers, and session link where available.
3. **Activity log** — newest first with timestamp, Agent, phase, tool category/name, duration, and outcome. Rows are concise by default; expansion reveals the complete trusted-instance payload including raw prompt/message/tool/output/error details. Hermes remains the source of truth.
4. **Filters** — Agent, status, activity category, errors/approval/input requests, and bounded text search.

On narrow screens, the room and panel become two tabs: `Room` and `Details & Activity`. Selection remains shared.

## 3. Theme selector

The theme selector lives in the main tab header. Selecting a theme immediately changes room presentation while preserving Agent selection, positions/stations, statuses, open activity details, filters, and reduced-motion preference.

The selector is a keyboard-accessible listbox or native dashboard `Select`. Each option contains a label, preview swatch, perspective/scale label, and asset readiness state: `Ready`, `Missing locally`, or `Incompatible`. Unavailable themes remain visible but disabled with an explanation and expected local path. The plugin never downloads or silently substitutes licensed source assets.

Persist the logical theme id, not filenames, in the versioned plugin settings file:

```json
{
  "schemaVersion": 1,
  "selectedThemeId": "modern-corporate-v1",
  "assignments": {},
  "ui": { "reducedMotion": "system", "zoom": 1 }
}
```

If the selected theme becomes unavailable, retain the preference, show a warning, and fall back temporarily to the fixture renderer. Do not rewrite the preference until the user chooses another theme.

### Theme contract

```ts
type ThemeManifest = {
  id: string
  label: string
  description: string
  perspective: 'top-down' | 'oblique-top-down' | 'side'
  base: { emptyScene: AssetRef; preview?: AssetRef }
  grid: { sourceWidth: number; sourceHeight: number; logicalUnit: number; scale: number }
  characters: CharacterAsset[]
  props?: AssetRef[]
  stations: StationVisual[]
  animation?: { kind: 'head-bob' | 'none'; asset?: AssetRef; loop: boolean }
  license: { sourceLabel: string; localOnly: true; redistributionAllowed: false }
}
```

The simulation consumes logical station ids (`reception-main`, `workstation`, `waiting-lounge`, etc.). A theme maps those ids to coordinates and compatible poses. Simulation code never branches on purchased filenames.

## 4. First theme: Modern Corporate Office v1.0

### Local source

```text
assets/pixel_art/Modern_Corporate_Office_Pixel_Art_Asset_Pack_v1.0/
```

The directory is ignored by Git and must remain user-supplied. The source pack is not copied into the repository or redistributed.

### Pack inventory

| Logical resource | Source asset | Use |
|---|---|---|
| Room base | `01_Scenes/Modern_Corporate_Office_Empty.png` | Live background |
| Reference scene | `01_Scenes/Modern_Corporate_Office_With_Characters.png` | Local visual QA only |
| Character sheet | `02_Characters/Office_Characters_8_Transparent_Sheet.png` | Local catalog/preview |
| Individual characters | `02_Characters/Individual_PNG/*.png` | Selectable Agent identities |
| Core props | `03_Office_Props/Set_01_Core_Office_Props_30/Individual_PNG/*.png` | Station accents |
| Detail props | `03_Office_Props/Set_02_Detail_Props_19/Individual_PNG/*.png` | Reception/kitchen/lounge accents |
| Building modules | `03_Office_Props/Set_03_Building_Modules_9/Individual_PNG/*.png` | Optional room variants |
| Ambient animation | `04_Animation/Modern_Corporate_Office_Head_Bob.gif` | Optional idle reference, never authority |
| Documentation | `05_Documentation/*` | Local licence/import validation |

Source facts from the pack documentation:

- Empty and composed scenes are 1536×1024 PNGs.
- There are eight individual seated characters.
- There are 58 individual transparent office/building assets.
- The GIF contains subtle head movements while fixed room objects remain still.
- Nearest-neighbor/point filtering, lossless/high-quality compression, no anti-aliasing, preserved alpha, and whole-number scaling are recommended.

### Initial identity mapping

The default Hermes profile is the Main Agent and receives `08_Receptionist_Front_Seated.png` plus the `reception-main` home station. Remaining profiles receive unique identities deterministically from the other seven individual PNGs. Users can edit assignments later in the selected-Agent detail view.

The pack's characters are seated poses without chairs. The room theme supplies the chair/desk context; runtime does not stretch a character into a pose the pack does not contain.

### Initial station anchors

Author normalized coordinates against the 1536×1024 scene:

- `reception-main`: reception desk near the entrance;
- `workstation-*`: employee desk cluster;
- `focus-office`: executive/private office;
- `boardroom`: long meeting table/projector area;
- `research-console`: monitor/document area;
- `archive`: filing/storage/printer area;
- `waiting-lounge`: lounge or coffee area;
- `approval-desk`: reception/tablet area;
- `repair-bay`: server rack/printer/equipment area.

Coordinates and walkable paths belong in the theme manifest, not in Hermes adapters or status reducers. A first implementation may use fixed anchors and short pixel-stepped transitions rather than general pathfinding.

### Animation policy

The GIF may be used as a local visual reference and optional idle animation for the static eight-character composition, but it cannot drive a dynamic scene because it cannot represent live identity, selection, status markers, or temporary subagents.

For dynamic Agent Presences:

- use individual PNGs as the identity layer;
- add subtle procedural bob/shadow/marker motion only when enabled;
- use static poses when reduced motion is enabled;
- never let head movement imply Working, Waiting, Error, or approval;
- do not require generated walk-cycle sprites for the first theme.

## 5. Asset preparation and licence boundary

The local preparation script fails closed when the pack is missing. It should:

1. locate the exact pack and verify `START_HERE.txt` plus `05_Documentation/LICENSE_EN.txt`;
2. validate scene dimensions and required character files;
3. generate a private normalized `theme-manifest.json` and optional texture atlas under ignored build output;
4. record pack version and source hashes for diagnostics;
5. never copy source packs into a published package or Git commit;
6. never make original PNG/GIF files directly downloadable from the plugin UI.

The licence permits use, editing, resizing, animation, cropping, and combining inside a completed project. It prohibits reselling or redistributing original or modified source files as an asset pack, resource collection, template, or download. Credit is appreciated but not required.

## 6. Acceptance criteria

- The main tab opens at `/control-room` through the web-dashboard manifest.
- The header lists `Modern Corporate Office` as `Ready` when the local pack validates.
- Selecting the theme swaps the room without losing Agent selection, status, or panel state.
- The default profile renders with the receptionist identity at reception.
- At least eight selectable character identities are available from the local pack.
- The empty 1536×1024 scene is the live base; the composed scene is not.
- Nearest-neighbor rendering preserves crisp pixel edges.
- Missing/invalid assets produce an actionable disabled-theme state, not a broken tab.
- The GIF never drives authoritative status or identity state.
- Source files are absent from Git and are not served by a plugin route.
- Reduced-motion mode disables bobbing/travel while preserving status and selection changes.
- Theme switching works with fixture data before Hermes live observation is connected.
