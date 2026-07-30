# Hermes Pixel Control Room Decision Map

## product-boundary: What Is Version One?

Blocked by:
Status: resolved
Type: Grilling

### Question

What surface and capability boundary define the first release?

### Answer

A standalone, view-only plugin for the browser-based `hermes dashboard`; it is not a native Hermes desktop plugin and does not belong to Medi8r. It adds a full control-room tab, may link to existing Hermes session pages, and does not start, stop, approve, retry, or message agents.

## cast-model: What Does One Character Represent?

Blocked by: product-boundary
Status: resolved
Type: Grilling

### Question

How do Hermes concepts map to persistent and temporary characters?

### Answer

Every Hermes profile, including the default profile, has exactly one persistent Agent Presence. Multiple simultaneous Executions produce a count badge and execution list, not clones. Delegated subagents appear as temporary helper characters linked to their parent and leave shortly after completion.

## main-agent: Where Does the Main Agent Belong?

Blocked by: cast-model
Status: resolved
Type: Grilling

### Question

How is the main/EA/orchestration agent identified and placed?

### Answer

The default Hermes profile is initially designated the main agent. It receives the receptionist character and reception home station, always returning there when idle. The designation and character assignment remain editable.

## status-model: What Is Authoritative Status?

Blocked by: cast-model
Status: resolved
Type: Grilling

### Question

How are competing statuses represented?

### Answer

Precedence is Offline, Error, Needs input, Blocked, Working, Waiting, Idle. The highest-priority status controls the character marker; the side panel retains each Execution's individual status. Real status is independent from ambient animation.

## live-observation: How Does Live State Reach the Room?

Blocked by: product-boundary, cast-model
Status: resolved
Type: Research

### Question

How can the room remain responsive without wasteful polling?

### Answer

Hermes plugin lifecycle hooks feed a lightweight local event bridge. The web tab subscribes through an authenticated SSE endpoint exposed by the dashboard plugin backend. A slow reconciliation snapshot repairs missed events after connection or reconnection. Station movement uses a three-second stability delay. When the route is hidden, rendering, timers, SSE, polling, and background updates all stop; reopening fetches a fresh snapshot.

## activity-detail: How Much Activity Is Visible?

Blocked by: live-observation
Status: resolved
Type: Grilling

### Question

What does the activity log expose?

### Answer

This is a trusted single-user installation, so no privacy-redaction layer is required. Rows remain concise; expanding an entry exposes raw prompts, messages, tool arguments, outputs, and errors. Hermes is the durable history; the plugin keeps only a bounded disposable view while open.

## first-room: What Layout Ships First?

Blocked by: cast-model
Status: resolved
Type: Prototype

### Question

What room and capacity define version one?

### Answer

One curated Luxury Office layout supports 12 profiles comfortably and up to 24 gracefully before future paging or multiple rooms. There is no room editor. The empty 2508×2508 scene is the base, with dynamic characters overlaid. Reception belongs to the main agent; central desks are profile workstations; the private office, boardroom, project table, equipment nook, kitchen/lounge, recreation area, and visitor lounge serve as activity and ambient zones.

## movement-style: How Do Static Assets Move?

Blocked by: first-room
Status: resolved
Type: Prototype

### Question

How can a static asset pack support a live room?

### Answer

Characters use pixel-stepped translation, gentle bobbing, alternating tilt, and moving shadows, then swap to supplied seated or activity-specific poses at stations. Lightweight plugin overlays may add monitor glow, status lights, or steam. Full directional walk cycles are out of scope.

## renderer: What Renders the Experience?

Blocked by: first-room, movement-style
Status: resolved
Type: Research

### Question

Which UI stack fits an embedded web-dashboard plugin?

### Answer

PixiJS renders the room, characters, layering, movement, hit-testing, and effects. React and HTML from the Hermes dashboard SDK render the side panel and controls. Navigation uses a simple authored graph rather than a physics engine. Rendering is capped at 30 FPS.

## station-map: Where Do Activities Happen?

