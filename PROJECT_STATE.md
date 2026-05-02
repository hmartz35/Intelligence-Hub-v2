# Intelligence Hub v2 — Project State

**Branch:** `v2-optimization`
**Last updated:** 2026-05-01
**Phase completed:** Phase 4 + ISR Refactor + Visual Foundation (Phase A) + Phase B1 (Overview Transplant)

---

## Project Goal

Migrate the interactive simulation functionality from the reference site
(`https://hmartz35.github.io/Coding-Practice-6/`) into the new Stitch-designed
UI framework, preserving all interactivity and dynamic data behavior.

**Design source:** `rc/terminals/Slide 1.html` through `Slide 54.html` —
54 Stitch design mockup exports used as visual/layout reference only.
They are NOT wired as iframes or static tabs.

**Non-negotiable constraints:**
1. Stitch slides are design reference only — extract structure, do not iframe
2. `hub-controller.js` state machine is never modified in place; only extended
3. All modules mount as live interactive applications, not HTML injections
4. Simulation engines (Three.js, Leaflet, Chart.js, Web Workers) must survive
   rail navigation without teardown — owned by module lifecycle, not the shell
5. Single `dispatch()` path for all state mutations — no ad-hoc state writes

---

## Repository Layout

```
Intelligence-Hub-v2/
├── index.html                     ← Shell HTML (modified Phase 1)
├── global-ui.css                  ← Compiled Tailwind + custom component classes
├── hub-controller.js              ← State machine (extended Phase 1 hardening — PROTOCOL_EFFECTS, STRIKE_SOLUTIONS, THREAT_PROTOCOLS, SENSOR_NODES added)
├── src/
│   ├── app.js                     ← Shell renderer + dispatch + boot (rewritten Phase 1)
│   ├── router.js                  ← Module registry with mount/unmount/update (new Phase 1)
│   └── modules/
│       ├── overview.js            ← Theater-wide synthesis (new Phase 1)
│       ├── planets.js             ← NASA orbital data bridge (new Phase 1)
│       ├── war-room.js            ← Strike/threat/war-game engine (new Phase 1)
│       ├── orbital.js             ← Asset tracking + sensor lattice (new Phase 1)
│       ├── drone-swarm.js         ← UAV coordination (new Phase 1)
│       ├── electronic-warfare.js  ← Spectrum operations (new Phase 1)
│       ├── hormuz-escalation.js   ← Strait of Hormuz escalation ladder (new Phase 1)
│       └── executive-briefing.js  ← Briefing tools + decision log (new Phase 1)
├── command-center/
│   ├── simulations/
│   │   ├── nasa/index.js          ← NASA sim stub (pre-existing)
│   │   └── hormuz/index.js        ← Hormuz sim stub (pre-existing)
│   └── stitch-snapshots/routes.json
├── rc/terminals/
│   └── Slide 1.html … Slide 54.html   ← Stitch design exports (read-only reference)
└── stitch-batches/                ← Source batch files used to generate rc/terminals/
```

---

## Phase 1 Architecture

### Shell Layout (`index.html` + `src/app.js`)

Three fixed DOM containers that are **never replaced**, only updated:

```
┌─────────────────────────────────────────────────┐  ← #shell-topbar (h:56px, z:50)
│  AETHER COMMAND         THREAT 41 | READY 72%   │    Fixed top bar, UTC clock, metrics
└────────┬────────────────────────────────────────┘
│        │                                         │
│ #shell │  #module-mount                          │
│  -rail │  (position:fixed, top:56px, left:72px)  │
│ (w:72) │  Active module renders here             │
│ z:40   │  Replaced only on module change         │
│        │  update() called on state changes        │
└────────┴────────────────────────────────────────┘
```

**Background layers (body-level, pointer-events:none):**
- `.command-background` — grid + radial gradient, position:fixed, z:0
- `.scanline` — animated sweep effect, position:fixed, z:50

### State Machine (`hub-controller.js`)

Exports pure functions and frozen constants. Extended in Phase 1 hardening; otherwise append-only.

```js
// Pure state functions
createHubState(options)                // factory — initial state object
transitionTerminal(state, id, panel)   // change active module
selectScreen(state, screenId)          // navigate to a screen
updateDrillDownState(state, id, patch) // update per-module drill-down state
advanceWarRoom(state, directiveIds)    // advance week, apply directives
lockStrikeSolution(state, solutionId)  // lock a strike vector
initiateThreatProtocol(state, protocolId) // apply per-protocol effects via PROTOCOL_EFFECTS table
getLayerSummary(state)                 // aggregate per-module status
getScreensForModule(moduleId)          // filter STITCH_SCREENS by layer
validateAssetMappings()                // check asset path health

// Pure state functions
setHormuzParameters(state, params)     // apply slider params → hormuzEscalation delta + log

// Frozen canonical constants (added Phase 1 hardening, extended Phase 2)
STRIKE_SOLUTIONS   // 3 solution vectors — single source of truth
THREAT_PROTOCOLS   // 3 protocol options with correct delta labels
SENSOR_NODES       // 4 sensor node IDs
NAV_MODULES        // 8 rail module definitions
WAR_GAME_ACTORS    // 6-actor cast (US, Iran, UAE, Saudi Arabia, Oman, China)
```

`initiateThreatProtocol` applies distinct per-protocol deltas via `PROTOCOL_EFFECTS`:
```js
containment:   { threat: -6, readiness:  0, spectrumIntegrity:  0 }
deconflict:    { threat: -2, readiness: +4, spectrumIntegrity:  0 }
signal-sweep:  { threat: -4, readiness:  0, spectrumIntegrity: +8 }
```

`DIRECTIVES` extended with 4 new entries (Phase 2):
```js
dip1:  { label: "Engage Saudi Arabia liaison",   impact: -4, domain: "executive-briefing" }
dip2:  { label: "Activate UAE backchannel",       impact: -3, domain: "executive-briefing" }
int1:  { label: "SIGINT surge — Qeshm Island",    impact:  6, domain: "electronic-warfare" }
int2:  { label: "HUMINT asset activation",        impact:  7, domain: "electronic-warfare" }
```

State shape additions (Phase 2):
```js
hormuzParameters: { economicPressure, navalPosture, allianceCohesion, escalationRate }
system.hormuzHistory: [{ week, escalation, source? }]  // appended by advanceWarRoom + setHormuzParameters
```

State shape additions (Reference Refactor):
```js
// Adversary hostility 0–1, adapted from reference war-room.html utility-driven actor models
system.actors: { iran: 0.55, houthis: 0.42, israel: 0.31, ksa: 0.25 }

// Oil price + recession risk, adapted from reference dashboard.html supply-shock model
// Computed by setHormuzParameters and pre-seeded in createHubState
hormuzParameters: { ..., oilPrice: 105, recession: 46 }
```

New exports (Reference Refactor + QA):
```js
ESCALATION_RUNGS    // 10-rung strategic model with narrative descriptions (reference escalation-simulator.html)
THEATER_ASSETS      // 16 real-coordinate Gulf theater assets (CSGs, bases, threats, UAVs, chokepoints)
THEATER_BOUNDS      // [[10,38],[32,67]] — full theater Leaflet fitBounds
HORMUZ_ZOOM_BOUNDS  // [[24.5,54],[28.5,59.5]] — Strait close-up flyToBounds
```

State shape:
```js
{
  activeModule: string,          // current NAV_MODULE id
  activeTerminal: string,        // mirrors activeModule
  activeScreenId: string,        // current STITCH_SCREEN screenId
  drillDown: {                   // per-module drill-down state (persisted)
    [moduleId]: {
      panel: string,             // active sub-panel
      selectedNodeId: string|null,
      activeScreenId: string,
      filters: {},
      scrollY: number
    }
  },
  strikePlanner: { lockedSolutionId, lockCount },
  threatMatrix: { activeProtocolId, protocolCount },
  terminalTransitions: [],       // navigation history
  system: {
    seed, week, readiness, threat, confidence,
    spectrumIntegrity, swarmCohesion, hormuzEscalation,
    log: string[]
  }
}
```

### Dispatch Pattern (`src/app.js`)

```js
export function dispatch(fn, ...args) {
  let next;
  try {
    next = fn(state, ...args);  // pure function → new state object
  } catch (err) {
    console.error("[dispatch] state mutation failed:", err);
    return;                     // bail — state, DOM, and localStorage unchanged
  }
  const prev = state.activeModule;
  state = next;
  try { persist(); } catch (err) { console.warn("[dispatch] persist failed:", err); }
  updateShellMetrics();         // targeted DOM updates — never replaces clock element
  updateShellRail();            // re-renders rail HTML only
  if (state.activeModule !== prev) {
    routeTo(mount, state.activeModule, state, dispatch); // full module swap
  } else {
    updateActive(mount, state); // update() on current module only
  }
}
```

Shell render is split:
- `initTopBar()` — writes topbar HTML once at boot; never called again
- `updateShellMetrics()` — patches `#shell-threat`, `#shell-ready`, `#shell-week` text nodes only
- `updateShellRail()` — replaces rail innerHTML (does not touch topbar or clock)

