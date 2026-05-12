# Operational Realism Refactor — Phase 1

Branch: `v2-optimization`  
Commit: `0b92dc5`

---

## Terminology Changes

| Before | After | Location |
|---|---|---|
| AETHER COMMAND | INTEL OPS | Shell topbar brand |
| Aether Command \| Intelligence Hub | Theater Operations Command \| Intel Hub | Page title |
| War Room | Ops Cell | NAV_MODULES, war-room.js headers |
| Planets | Space ISR | NAV_MODULES nav label |
| Drone Swarm | UAV Ops | NAV_MODULES nav label |
| Executive Briefing | Briefings | NAV_MODULES nav label |
| Threat & Strike Control | Theater Operations | war-room.js h2 |
| War Room Terminal | Operations Terminal | war-room.js panel kicker |
| Strike Planner | Mission Planning | war-room.js panel head |
| Monte Carlo Workbench | Probabilistic Assessment | war-room.js panel head, tab, button |
| Run Simulation | Run Assessment | war-room.js button label |
| 18-Node Bayesian Causal Cascade | Causal Cascade Analysis — 18 Nodes | war-room.js panel kicker |
| 10-Week Campaign Timeline | Campaign Timeline | war-room.js kicker |
| Theater Actors | Actor Posture Board | war-room.js kicker |
| Issue Directives | Directive Selection | war-room.js kicker |
| Command Log | Event Log | war-room.js panel head |
| Solution Control | Solution Board | war-room.js panel head |
| Spectrum Dominance | Spectrum Operations | electronic-warfare.js panel h3 |
| Flagship Chain | Causal Chain Status | electronic-warfare.js panel kicker |
| War Room (in EW copy) | Ops Cell | electronic-warfare.js paragraph text |
| COMMAND THEATER | Theater Status | overview.js header h1 |
| LIVE SAT-LINK | DATA LINK ACTIVE | overview.js header indicator |
| TERMINAL STACK | MODULE INDEX | overview.js center-col sticky HUD |
| CONCEPT STATE SCAFFOLD | STATE REGISTRY | overview.js scaffold header |
| INCIDENT LOG | EVENT LOG | overview.js log panel header |
| COHESION | UAV COHESION | overview.js metric card label |
| SELECTED ENTITY | ACTIVE MODULE | overview.js entity card header |
| Motion States (briefing panel) | Report Suite | executive-briefing.js panel h3 |
| Stitch motion names (displayed) | hidden / "briefing" chip | executive-briefing.js |
| Principals Chamber deliberation | removed | executive-briefing.js |

---

## Realism Improvements

### Shell Topbar
- **Operator status strip** added left of center: compact COMMS / SPECTRUM / ISR health dots with color-coded degraded-state indicators (green nominal, amber watch, red degraded)
- **SPECTRUM %** added to topbar metrics row alongside THREAT / READY / W
- Spectrum and ISR dots update reactively when `updateShellMetrics()` fires (tied to dispatch)
- Live indicator dot color changed to green (operational health signal), glow removed

### Overview Module
- Hero metric cards: font size reduced 42px → 28px (less cinematic, more dense)
- Entity card expanded with 6-metric grid (was 4): added SPECTRUM and READINESS
- Entity card now includes **SYSTEM HEALTH** strip: COMMS / ISR / UAV SWRM with live pass/degraded labeling drawn from actual state values
- Log header shows W{n} and entry count instead of "AUTO-SCROLL ON"

### War Room Module
- "Status" tab replaces "Overview" tab (clearer panel intent)
- "Prob. Assessment" tab replaces "Monte Carlo" tab

### EW Module
- Panel tabs now have human labels: Status / Spectrum / EW Nodes / GPS Denial (was: overview / spectrum / nodes / gps-denial)

---

## Removed Fictional / Theatrical Elements

- "AETHER COMMAND" brand name eliminated from shell and page title
- Cinematic `box-shadow` glow on topbar (`0 4px 20px rgba(0,163,255,0.08)`) removed
- Live-dot glow (`0 0 6px rgba(56,189,248,0.7)`) removed
- Stitch animation transition names (`briefing-slide-in`, `terminal-crossfade`, `glass-lift`, `scan-reveal`) no longer displayed in any UI element
- "Principals Chamber" reference removed from executive briefing UI
- "Motion States" panel label replaced with "Report Suite"
- System boot log entries no longer reference "Final Stitch canvas synced" or "Command Center hierarchy initialized" — replaced with neutral SYS: entries
- Overview header no longer displays `STITCH_PROJECT.source` (removed from header rewrite)
- "Planets" nav label replaced with "Space ISR" (aligns with the already-refactored ISR coverage content inside the module)

---

## Remaining Realism Weaknesses (Phase 2 candidates)

- `viewport-head h2` in war-room and EW modules still uses `Instrument Serif` display font at 3rem–3.75rem — high contrast with compact operational aesthetic
- `threat-score` class uses 6rem Instrument Serif — visually large / presentation-like
- Module screen rail shows Stitch screen names (e.g. "Mars Layer", "Deep Space") which are vestigial from the original screen schema in `hub-controller.js` — renaming them would require updating `SCREEN_ROWS` in hub-controller
- `planet-table` / `planet-row` CSS class names remain (functional, not user-visible)
- Decorative reticle (crosshair overlay) in overview center column remains — low priority
- EW "Signal Sweep" panel title inside the sensor lattice view
- Log entries do not yet include real UTC timestamps (use campaign week markers only)
- No alert queue or operator queue panel yet — candidate for Phase 2 density additions