Blocked by: first-room, status-model
Status: open
Type: Grilling

### Question

What deterministic mapping sends Hermes events and tools to the available Luxury Office stations?

### Answer

Resolve the exact tool/category vocabulary against Hermes hook payloads and the fixed office zones. Unknown and very brief tools should leave the character at its current or home station.

## profile-discovery: How Are Profiles Enumerated Reliably?

Blocked by: live-observation
Status: open
Type: Research

### Question

Which official Hermes interface enumerates the default and named profiles, and what stable identity survives profile configuration changes?

### Answer

Confirm from current Hermes code and APIs. Plan rename/removal migration behavior for character assignments.

## event-contract: What Events Feed the Simulation?

Blocked by: live-observation, profile-discovery
Status: open
Type: Research

### Question

Which hook payloads and session/run APIs authoritatively cover lifecycle, tools, waiting, approvals, errors, subagents, and completion?

### Answer

Define a small versioned adapter contract and document unsupported or inferred states.

## room-navigation: How Is the Fixed Office Navigated?

Blocked by: first-room, station-map
Status: open
Type: Prototype

### Question

What walkable graph, station anchors, occlusion layers, and crowd rules fit the empty Luxury Office scene?

### Answer

Build an annotated fixture of the fixed room and test it with 12 persistent agents plus temporary helpers.

## character-catalog: How Are Characters Assigned?

Blocked by: first-room
Status: open
Type: Research

### Question

What character/pose variants exist, and how are compatible poses grouped into selectable identities?

### Answer

Inventory the purchased pack. First launch automatically assigns unique characters, with the receptionist reserved for the default/main profile. All assignments are editable; duplicate characters require an explicit override.

## settings-storage: What Persists?

Blocked by: profile-discovery, character-catalog
Status: open
Type: Research

### Question

What exact plugin-owned settings path and schema should persist installation-wide preferences?

### Answer

Use one versioned file under the dashboard profile's `HERMES_HOME` for profile-character mappings, the main-profile designation, home stations, panel preferences, and reduced-motion preference. Do not store activity history.

## side-panel: What Information Architecture Ships?

Blocked by: activity-detail, event-contract
Status: open
Type: Prototype

### Question

What exact fields, filters, expansion behavior, and empty/error states belong in the stacked side panel?

### Answer

Desktop stacks selected-agent summary and executions above a continuously visible activity log. Raw event details expand inline or in a drawer. Narrow screens use separate room and detail/activity tabs.

## performance-accessibility: What Are the Runtime Budgets?

Blocked by: renderer, side-panel, room-navigation
Status: open
Type: Prototype

### Question

What measurable CPU, memory, event-rate, accessibility, zoom, keyboard, and reduced-motion acceptance criteria should version one meet?

### Answer

Desktop-first support begins at 1280px. The first version is silent and performs zero work while its route is hidden.

## packaging: How Is the Plugin Built and Installed?

Blocked by: event-contract, settings-storage, performance-accessibility
Status: open
Type: Research

### Question

What repository, build, install, upgrade, and local-development workflow best fits the Hermes web-dashboard plugin conventions?

### Answer

Package the dashboard manifest, pre-built IIFE bundle, CSS, dashboard FastAPI backend, and Hermes hook plugin without using the desktop SDK.

## asset-distribution: How Are Purchased Assets Protected?

Blocked by: character-catalog, packaging
Status: open
Type: Research

### Question

How can the finished personal plugin use the purchased assets without redistributing them as extractable source assets?

### Answer

The Luxury Office licence permits use and modification in projects but prohibits standalone redistribution. Determine a private-install or user-supplied asset workflow before any distribution.

## fixture-mode: How Is the Room Tested Without Live Hermes Work?

Blocked by: event-contract, room-navigation
Status: open
Type: Prototype

### Question

What deterministic fixture scenarios cover idle, concurrency, delegation, waiting, input, errors, reconnects, and profile changes?

### Answer

Create an offline demo adapter that feeds the same simulation contract as the Hermes adapter.