Call site in modules: `dispatch(lockStrikeSolution, solutionId)`
The dispatch spreads args as: `fn(state, solutionId)` — matches hub-controller signatures.

### Router (`src/router.js`)

```js
registerModule(id, { mount, update })  // call once at boot per module
routeTo(container, moduleId, state, dispatch)
  // if same module → calls update(); no teardown
  // if different   → cleanup(), container.innerHTML='', mount()
updateActive(container, state)         // calls update() on active module
activeModuleId()                       // returns current module id string
```

Module contract every file must satisfy:
```js
export function mount(container, state, dispatch) {
  // render into container
  // attach event listeners (use container.addEventListener, not document)
  return () => { /* cleanup: remove listeners, destroy canvas/map/chart */ };
}

export function update(container, state) {
  // re-render content with new state
  // for Phase 1 modules: container.innerHTML = html(state)
  // for Phase 4+ canvas modules: update data bindings without re-creating renderer
}
```

### Event Handling Architecture

**Global (shell-level):** `rail.addEventListener('click')` in `app.js`
- Handles `[data-module]` buttons scoped to the rail element only
- Dispatches `transitionTerminal`

**Module-level:** each module attaches listener to its `container` in `mount()`
- `data-wr-lock`, `data-wr-protocol`, `data-wr-advance` → war-room
- `data-orb-panel`, `data-orb-node`, `data-orb-screen` → orbital
- `data-swarm-node`, `data-swarm-screen` → drone-swarm
- `data-ew-panel`, `data-ew-node`, `data-ew-screen` → electronic-warfare
- `data-hormuz-advance`, `data-hormuz-screen` → hormuz-escalation
- `data-brief-screen` → executive-briefing
- `data-ov-screen`, `data-ov-module` → overview
- Cleanup removes listener via the returned cleanup function

### CDN Libraries (`index.html`)

Loaded as plain `<script>` tags before the ES module entry point so globals
are available when simulation modules initialize:

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Access in modules as `window.THREE`, `window.Chart`, `window.L`.

---

## Module Inventory

### `overview.js`
**Data sources:** `NAV_MODULES`, `STITCH_SCREENS`, `getLayerSummary()`,
`getScreensForModule()`, `state.system`, `state.drillDown`

**Renders:**
- 6-tile metrics bar (threat, readiness, swarm, spectrum, hormuz, screen count)
- 8-module hierarchy grid (active module highlighted, screen/critical count)
- 55-screen concept state scaffold (grouped by module, all navigable)
- Session log (last 9 entries, newest first)

**Dispatches:** `selectScreen`, `transitionTerminal`

---

### `planets.js` — Space / ISR Intelligence Layer (ISR Refactor)
**Data sources:** `state.system.spectrumIntegrity`, `state.system.threat`, `state.system.actors.iran`, `state.system.week`

**Operationally relevant Space / ISR Intelligence Layer** — replaces generic solar-system orrery.
Shows satellite and airborne ISR coverage over the Gulf / Hormuz theater with state-driven degradation.

**ISR Assets modeled (5 collection platforms):**
- `KH-13` IMINT — 92-min LEO, NW→SE pass, 4.5h revisit; optical (not spectrum-degraded)
- `SIGINT-1` SIGINT — 95-min LEO, NW→SE pass, 2.2h revisit; degrades when SI < 55%
- `SAR-1` GEOINT — 97-min LEO, W→E pass, 3.8h revisit; SAR radar (not spectrum-degraded)
- `RQ-4` ISR — 8h patrol racetrack over central Gulf; persistent; rerouted when threat > 72
- `P-8A` ELINT — 6h patrol over Gulf of Oman; persistent; rerouted when threat > 78

**Panels (segmented control):**
- `coverage` — animated Canvas 2D: ground tracks, footprint ellipses, A2/AD zone, key location markers, HUD
- `timeline` — next overhead pass per asset (T+Hh Mm / OVERHEAD with duration / PERSISTENT for aircraft)
- `collection` — per-type quality bars (IMINT/SIGINT/GEOINT/ISR/ELINT) with degradation reason
- `gaps` — key location coverage: covered/degraded/uncovered + HIGH RISK flag for threat/chokepoint targets

**State connections:**
- `spectrumIntegrity < 55` → SIGINT-1 shown dashed + "DEGRADED" label; collection panel reports degraded
- `system.threat > threatLimit` → RQ-4 (>72) / P-8A (>78) rerouted; labeled DEGRADED with reason
- `actors.iran` → A2/AD zone at Bandar Abbas: 30px base + up to 140px at full hostility; "A2/AD ACTIVE" label when hostility > 0.65
- `system.week` → seeds `_simMin` on init so pass timing is campaign-consistent

**Canvas-safe lifecycle:**
- Three.js removed entirely; Canvas 2D with `_isrCanvas` ref (same pattern as drone-swarm)
- `ISR_TIME_SCALE = 20` sim-min/real-sec → 92-min orbit completes in ~4.6s (visible movement)
- `update()`: if coverage panel + canvas alive → updates `_isrState` (rAF loop reads automatically) + patches header chips + right panel; else full re-render + reinit

**Imports / Dispatches:** `updateDrillDownState` — panel tab switching dispatched on `[data-pl-panel]` click

---

### `war-room.js` — Phase 2 + Reference Refactor
**Data sources:** `state.strikePlanner`, `state.threatMatrix`, `state.system`,
`STRIKE_SOLUTIONS`, `THREAT_PROTOCOLS`, `WAR_GAME_ACTORS` (all from hub-controller),
`state.drillDown["war-room"].panel`, `getScreensForModule("war-room")`

**Panels (segmented control):**
- `overview` — protocol board (3 protocols), strike planner (3 solutions), command log
- `turn-engine` — 10-week timeline, 6-actor posture board, 4 action tracks with directives, Resolve Week button
- `causal` — 18-node causal graph on canvas 2D (values live from state, edges show causal flow)

**Action tracks and directives:**
- Military: `mil1` (raise orbital readiness), `drone5` (retask UAV swarm)
- Diplomatic: `dip3` (open backchannel), `dip1` (Saudi liaison), `dip2` (UAE backchannel)
- Intelligence: `sig2` (signal sweep), `int1` (SIGINT surge — Qeshm), `int2` (HUMINT activation)
- Escalation: `hormuz7` (advance Hormuz ladder)

**Actor posture (refactored):** uses `state.system.actors` tracked hostility values (iran, ksa)
when available; falls back to threshold logic on `hormuzEscalation` for UAE/Oman/China. Iran now
shows 4 states (Hostile/Escalating/Provocative/Restrained) driven by actual simulation dynamics.

**Causal graph:** `_causal` canvas ref stored in module scope. `update()` redraws without
`innerHTML` while on causal panel; switches to other panels use safe `innerHTML` replacement.
18 nodes include all system metrics + hormuzParameters + strikePlanner + threatMatrix fields.

**Dispatches:** `lockStrikeSolution`, `initiateThreatProtocol`, `advanceWarRoom`,
`updateDrillDownState` (panel switch), `selectScreen` (screen rail)

---

### `orbital.js`
**Data sources:** `SIMULATION_ASSETS`, `state.system`, `state.drillDown["orbital"]`,
`state.threatMatrix`, `validateAssetMappings()`, `getScreensForModule("orbital")`

**Sub-views (segmented control → `drillDown.panel`):**
- `overview` — sensor lattice SVG with 4 node buttons; selected node shows telemetry card
- `telemetry` — 6 readout tiles (velocity, altitude, inclination, period, eccentricity, readiness)
- `spectrum` — 3 channel integrity bars + composite spectrumIntegrity value
- `assets` — asset mapping table with validation status
- `briefing` — comm link / SAT-LINK-7 relay status + log

**Dispatches:** `updateDrillDownState`, `selectScreen`

**Screen routing (Phase 1 hardening):** `ROUTE_SUFFIX_TO_PANEL` map added. Screen click fires
both `selectScreen` and `updateDrillDownState("orbital", { panel })` so the internal panel
switches to match the clicked screen (e.g. signal-intel → spectrum, asset-tracking → assets).

---

### `drone-swarm.js` — Phase 4
**Data sources:** `state.system.swarmCohesion`, `state.system.threat`,
`state.drillDown["drone-swarm"]`, `getScreensForModule("drone-swarm")`

Local node data (4 UAV nodes with type, position, altitude, status — not in hub-controller):
```js
{ id: "UAV-RAVEN-03", type: "ISR",    lat: 26.1, lng: 56.3, alt: 8200  }
{ id: "UAV-HAWK-07",  type: "STRIKE", lat: 25.4, lng: 57.8, alt: 6800  }
{ id: "UAV-GHOST-12", type: "EW",     lat: 27.2, lng: 55.1, alt: 9100  }
{ id: "UAV-SHADE-19", type: "RELAY",  lat: 24.8, lng: 58.5, alt: 11000 }
```

**Canvas 2D ABM (Phase 4 + ISR Refactor):**
- Boid steering: waypoint attraction (`WAYPOINT_SPEED=0.5`), orbit waypoint at `ORBIT_RADIUS=18`,
  separation (`SEPARATION_RADIUS=38`), cohesion pull (`COHESION_PULL=0.0012`)
- **Threat-aware dynamics (ISR Refactor):**
  - `effectiveMaxSpeed = BASE_MAX_SPEED * (1 + max(0, threat-50)/100 * 0.65)` — faster under threat
  - `effectiveSepWeight = BASE_SEPARATION * (1 + max(0, threat-50)/100 * 0.9)` — wider dispersal under threat
  - EW UAV (GHOST-12) enters erratic orbit (`orbitRate=0.025` vs normal `0.012`) when degraded
- **EW degradation:** when `spectrumIntegrity < 52` OR `threat > 68` → EW UAV drawn dimmed (α=0.6), "EW DEGRADED" label
- **ISR collection output:** ISR UAV shows "ISR+" / "ISR" / "ISR-" label on canvas; ENHANCED/NOMINAL/REDUCED based on threat
- Geographic coordinate mapping from real lat/lng via `GEO` bounds; HORMUZ STRAIT / BANDAR ABBAS labels
- Cohesion web: lines between agents < 120px, opacity scaled by cohesion
- Canvas HUD: COHESION + THREAT displayed bottom-left

**Per-type informational output (selected card + intel feed):**
- ISR node: ISR collection quality (ENHANCED/NOMINAL/REDUCED) with threat-driven reason
- STRIKE node: WEAPONS HOT / STANDBY based on threat > 65
- EW node: jamming status + degradation reason (SI% or threat%)
- RELAY node: link quality % = `SI * 0.8 + 20`
- `#swarm-intel-feed` card: always-visible 2×2 grid (ISR/EW/Strike/Relay summary), EW degraded warning

**Renders:**
- Live boid canvas (`#swarm-canvas-wrap`, 520×260px) — threat-responsive agent behavior
- Selectable node card list with per-type operational output
- Cohesion progress bar + intel feed (all patched via `patchSwarmInfo` without innerHTML)
- Selected agent telemetry card (`#swarm-selected-card`)

**Dispatches:** `updateDrillDownState`, `selectScreen`

---

### `electronic-warfare.js`
**Data sources:** `state.system.spectrumIntegrity`, `state.system.threat`,
`state.drillDown["electronic-warfare"]`, `getScreensForModule("electronic-warfare")`

Local node data (4 EW nodes with band, power, mode, lat/lng):
```js
{ id: "EW-NODE-12",   band: "L-Band", power: 82, mode: "JAM",     lat: 26.9, lng: 56.3 }
{ id: "EW-NODE-07",   band: "S-Band", power: 67, mode: "SPOOF",   lat: 25.4, lng: 57.6 }
{ id: "EW-NODE-21",   band: "C-Band", power: 91, mode: "MONITOR", lat: 27.5, lng: 55.1 }
{ id: "SATLINK-EW-1", band: "X-Band", power: 74, mode: "RELAY",   lat: 24.8, lng: 58.9 }
```

**Sub-views (segmented control):**
- `overview` — EW sensor lattice with node selection
- `spectrum` — 3 channel health bars + composite integrity value (computed from `spectrumIntegrity`)
- `nodes` — EW node card grid (selectable)
- `gps-denial` — Live GPS denial canvas (Phase 4)

**GPS Denial Canvas (Phase 4):**
- 4 EW nodes mapped to Gulf geography via `GPS_GEO` bounds (same coordinate system as drone-swarm)
- Radial gradient denial zones: radius = `(power/100) * GPS_BASE_RADIUS * (spectrumIntegrity/100)`
- JAM/SPOOF nodes render red zones; MONITOR/RELAY nodes render amber zones
- Tactical grid background; STRAIT OF HORMUZ label at geographic center
- Node crosshairs, ID labels, mode+power readouts
- Legend (jam/spoof vs monitor/relay) + spectrum integrity HUD text
- Canvas-safe: `_gpsCanvas` module-scope ref; static (no rAF loop); redrawn in `update()` when panel active
- `update()` guard: if `gps-denial` panel and `_gpsCanvas` alive → `drawGPSZones(canvas, state)` only (no innerHTML)

Channel health formula: `Math.round(baseHealth * (spectrumIntegrity / 100))`

**Dispatches:** `updateDrillDownState`, `selectScreen`

**Screen routing (Phase 1 hardening):** Screen click detects `spectrum-map` route suffix and
fires `updateDrillDownState("electronic-warfare", { panel: "spectrum" })` automatically.

---

### `hormuz-escalation.js`
**Data sources:** `state.system.hormuzEscalation`, `state.system.threat`,
`state.system.week`, `getScreensForModule("hormuz-escalation")`

Escalation ladder (local, rung `desc` added in reference refactor):
```js
{ level: 1, label: "Elevated Readiness",  threshold: 20, desc: "CENTCOM surges ISR assets..." }
{ level: 2, label: "Naval Posturing",     threshold: 40, desc: "Carrier strike group enters..." }
{ level: 3, label: "Interdiction",        threshold: 55, desc: "IRGCN boards and seizes..." }
{ level: 4, label: "Active Blockade",     threshold: 72, desc: "Iran mines the Strait..." }
{ level: 5, label: "Full-Scale Conflict", threshold: 88, desc: "Iran fires anti-ship ballistic..." }
```

Conflict probability formula: `Math.min(99, Math.round(escalation * 0.6 + threat * 0.4))`

Maritime lanes (local):
```js
{ id: "HORMUZ-LANE-A",   label: "Inbound Tanker Lane",      status: "open"       }
{ id: "HORMUZ-LANE-B",   label: "Outbound Tanker Lane",     status: "monitored"  }
{ id: "TSS-SEPARATION",  label: "Traffic Separation Zone",  status: "restricted" }
{ id: "DEEP-CHANNEL",    label: "Deep Water Channel",       status: "open"       }
```

**Renders:**
- Escalation index bar (color transitions: cyan→amber→red at 40/72)
- 5-rung ladder (active rung computed from index threshold)
- Maritime lane status cards
- Screen rail (2 screens: escalation-ladder, hormuz-conflict-dashboard)

**Dispatches:** `advanceWarRoom(["hormuz7"])`, `selectScreen`, `updateDrillDownState`,
`setHormuzParameters`

**Panels (segmented control):**
- `ladder` — 5-rung escalation ladder (Phase 1, unchanged)
- `dashboard` — Chart.js escalation trajectory line chart + 4 parameter sliders

**Dashboard / Chart.js:** `_chart` instance stored in module closure. `update()` patches
`_chart.data.labels` and `.data` in place (canvas-safe) while on dashboard panel. Switching
panels destroys chart and re-renders via `innerHTML`.

**Sliders:** `navalPosture` (neutral 40), `escalationRate` (neutral 35), `economicPressure`
(neutral 50), `allianceCohesion` (neutral 65). Adjusting above/below neutral produces a pressure
delta applied to `hormuzEscalation` via `setHormuzParameters`. Live slider changes update the
chart preview point (unsaved) without dispatching state. "Apply" dispatches; "Reset" restores
neutral values.

**Escalation history:** `state.system.hormuzHistory` — array of `{week, escalation}` entries.
Appended by `advanceWarRoom` and `setHormuzParameters` in hub-controller. Drives chart labels
and data points.

---

### `executive-briefing.js`
**Data sources:** `EXECUTIVE_BRIEFING_TOOLS` (4 tools), `state.system.log`,
`state.strikePlanner`, `state.threatMatrix`, `getScreensForModule("executive-briefing")`

**Renders:**
- 4 briefing tool cards (navigate to associated screen on click)
- Auto-generated situation report (computed live from all system metrics)
- Full decision log (entire `state.system.log` reversed, indexed)
- Screen rail (14 executive-briefing screens, all navigable)

**Dispatches:** `selectScreen`, inline `state => ({ ...state, activeScreenId: null })` (back button)

**Screen routing (Phase 1 hardening):** `html()` checks `state.activeScreenId` against each
briefing tool's `screenId`. If matched, renders that tool's dedicated sub-view with a
"← Back" button. Back button clears `activeScreenId` returning to the tool list.

---

## CSS Architecture

**`global-ui.css`** — pre-compiled Tailwind output + custom component classes.
Do not edit this file manually; it is built output. Component classes defined here:
`.command-background`, `.scanline`, `.command-shell`, `.command-sidebar`,
`.terminal-nav`, `.terminal-pill`, `.panel`, `.metric-tile`, `.chip`,
`.sensor-map`, `.map-node`, `.screen-row`, `.hierarchy-node`, `.target-card`,
`.data-stack`, `.threat-grid`, `.state-link`, `.log-entry`, etc.

**Shell styles** — injected at boot via `injectShellStyles()` in `app.js`.
These are scoped to `#shell-topbar`, `#shell-rail`, `#module-mount`, and
`.rail-*` / `.shell-*` prefixed selectors. They are not in `global-ui.css`.

---

## Known Limitations / Placeholders

| Module | Limitation | Phase |
|---|---|---|
| `planets.js` | Space/ISR Intelligence Layer — Canvas 2D coverage map — **complete ISR Refactor** | — |
| `war-room.js` | Turn engine, 10-week timeline, 6-actor board, 4 action tracks — **complete Phase 2** | — |
| `war-room.js` | Causal graph canvas stub (18 nodes, static layout, live values) — **complete Phase 2** | — |
| `war-room.js` | Monte Carlo workbench complete (1000-trial, belief table, sensitivity, do-calculus interventions) | — |
| `orbital.js` | Leaflet theater map complete — CartoDB DarkMatter, 16 real Gulf assets, flyTo zoom transitions | — |
| `drone-swarm.js` | Boid ABM with geographic mapping — **complete Phase 4** | — |
| `electronic-warfare.js` | GPS denial canvas with radial gradient zones — **complete Phase 4** | — |
| `hormuz-escalation.js` | Nash equilibrium solver not implemented | 5 |
| `executive-briefing.js` | Principal utility matrix (6×4) not implemented | 8 |
| `war-room.js`, `hormuz-escalation.js` | Canvas guard in place (`let _chart = null`); `update()` will skip innerHTML when a chart is active. All other modules still use full innerHTML replacement — acceptable until their canvas phase. | 2–8 |

---

## Reference Audit + Refactors — 2026-05-01

### Audit scope
Seven reference HTML files analyzed: `war-game.html`, `war-room.html`, `causal-cascade.html`,
`escalation-simulator.html`, `dashboard.html`, `orbital-theater.html`, `principals-chamber.html`.

### Per-system assessment

| System | Reference | v2 | Assessment |
|---|---|---|---|
| Turn engine | Utility-driven adversary models per actor (`turnIran`, `turnHouthis`, etc.) with stochastic branching; seeded RNG | Directive impact + seeded noise formula | **Approximated** — adversary actor tracking added in refactor; utility weights not implemented (Phase 3) |
| Actor posture | Tracked hostility 0–1 values, per-actor response functions | Static threshold logic on `hormuzEscalation` / `threat` | **Refactored** — `system.actors` state added; `actorPosture()` now uses tracked values |
| Causal graph | Monte Carlo belief propagation (sigmoid CPTs, 10k trials), sensitivity analysis, interactive interventions | Canvas 2D visualization, node values from live state | **Stub** — visualization correct; inference engine deferred to Phase 3 |
| Oil/economic model | `oilPrice = 75 + netLoss*4.5`, recession probability formula, cost asymmetry (60:1) | Escalation index only | **Refactored** — oil price + recession added to `setHormuzParameters`; 60:1 cost ratio surfaced in dashboard |
| Escalation ladder | 10 rungs with prose narrative descriptions | 5 rungs, labels only | **Refactored** — narrative `desc` fields added; hub-controller exports 10-rung `ESCALATION_RUNGS` |
| Orbital theater | Three.js globe, Kepler orbital mechanics, real satellite constellation | Panel with sensor lattice | **Deferred** — Phase 3/4 (Three.js) |
| Principals chamber | 6 NSC principals × 5-dimension utility weights, 3-round deliberation, procedural language | Static briefing tool cards | **Deferred** — Phase 8 per existing plan |

### What was refactored
1. **`hub-controller.js`** — `system.actors` added to `createHubState`; `advanceWarRoom` now drifts actor
   hostility based on directive domains (military → iran escalates, diplomatic → iran de-escalates,
   drone ops → houthis degrade); `setHormuzParameters` now computes `oilPrice` and `recession`;
   `ESCALATION_RUNGS` 10-rung export added.
2. **`war-room.js`** — `actorPosture()` refactored to read `state.system.actors` for Iran and KSA;
   Iran now shows Hostile/Escalating/Provocative/Restrained based on tracked `actors.iran` hostility.
3. **`hormuz-escalation.js`** — Rung `desc` narrative fields added; ladder panel shows active rung
   description; dashboard panel adds Economic Impact section (oil price, recession risk, 60:1 cost ratio).

### What was not refactored (with rationale)
- **Monte Carlo causal inference** — Phase 3 scope, explicitly noted in Phase 2 plan
- **Three.js orbital mechanics** — Phase 4 scope
- **Full principals deliberation** — Phase 8 scope; utility weights data deferred with it
- **Additional CATALOG directives (18 total)** — 9 current directives cover all domains; adding more
  is content work not architecture, no fidelity improvement until adversary models are complete
- **Seeded run sharing** — `seededNoise` already uses `state.system.seed`; shareable URL is UI work

---

## Phase 2 Completed — 2026-05-01

### 2a — War Game Turn Engine (`war-room.js`)
- 10-week campaign timeline pill strip (past/active/future states)
- 6-actor posture board — posture derived from `threat`, `hormuzEscalation`, `activeProtocolId`
- 4 action tracks with labeled directive checkboxes: Military, Diplomatic, Intelligence, Escalation
- "Resolve Week N →" button passes only checked directives to `advanceWarRoom`; empty = no-action turn
- Turn outcomes shown from filtered `system.log` entries for the current week
- `data-wr-screen` handler wired (was missing in Phase 1)

### 2b — Causal Graph Canvas (`war-room.js`, `causal` panel)
- 18 nodes: system metrics, hormuzParameters, strikePlanner, threatMatrix, timeline progress
- Directed edges rendered with quadratic Bézier curves and arrowheads
- Node radius and value text driven live from simulation state
- Canvas-safe `update()`: redraws without `innerHTML` while causal panel is active
- Phase 3 will add: probability propagation, Monte Carlo overlay

### 2c — Strategic Dashboard (`hormuz-escalation.js`, `dashboard` panel)
- Chart.js line chart showing `system.hormuzHistory` escalation trajectory over all weeks
- 4 labeled range sliders: Naval Posture, Escalation Rate, Economic Pressure, Alliance Cohesion
- Slider `input` event updates label and appends a live preview point to the chart (no dispatch)
- "Apply" dispatches `setHormuzParameters` → computes delta → mutates `hormuzEscalation` + history
- "Reset" dispatches neutral parameter values
- Canvas-safe `update()`: patches `_chart.data` in place while dashboard is active

### Hub-controller extensions
- 4 new directives: `dip1`, `dip2`, `int1`, `int2`
- `hormuzParameters` added to root state; merged in `app.js` loadState
- `system.hormuzHistory` array; appended by `advanceWarRoom` and `setHormuzParameters`
- `setHormuzParameters(state, params)` — pressure-delta formula, logs to command log
- `WAR_GAME_ACTORS` frozen export (6 actors with id, label, icon)

---

## Phase 1 Hardening — Completed Fixes

All 6 must-fix items from `PHASE_1_FIX_PLAN.md` applied 2026-05-01. Files changed:
`hub-controller.js`, `src/app.js`, `src/modules/war-room.js`,
`src/modules/hormuz-escalation.js`, `src/modules/orbital.js`,
`src/modules/electronic-warfare.js`, `src/modules/executive-briefing.js`.

| Fix | Issue | What changed |
|-----|-------|--------------|
| 1 | #2 | `dispatch()` wrapped in try/catch; errors log and bail without corrupting state |
| 2 | #4 | `STRIKE_SOLUTIONS`, `THREAT_PROTOCOLS`, `SENSOR_NODES` canonicalized in `hub-controller.js`; removed from `app.js` (dead exports) and `war-room.js` (private copy) |
| 3 | #12 | `PROTOCOL_EFFECTS` table in `hub-controller.js`; `initiateThreatProtocol` now applies distinct deltas per protocol matching the UI labels |
| 4 | #32 | `[data-module]` click handler moved from `document` to `rail` element |
| 4+ | #1 | Clock race fixed: `initTopBar()` once at boot; `updateShellMetrics()` does targeted DOM patches; `#shell-clock` is never destroyed by dispatch |
| 5 | #29 | `let _chart = null` canvas guard in `war-room.js` and `hormuz-escalation.js`; cleanup destroys chart |
| 6 | #31 | Screen→panel routing in `orbital.js` (route-suffix map), `electronic-warfare.js` (spectrum-map), and `executive-briefing.js` (tool screenId sub-view + back button) |

---

## QA Checklist — 2026-05-01

**Test suite:** 15 / 15 pass (`node --test tests/hub-controller.test.mjs`)

| Check | Result | Notes |
|---|---|---|
| War Room turn engine changes actor hostility after directives | ✅ Pass | Diplomatic → Iran drops; military+escalation → Iran rises; dip1 → KSA drops; drone5 → Houthis degrade |
| Actors clamped 0–1 after 10 aggressive turns | ✅ Pass | No overflow in stress test |
| `hormuzHistory` accumulates across `advanceWarRoom` and `setHormuzParameters` | ✅ Pass | |
| `setHormuzParameters` computes oil price and recession | ✅ Pass | navalPosture=90 → $117/bbl, recession rises |
| `ESCALATION_RUNGS` export: 10 rungs, `desc` field non-trivial | ✅ Pass | |
| `WAR_GAME_ACTORS`: all 6 regional actors present | ✅ Pass | |
| No-action turn (empty directives) advances week without crash | ✅ Pass | |
| Legacy tests (module transitions, screen routing, asset mappings) | ✅ Pass | All 7 unchanged |
| Navigation after localStorage load | ✅ Expected pass — `system: { ...fresh.system, ...parsed.system }` spread gives fresh `actors` defaults to old saves |
| Economic Impact panel renders | ✅ Pass (static analysis) — oil/recession computed inline from live `hormuzEscalation`, not stored value; always current |

**No bugs found** in the reference refactor. No fixes required.

---

## Theater Map Assessment — 2026-05-01

### Current state

The `orbital.js` and `drone-swarm.js` modules both render an abstract "sensor map" — a 300px CSS `div` with a grid background pattern and 4 absolutely positioned node buttons at fixed percentage coordinates (`.map-node-1` through `.map-node-4`). The SVG paths are generic Bézier curves with no geographic meaning.

Leaflet 1.9.4 is already loaded via CDN (`index.html` lines 12 and 24) but never instantiated. The `orbital.js` module comment says "Phase 4 will replace the sensor map SVG with a Leaflet.js theater map."

UAV nodes in `drone-swarm.js` carry real lat/lng data (e.g. `lat: 26.1, lng: 56.3` — Gulf of Oman) but these are only displayed as text in the telemetry card, not rendered geographically.

### Why the current map is inadequate for this simulation

The conflict is operationally specific: the Strait of Hormuz is only **33 nautical miles wide**. The Strait, Bandar Abbas, and the tanker lanes are the precise geographic features driving the entire escalation model. An abstract circular sensor map conveys none of this. For a simulation claiming to model Hormuz escalation, geographic fidelity is not cosmetic — it is functional.

### 2D Leaflet vs. Three.js 3D globe

| Criterion | Leaflet 2D | Three.js 3D globe |
|---|---|---|
| Hormuz Strait visibility | Excellent — zoom to strait at correct scale | Poor — strait is 33nm; globe needs major zoom, loses context |
| Professional / military look | ✅ CAOC / GCCS-J / JOC use 2D flat maps | ❌ Generic sci-fi sphere aesthetic |
| Geographic accuracy | Full real-world coordinates | Accurate but scale distortion at high zoom |
| Existing dependency | Already loaded in index.html | Already loaded, but overkill for this use case |
| Implementation complexity | Low — `L.map()` + `L.marker()` + tile layer | High — orbital mechanics, shaders, Earth rotation |
| Hormuz zoom transition | `map.flyToBounds()` — smooth and realistic | `camera.lookAt()` with animation — works but feels sci-fi |

**Recommendation: Leaflet 2D with CartoDB DarkMatter basemap.**

The reference `orbital-theater.html` Three.js globe was a generic planetary viewer. For this simulation the Hormuz theater is a 2D geographic rectangle (~1,500km × 1,200km). A professional military analyst would use a 2D flat map.

### Recommended Phase 3c implementation (already planned)

**Basemap:** `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png` — dark tactical aesthetic, free, no API key, HTTPS.

**Initial view:** `map.fitBounds([[10, 38], [32, 67]])` — covers Persian Gulf + Red Sea + Oman Sea. (Now stored as `THEATER_BOUNDS` export.)

**Hormuz close-up:** `map.flyToBounds([[24.5, 54.0], [28.5, 59.5]], { duration: 1.5 })` — smooth animated zoom to the Strait. (Now stored as `HORMUZ_ZOOM_BOUNDS` export.)

**Theater assets ready:** `THEATER_ASSETS` added to `hub-controller.js` — 16 real-coordinate assets:
- 2 CSG positions (Gulf of Oman / Arabian Sea)
- 3 US/Coalition air bases (Al Udeid, Al Dhafra, Diego Garcia)
- 5 Iranian / Houthi threat nodes (Bandar Abbas, Fordow, Natanz, Hodeidah, Sana'a)
- 2 chokepoints (Hormuz Strait 26.6°N 56.4°E, Bab el-Mandeb 12.6°N 43.4°E)
- 4 UAV nodes (matching `drone-swarm.js` positions)

**Module ownership:** `orbital.js` owns the Leaflet instance. `map.remove()` called in cleanup. Map is stored in module closure (`let _map = null`), not in state.

**What Phase 3c requires:**
1. Replace `sensor-map` SVG HTML in `orbital.js` with a `<div id="theater-map" style="height:420px">` container
2. `initMap(container, state)` — creates `L.map`, adds DarkMatter tiles, adds markers from `THEATER_ASSETS`
3. Marker click dispatches `updateDrillDownState("orbital", { selectedNodeId: asset.id })`
4. `update()` patches marker styling (highlight active threats based on `state.system.actors`) without recreating the map
5. Cleanup: `_map.remove(); _map = null`

**This is NOT a small fix** — do it as Phase 3c as planned.

---

## Phase 3 Completed — 2026-05-01

### 3a — Causal Propagation Engine (`hub-controller.js`)

18-node Bayesian DAG with calibrated CPTs (sigmoid activation). Full Monte Carlo inference:

**State additions:**
```js
causalBeliefs: {}         // { [nodeId]: 0–1 posterior } after propagation
causalInterventions: {}   // { [nodeId]: 0–1 } do-calculus clamps
```

**New exports:**
```js
CAUSAL_NODE_ORDER         // topological sort of 18 inference nodes (frozen array)
updateCausalBeliefs(state, extraInterventions?)  // run 1000-trial propagation, store beliefs + log
setCausalIntervention(state, nodeId, value|null) // clamp node (do-calculus) or release, re-propagate
clearCausalInterventions(state)                  // clear all clamps, re-propagate
computeSensitivity(state, targetId, iters=120)   // ΔP(target | HI vs LO) for each upstream node
```

**Inference architecture:**
- 9 root nodes: sampled from Gaussian noise around current state priors
- 9 derived nodes: `P(n) = sigmoid(intercept + Σ w_i * parent_i)` using calibrated CPTs
- Topological sort resolves two visualization cycles (alliance↔diplo, threat↔esc-rate) by removing `diplo→alliance` from inference and treating `eco` as a root node
- CPT intercepts calibrated algebraically so posteriors match observed state at default parameter values
- 1000 forward samples ≈ 18,000 sigmoid ops — synchronous, no Web Worker needed (~5ms)

**`src/app.js`:** `loadState()` now merges `causalBeliefs` and `causalInterventions` from localStorage.

### 3b — Monte Carlo Workbench (`war-room.js`, `monte-carlo` panel)

4th tab added to war-room segmented control.

**Panel features:**
- **Run Simulation** button → dispatches `updateCausalBeliefs`, stores 1000-trial posteriors
- **Node belief table** — 18 nodes with probability % + color-coded progress bar (red >65%, amber >40%, blue otherwise) + per-node CLAMP HI / CLAMP LO / FREE buttons
- **Sensitivity analysis** — ΔP(THREAT | HI vs LO) for top 8 upstream nodes; directional bars (red = raises threat, blue = lowers)
- **Clamped nodes** shown with `CLAMPED` chip and cyan border; `FREE` button releases the intervention
- **Clear All** button dispatches `clearCausalInterventions`

**Causal graph belief overlay** (causal panel, Phase 3 upgrade):
- When `state.causalBeliefs` is populated, each node gains a partial arc (cyan, proportional to P%) and a `P%` label above the node
- Canvas-safe: same `_causal` guard; `drawCausalGraphWithBeliefs` wrapper avoids parameter leakage

**New imports:** `updateCausalBeliefs`, `setCausalIntervention`, `clearCausalInterventions`, `computeSensitivity`, `CAUSAL_NODE_ORDER`

### 3c — Leaflet Theater Map (`orbital.js`, overview panel)

**Implementation:**
- CartoDB DarkMatter basemap (`dark_all` tiles, `subdomains: abcd`)
- Initial view: `map.fitBounds(THEATER_BOUNDS)` — full theater [[10,38],[32,67]] on mount
- 16 real-coordinate markers from `THEATER_ASSETS` — CSGs, air bases, threat nodes, chokepoints, UAVs
- Marker icons: 28px circular `L.divIcon` with Material Symbol + asset-type color (naval=#0EA5E9, base=#38BDF8, threat=#ff4d4d, chokepoint=#ffba20, uav=#a78bfa)
- Threat hostility-aware colors: Iran assets shift red when `actors.iran > 0.72`; Houthi assets when `actors.houthis > 0.60`
- Shipping lane polylines (dashed, rgba(14,165,233,0.18)) — Hormuz transit, Red Sea, Gulf-to-Indian-Ocean
- Hormuz strait rectangle highlight (HORMUZ_ZOOM_BOUNDS, amber, fillOpacity 0.05)
- Marker tooltip on hover (styled `.theater-tooltip` class — dark background, monospace, tactical)
- Marker click dispatches `updateDrillDownState("orbital", { selectedNodeId: asset.id })`
- Selected asset card below map: label, lat/lng, type chip, color matches asset type

**Zoom controls:**
- `Full Theater` → `map.flyToBounds(THEATER_BOUNDS, { duration: 1.2 })`
- `Hormuz Strait` → `map.flyToBounds(HORMUZ_ZOOM_BOUNDS, { duration: 1.2 })`
- `Red Sea / Bab-el-Mandeb` → `map.flyToBounds([[10,38],[18,47]], { duration: 1.2 })`

**Canvas-safe pattern:**
- Module-scope `_map`, `_markers`, `_dispatch` vars (null when overview not active)
- `update()` on overview panel: if `_map` alive → `patchMap()` + patch `#theater-selected-info` only, no innerHTML
- Cleanup fn calls `_map.remove(); _map = null; _markers = {}`
- Non-overview panels destroy map and replace with innerHTML

**CSS:** tactical Leaflet overrides injected via `<style>` in `panelOverview()` HTML — dark zoom controls, `.theater-tooltip` styles. Scoped to the container; no global style pollution.

---

---

## Phase 3 QA — 2026-05-01

**Test suite:** 15 / 15 pass (`node --test tests/hub-controller.test.mjs`)

### Bugs Found and Fixed

**Bug 1 (Critical) — `propagateCausalBeliefs`: clamped nodes showed 0% belief**

- **Root cause:** The `continue` statement inside the intervention branch skipped `sums[id] += s[id]`, leaving `sums` at 0 for all clamped nodes. On averaging, their posterior belief was always 0 regardless of clamp value.
- **Effect:** Clicking CLAMP HI (0.9) on a node showed 0% in the belief bar and 0% arc on the causal graph. The downstream propagation still used the clamped value (because `s[id]` was set correctly before `continue`), so downstream beliefs were correct — only the display of the clamped node itself was wrong.
- **Fix:** Replaced `continue` with an `if/else` block so `sums[id] += s[id]` runs for every node, including clamped ones.
- **Verified:** `propagateCausalBeliefs(state, { naval: 0.9 }, 500).naval === 0.9000` ✓

**Bug 2 (Minor) — Dead code in `orbital.js` `update()`**

- `if (_map) { _map.remove(); _map = null; }` inside the "map not yet created" branch was unreachable (the outer `if (_map)` had already confirmed `_map` is falsy).
- **Fix:** Removed the dead conditional.

**Bug 3 (Cosmetic) — Stale causal panel description**

- `panelCausal()` still said "Phase 3 adds probability propagation" — incorrect since Phase 3 is complete.
- **Fix:** Updated to "Run the Monte Carlo simulation to overlay posterior probabilities as arc indicators."

### QA Checklist Results

| Check | Result | Notes |
|---|---|---|
| Monte Carlo "Run Simulation" works repeatedly | ✅ Pass | 1000 forward samples synchronous; ~5ms; no blocking |
| CLAMP HI/LO changes clamped node belief correctly | ✅ Pass (after fix) | naval=0.9 clamp → naval belief = 90.00% |
| Downstream nodes respond to clamp (HI raises threat) | ✅ Pass | naval HI → threat 73.5% vs naval LO → threat 20.9% |
| FREE button releases clamp, beliefs revert | ✅ Pass | `clearCausalInterventions` removes all keys |
| Sensitivity analysis shows correct signs and ordering | ✅ Pass | naval (+30.0%), hormuz (+26.6%), esc-rate (+22.1%) as top drivers |
| Sensitivity updates after each intervention dispatch | ✅ Pass | Recomputed on every `panelMonteCarlo` render (~1.5ms) |
| Causal graph arc overlay appears when beliefs populated | ✅ Pass | Arc proportional to P%, P% label above each node |
| Causal graph survives tab switch and back | ✅ Pass | `_causal = null` on leave; `initCausal` + `drawCausalGraphWithBeliefs` on return |
| Leaflet map loads on orbital overview panel | ✅ Pass | CartoDB DarkMatter, `fitBounds(THEATER_BOUNDS)` |
| Markers update from actor hostility state | ✅ Pass | `patchMap(state)` called in `update()` when `_map` alive; `setIcon` updates each marker |
| Full Theater zoom works | ✅ Pass | `flyToBounds(THEATER_BOUNDS, {duration:1.2})` |
| Hormuz Strait zoom works | ✅ Pass | `flyToBounds(HORMUZ_ZOOM_BOUNDS, {duration:1.2})` |
| Red Sea zoom works | ✅ Pass | `flyToBounds([[10,38],[18,47]], {duration:1.2})` |
| Switching panels destroys map, switching back recreates it | ✅ Pass | `_map.remove()` in non-overview branch; `initMap()` on return |
| Navigating away from orbital cleans up map | ✅ Pass | Router calls cleanup fn → `_map.remove(); _map = null` |
| localStorage refresh does not break Phase 3 state | ✅ Pass | `loadState()` merges `causalBeliefs` and `causalInterventions`; old saves fall back to `{}` |

---

## Phase 4 Completed — 2026-05-01

### 4a — Three.js Solar System Orrery (`planets.js`)

Live `WebGLRenderer` solar system orrery replacing the Phase 1 placeholder container.

**Rendering:**
- `OrthographicCamera` top-down view; orbit radii log-scaled (`ORBIT_R`) for compact visibility
- 1200-point star field at z=-1 (`PointsMaterial`, `sizeAttenuation:false` — pixel-constant dot size)
- Sun mesh (0.09 radius) + transparent glow sphere (0.13, opacity 0.18)
- Per planet: `LineLoop` orbit ring (rgba 0x1a2535, 70% opacity) + `SphereGeometry` mesh with real-world approximate colors
- Saturn: `LineLoop` ring attached as child mesh (moves with planet)
- Campaign week seeds starting angle; continuous animation at `TIME_SCALE = 8` sim-days/real-second
- `_simDay` accumulates dt × 8 per frame; `_weekBase` syncs to `state.system.week` on mount/update

**Canvas-safe lifecycle:**
- `_renderer`, `_animId`, `_planetMeshes` stored module-scope
- `destroyOrrery()`: `cancelAnimationFrame` + `_renderer.dispose()` + null all refs
- `mount()`: `destroyOrrery()` → innerHTML → `initOrrery()`; returns `destroyOrrery` as cleanup
- `update()`: if `_renderer` alive → patch `.planets-week` + `#planets-phase-tbody` text nodes only; else full re-render + initOrrery

**DOM patching:**
- `.planets-week` class on week chips — patched by `querySelectorAll`, no innerHTML
- `#planets-phase-tbody` — only the orbital phase table body is replaced (static fact sheet table untouched)

---

### 4b — Drone Swarm Agent-Based Model (`drone-swarm.js`)

Canvas 2D boid simulation replacing the SVG sensor map placeholder.

**ABM steering model (per frame, per agent):**
1. **Waypoint attraction** — if `dist(agent, waypoint) > ORBIT_RADIUS`: `fx += (dxW/distW) * WAYPOINT_SPEED`
2. **Orbit** — when close to waypoint: `orbitAngle += 0.012`; apply tangential velocity
3. **Separation** — push away from neighbors within `SEPARATION_RADIUS=38`; `SEPARATION_WEIGHT=1.4`
4. **Cohesion** — pull toward swarm centroid; strength = `cohesion/100 * COHESION_PULL`
5. **Velocity integration** — `vx = vx*0.88 + fx*0.12`; speed clamped to `MAX_SPEED=1.6`

**Geographic coordinate system:**
- `GEO = { latMin:24.0, latMax:28.2, lngMin:54.8, lngMax:59.5 }` — Persian Gulf theater
- UAV waypoints initialized from real lat/lng via `geoToCanvas(lat, lng, W, H)`

**Rendering:**
- Dark background + tactical grid (rgba 56,189,248 at 6% opacity)
- Cohesion web: lines between agents < 120px apart; opacity = `(1-d/120)*(cohesion/100)*0.25`
- Waypoint rings (dashed, via `setLineDash`)
- Agent: triangle rotated to travel direction; selection glow via `shadowBlur=12`
- Geographic labels: HORMUZ STRAIT, BANDAR ABBAS at correct canvas positions
- HUD text: cohesion % at bottom-left

**Canvas-safe lifecycle:**
- `_canvas`, `_ctx`, `_animId`, `_agents`, `_swState`, `_dispatch` module-scope
- `destroySwarm()`: `cancelAnimationFrame` + null all refs
- `mount()`: `destroySwarm()` → innerHTML → `initSwarmCanvas()`; returns cleanup
- `update()`: if `_canvas` alive → `_swState = state` + `patchSwarmInfo()`; else full re-render + initSwarmCanvas
- `patchSwarmInfo()`: targeted patches to `#swarm-cohesion-bar`, `#swarm-cohesion-label`, `#swarm-selected-card`, node list selection state — no canvas touch

---

### 4c — GPS Denial Canvas (`electronic-warfare.js`, `gps-denial` panel)

Canvas 2D radial gradient denial zone map replacing the "Phase 6 placeholder" container.

**Denial zone model:**
- Zone radius = `(node.power/100) * GPS_BASE_RADIUS * (spectrumIntegrity/100)`
- Higher `spectrumIntegrity` = wider US jamming coverage (more effective electronic dominance)
- JAM/SPOOF nodes: red radial gradients (`rgba(255,60,60)` core to transparent)
- MONITOR/RELAY nodes: amber radial gradients (`rgba(251,191,36)` core to transparent)
- Node positions mapped to canvas pixels via `GPS_GEO` bounds (matching drone-swarm coordinate system)

**Rendering per frame (static — no animation loop):**
- Dark tactical background + 40px grid
- STRAIT OF HORMUZ label at geographic center
- Radial gradient fill + outer ring stroke per node
- Crosshairs (±9px) + node ID label + mode/power readout
- Legend (jam/spoof vs monitor/relay) at bottom-left
- Spectrum integrity HUD (`SPECTRUM N%`) at bottom-right, color-coded by threshold

**Canvas-safe lifecycle:**
- `_gpsCanvas` module-scope ref (no rAF — static canvas redrawn on state change)
- `destroyGPSCanvas()`: `_gpsCanvas = null`
- `mount()`: `destroyGPSCanvas()` → innerHTML → `initGPSCanvas()` (if panel=gps-denial); returns cleanup
- `update()`: if `gps-denial` panel and `_gpsCanvas` alive → `drawGPSZones(canvas, state)` only (redraw in-place, no innerHTML); otherwise full re-render + reinit

---

### Simulation Modeling Notes

**Approximations vs. reference site:**
- Three.js orrery uses `MeshBasicMaterial` (no lighting) — visually distinct from reference Three.js globe but appropriate for top-down orthographic solar system view
- Boid steering uses simplified 2D force model (no Z-axis, no terrain avoidance, no inter-agent communication) — adequate for swarm cohesion visualization
- GPS denial zones are circular (radial gradient) rather than terrain-masked or frequency-propagated — accurate enough for strategic-level jamming visualization
- EW node geographic positions (lat/lng) are approximate Gulf theater placements, not operationally specific

**What was preserved from reference:**
- Keplerian orbital period ratios (all 8 planets, NASA fact sheet periods) — animation timing is astronomically accurate relative to each other
- Boid separation/cohesion/alignment architecture from reference `drone-swarm.html`
- GPS denial zone radius formula: power × spectrum integrity — matches reference `ew-sandbox.html` signal propagation model

---

## ISR Refactor — 2026-05-01

### Context
Phase 4 `planets.js` was assessed as operationally irrelevant — a generic solar-system orrery with no connection to the Iran/Hormuz simulation. The module was refactored into a Space/ISR Intelligence Layer per operational requirements. Three.js was removed entirely; Canvas 2D provides the same lifecycle architecture with better suitability for a 2D theater coverage map.

### `planets.js` — Space / ISR Intelligence Layer

**What changed:** Complete module rewrite. 400-line solar-system visualization replaced with 480-line ISR coverage system.

**ISR model:**
- 5 platforms: KH-13 IMINT, SIGINT-1, SAR-1 GEOINT, RQ-4 HALE, P-8A ELINT
- Ground track model: each satellite has a theater entry/exit lat-lng. Phase = `(phaseOffset + simMin / orbitPeriodMin) % 1`. Phase 0–0.45 = overhead pass; 0.45–1.0 = off-canvas.
- Aircraft (RQ-4, P-8A) use racetrack: `t = phase < 0.5 ? phase*2 : (1-phase)*2` — always overhead
- Footprint: `ctx.ellipse` scaled by `footprintDeg * latPxPerDeg` / `lngPxPerDeg` — correct aspect ratio
- Animation: `ISR_TIME_SCALE = 20` sim-min/real-sec; `_simMin` seeded from `state.system.week * 7 * 24 * 60`
- A2/AD zone: `ctx.createRadialGradient` centered on Bandar Abbas; radius = `30 + max(0, (iran-0.4)/0.6) * 110`

**4 operational panels:**
1. `coverage` — live canvas (only panel with canvas; lifecycle-safe)
2. `timeline` — next pass computed from current orbit phase; shows T+Hh Mm or OVERHEAD or PERSISTENT
3. `collection` — per-type quality bars; degradation derived from spectrumIntegrity + threat + threatLimit
4. `gaps` — KEY_LOCS coverage analysis; HIGH RISK flag for uncovered threat/chokepoint locations

### `drone-swarm.js` — Threat-Aware Improvements

**What changed:** Targeted additions; canvas lifecycle unchanged.

**Threat-responsive dynamics:**
- `effectiveMaxSpeed` and `effectiveSepWeight` scale with `max(0, threat-50)` — higher threat produces faster, more dispersed agents, visually communicating tactical urgency
- EW UAV orbit rate doubles when degraded (`ewDegraded = si < 52 || threat > 68`) — erratic motion signals loss of formation control

**Operational output:**
- Per-agent status labels on canvas: ISR UAV shows collection quality; EW UAV shows "EW DEGRADED" when applicable
- Selected agent card shows per-type intel: ISR collection quality, STRIKE readiness, EW jamming status with reason, RELAY link quality
- `#swarm-intel-feed` card shows a 2×2 summary (ISR/EW/Strike/Relay) always visible below the canvas; patched by `patchSwarmInfo` without innerHTML
- EW degraded warning in intel feed with actionable suggestion: "apply signal-sweep protocol to restore spectrum"

---

## ISR Refactor QA — 2026-05-01

**Test suite:** 15 / 15 pass (`node --test tests/hub-controller.test.mjs`)

### Bugs Found and Fixed

**Bug 1 (Critical) — ISR canvas blank on first module load**

- **Root cause:** `hub-controller.defaultDrillDown()` initializes all module drillDown panels as `panel: "overview"`. `planets.js mount()` guarded `initISRCanvas` on `drill.panel === "coverage"`, so on first load `drill.panel === "overview"` → coverage panel HTML rendered (via fallthrough) but `initISRCanvas` never called → blank canvas with no animation.
- **Fix:** Added `activePanel(state)` helper that normalizes `"overview"` (and any unrecognized value) to `"coverage"`:
  ```js
  function activePanel(state) {
    const p = state.drillDown?.["planets"]?.panel ?? "coverage";
    return ["timeline", "collection", "gaps"].includes(p) ? p : "coverage";
  }
  ```
  Updated all three locations (`mount()`, `update()` fast-path guard, `update()` fallthrough) to use `activePanel(state) === "coverage"` instead of `drill.panel === "coverage"`. Also updated `html()` to use `panel = activePanel(state)` for tab active state and panel content selection.
- **Verified:** Canvas initializes on cold load; `activePanel()` grep confirms guards at lines 625, 633, 734, 752, 816 of `planets.js`.

**Bug 2 (Cosmetic) — Large footprint labels rendered off-canvas**

- **Root cause:** SIGINT-1 footprint = 4.2°. At canvas 340px / 9° span: `ry ≈ 159px`. Label placed at `c.y - max(159,10) - 5` could be negative (off-canvas top); DEGRADED label at `c.y + 159 + 10` could exceed canvas height.
- **Fix:** Clamped both label positions within canvas bounds:
  ```js
  const labelY = Math.max(12, c.y - Math.min(ry, c.y - 12) - 5);
  ctx.fillText(asset.shortLabel, c.x, labelY);
  const degradedY = Math.min(H - 5, c.y + Math.min(ry, H - c.y - 5) + 10);
  ctx.fillText("DEGRADED", c.x, degradedY);
  ```

**Bug 3 (Minor) — Dead code in `planets.js` `update()` fast-path**

- `const assetCards = container.querySelectorAll(...)` assigned but never used in the fast-path branch.
- **Fix:** Removed the unused variable.

### QA Checklist Results

| Check | Result | Notes |
|---|---|---|
| ISR canvas renders on first module load | ✅ Pass (after Bug 1 fix) | `activePanel()` normalizes "overview" → "coverage" |
| Canvas renders correctly after repeated enter/leave | ✅ Pass | `destroyISRCanvas()` + reinit on each `mount()`; no stale refs |
| rAF loop does not leak across module switches | ✅ Pass | `cancelAnimationFrame(_animId)` in cleanup; `_isrCanvas = null` |
| SIGINT-1 degrades visually when `spectrumIntegrity < 55` | ✅ Pass | Dashed footprint + "DEGRADED" label; collection panel shows degraded status |
| RQ-4 rerouted when `threat > 72` | ✅ Pass | Labeled DEGRADED; collection quality drops; gaps panel flags ISR gap |
| P-8A rerouted when `threat > 78` | ✅ Pass | Same degradation chain as RQ-4 |
| Timeline panel updates from live state | ✅ Pass | Pass timing computed from `_simMin` which seeds from `week`; re-rendered on update |
| Collection panel updates from live state | ✅ Pass | Quality bars derived from SI + threat + threatLimit; re-rendered on update |
| Gaps panel updates from live state | ✅ Pass | Coverage analysis recomputed each render; HIGH RISK flag when threat/chokepoint uncovered |
| A2/AD radius changes when `actors.iran` hostility changes | ✅ Pass | Zone radius = `30 + max(0,(iran-0.4)/0.6)*110`; visible expansion at hostility > 0.65 |
| Drone swarm behavior changes with threat | ✅ Pass | `effectiveMaxSpeed` + `effectiveSepWeight` scale above threat=50 |
| Drone swarm behavior changes with `spectrumIntegrity` | ✅ Pass | EW UAV enters erratic orbit when SI < 52 |
| Swarm intel feed updates without breaking canvas lifecycle | ✅ Pass | `patchSwarmInfo()` patches `#swarm-intel-feed` without innerHTML; canvas untouched |
| localStorage refresh does not break ISR/drone state | ✅ Pass | `planets.js` uses no persistent state beyond `drillDown.panel`; drone uses `swarmCohesion`/`threat` from merged system state |
| `node --check` on `planets.js` | ✅ Pass | No syntax errors |
| `node --check` on `drone-swarm.js` | ✅ Pass | No syntax errors |

---

## Visual Foundation — Phase A — 2026-05-01

### Context
The current app was built as a generic shell inspired by the Stitch exports rather than transplanting the actual Stitch slide layouts. Phase A establishes the visual infrastructure so that Phase B module transplants can use the correct design language.

### What changed

**`index.html`:**
- Added `<link rel="preconnect">` tags for Google Fonts
- Added `<link rel="stylesheet">` tags directly in HTML for: Inter (400/500/600), JetBrains Mono (400/500), Space Grotesk (700), Instrument Serif — ensuring fonts load before first render rather than relying solely on CSS @import
- Added Material Symbols Outlined icon font as `<link>` (was previously only via CSS @import in global-ui.css)
- Removed `<div class="command-background">` — the pulsing blue grid/radial glow overlay
- Removed `<div class="scanline">` — the sweeping blue scan line animation
- Removed "Tactical Operations Command" page title; replaced with "AETHER COMMAND | Intelligence Hub"

**`src/app.js` — topbar:**
- Removed TOP SECRET badge (was `color: #ff7a8a; display: flex; gap: 6px`)
- Changed brand font from JetBrains Mono to Inter, `font-weight: 900`, `letter-spacing: -0.03em` — matches Stitch `font-black tracking-tighter` pattern
- Brand text size from 17px → 20px
- Removed `wifi` / `schedule` / `lock` icons; replaced with `notifications` / `settings_input_component` / `terminal` (Stitch Slide 37/38/40 icon set)
- Added `shell-live-indicator` (animated blue dot + "LIVE" label) replacing the generic status text
- Added `shell-avatar` (30px circle, dark bg, white border) at far right

**`src/app.js` — rail:**
- Width: 72px → 80px (w-20), matching Stitch consistent sidebar width
- Removed `rail-logo` block (satellite icon + STRATCOM label + sector sub-label) — non-standard decoration
- Button label font-size: 7px → 9px (more legible, closer to Stitch `font-mono text-[10px]`)
- Button padding: 10px → 12px vertical (breathing room)
- Icon size: 20px → 22px
- Hover state: was cyan glow, now `rgba(255,255,255,0.04)` with `color: #bec7d4` — matches Stitch inactive hover
- `#module-mount` left offset updated 72px → 80px to match

**`src/app.js` — `injectShellStyles()`:**
- `#module-mount` background: solid `#0d131f` → `#06090E` with 40px tactical grid (`rgba(255,255,255,0.025)`) — matches Stitch `.tactical-grid` / `.bg-grid-pattern`
- Added `.mount-edge-fade` div injected at boot: fixed overlay with four gradient fade-ins from edges, gives the Stitch "geography bleeds from darkness" treatment without requiring an external image
- Scrollbar: slim to 4px, track transparent, thumb uses neutral `#3f4852` — matches Stitch custom scrollbar
- Added utility classes used by module transplants (Phase B): `.glass-panel`, `.hud-glass`, `.font-label-caps`, `.font-data-sm`, `.font-data-lg`, `.font-headline-md`, `.font-headline-lg`
- Added color token shortcuts: `.text-primary`, `.text-secondary`, `.text-tertiary`, `.text-error`, `.text-outline`, `.text-on-surface`, `.text-on-surface-variant`, `.bg-surface-container*`, `.border-outline-variant`
- Added glow utilities: `.glow-primary`, `.glow-error`, `.glow-tertiary`
- Removed all `text-red` / `text-cyan` hardcoded color overrides from topbar HTML; now uses `.text-red` / `.text-cyan` classes already defined in global-ui.css

### What was NOT changed
- All simulation logic (state machine, canvas lifecycle, Leaflet, Chart.js, boid ABM)
- All module HTML (`html()` functions in each module) — Phase B will transplant those
- All dispatch paths, event handlers, router behavior
- `hub-controller.js` — unchanged
- `global-ui.css` — not edited (built output); `.command-background` and `.scanline` CSS definitions remain in the file but are inert since their divs are removed from `index.html`

### Next step
Phase B — module-by-module layout transplants using the mapped Stitch slides as concrete templates. Sequence: Overview → War Room → Orbital/ISR → Electronic Warfare → Hormuz Escalation → Executive Briefing → Drone Swarm.

---

## Phase B1 — Overview Transplant — 2026-05-01

### Source slide
**Slide 48** — bento-style theater synthesis board: metric hero cards (left column), central hierarchy + screen scaffold (center column), incident log + entity card (right column).

### What changed

**`src/modules/overview.js`** — complete rewrite:

**Layout:**
- Full-viewport escape: `margin: -20px -24px -40px; height: calc(100vh - 56px); overflow: hidden` — escapes `#module-mount` padding to fill the viewport
- 3-column bento grid: `grid-template-columns: 240px 1fr 240px`, matching Slide 48 proportions
- Scoped `<style>` block inside `html()` — no global CSS pollution

**Left column — metric hero cards:**
- 5 cards: READINESS, THREAT, SPECTRUM, COHESION, HORMUZ
- Each card: large `font-data-lg` (JetBrains Mono 20px) value, `font-label-caps` (Space Grotesk 11px/700) label, deterministic 8-bar sparkline
- Sparkline formula: `((value * 3 + week * 7 + i * 23 + i² * 2) % 55) + 22` — seeded by value+week so bars are stable across re-renders but differ per metric/week
- THREAT card variant: uses 5-segment escalation rung strip (`filled = Math.round(threat / 20)`) in place of sparkline; color shifts red (>72) / amber (>45) / cyan (≤45) with text label CRITICAL / ELEVATED / NOMINAL

**Center column:**
- Sticky `TERMINAL STACK` subheader with active module count badge
- 8 module hierarchy cards: icon + label + screen count + critical count badge; active module highlighted with `background: rgba(152,203,255,0.08); border-color: #98cbff`
- Scrollable 55-screen scaffold below: screens listed per module in a compact list, each with status dot and navigable via `data-ov-screen`
- Decorative reticle (crosshair + circle) as CSS `::before/::after` on `.ov-reticle`, `pointer-events: none`, `z-index: 0`

**Right column:**
- INCIDENT LOG: last 8 session log entries, newest-first; each entry classified by regex and gets `border-left: 2px solid {color}` treatment:
  - strike/kinetic → `#ffb4ab` (error/red), cat: STRIKE
  - threat/escalat/hostile/iran → `#ffba20` (tertiary/amber), cat: ALERT
  - spectrum/ew/jamm → `#67d4f9` (secondary/cyan), cat: EW
  - week/advance/resolv → `#98cbff` (primary/blue), cat: SYS
  - default → `#3f4852`, cat: LOG
- SELECTED ENTITY card: shows active module icon (Material Symbol), id, class label ("THEATER COMMAND"), and 4-metric grid (THREAT / READINESS / SCREENS / CRITICAL) pulled from live state

**Dispatch / event handling — unchanged:**
- `data-ov-screen` → `dispatch(selectScreen, screenId)`
- `data-ov-module` → `dispatch(transitionTerminal, moduleId, "overview")`
- Listener attached to container in `mount()`, removed in returned cleanup function
- `update()` calls `container.innerHTML = html(state)` — full re-render on state change

### What was NOT changed
- All dispatch action functions (`selectScreen`, `transitionTerminal`)
- All event delegation attribute names (`data-ov-screen`, `data-ov-module`)
- Module contract (mount/update/cleanup signatures)
- State machine, hub-controller.js, router.js, app.js

### Next step
Phase B2: War Room → Slide 13 + 15 (probability overlay, branch analysis format, bottom scrubber).

---

## How to Resume Development

1. Run a local server from the repo root (e.g., `npx serve .` or `python3 -m http.server 8080`)
2. Open `http://localhost:8080` — shell + all 8 modules load immediately
3. Use browser devtools console to verify: no 404s, no uncaught errors
4. To add a new simulation engine to an existing module:
   - Find the module file in `src/modules/`
   - Initialize the engine in `mount()`, store instance in closure scope
   - Update data bindings in `update()` without destroying the instance
   - Return a cleanup function that calls `instance.destroy()` / `instance.remove()`
5. To add a new module:
   - Create `src/modules/<id>.js` with `mount` + `update` exports
   - `registerModule("<id>", { mount, update })` in `src/app.js`
   - Add the module to `NAV_MODULES` in `hub-controller.js` if it needs a rail button
6. To extend the state machine:
   - Add new pure functions to `hub-controller.js` following the pattern:
     `export function newAction(state, ...args) { return { ...state, ... }; }`
   - Export new constants as needed
   - Import and use in modules via `dispatch(newAction, args)`
