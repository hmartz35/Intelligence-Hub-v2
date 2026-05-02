# Phase 1 Fix Plan

Derived from the 32-item audit of the Phase 1 implementation.

**Status: All 6 must-fix items COMPLETE as of 2026-05-01.**

Implementation notes:
- Fix 1 (Issue #2): `dispatch()` try/catch — done in `src/app.js`
- Fix 2 (Issue #4): `STRIKE_SOLUTIONS`, `THREAT_PROTOCOLS`, `SENSOR_NODES` canonicalized in `hub-controller.js`; dead exports removed from `src/app.js`; private copy removed from `src/modules/war-room.js`
- Fix 3 (Issue #12): `PROTOCOL_EFFECTS` table added to `hub-controller.js`; `initiateThreatProtocol` now applies distinct per-protocol deltas matching the UI labels
- Fix 4 (Issue #32): `[data-module]` handler moved from `document` to `rail` element in `src/app.js`
- Fix 5 (Issue #29): `let _chart = null` canvas guard added to `update()` in `war-room.js` and `hormuz-escalation.js`; cleanup fn destroys chart on unmount
- Fix 6 (Issue #31): `SCREEN_TO_PANEL` routing added to `orbital.js` (route-suffix→panel map), `electronic-warfare.js` (spectrum-map→spectrum), and `executive-briefing.js` (tool screenId→sub-view with back button)

Additional: clock race (Issue #1) fixed alongside Fix 4 — `initTopBar()` once + `updateShellMetrics()` targeted updates replaces full `renderShell()` replacement.

---

## Group 1 — Must Fix Before Phase 2

These issues either break existing functionality, will make Phase 2 work produce wrong
results, or will actively cause hard-to-debug failures once Phase 2 code is added.

---

### Issue #2 — `dispatch` has no exception guard ✓ COMPLETE
**File:** `src/app.js`

**The problem:**
```js
export function dispatch(fn, ...args) {
  const prev = state.activeModule;
  state = fn(state, ...args);   // if this throws, state is not updated
  persist();                    // but these still run if the throw is caught upstream
  renderShell();
  ...
}
```
If any hub-controller function throws (e.g. `selectScreen` with an unknown screenId throws
`RangeError`), the exception propagates uncaught to the click handler with no user feedback.
Phase 2 will add more complex state mutations (war game turn engine, Chart.js event handlers).
An uncaught error in that context will silently break the entire event loop with no recovery.

**Fix required:**
```js
export function dispatch(fn, ...args) {
  const prev = state.activeModule;
  let next;
  try {
    next = fn(state, ...args);
  } catch (err) {
    console.error("[dispatch]", err);
    return; // bail — do not persist or re-render
  }
  state = next;
  persist();
  renderShell();
  if (state.activeModule !== prev) {
    routeTo(mount, state.activeModule, state, dispatch);
  } else {
    updateActive(mount, state);
  }
}
```

**Blocks Phase 2:** Yes. War game advance and Chart.js integration both have more failure
surface. A silent crash during Phase 2 work will be extremely difficult to trace.

**Risk if deferred:** High. Any error in Phase 2 state mutations will leave the app in an
unknown state with no console signal and no recovery path.

---

### Issue #4 — `STRIKE_SOLUTIONS`, `THREAT_PROTOCOLS`, `SENSOR_NODES` defined twice ✓ COMPLETE
**Files:** `src/app.js` (exported but unused), `src/modules/war-room.js` (private copy)

**The problem:**
Both files define these constants independently. `app.js` exports them as dead code. `war-room.js`
has its own private copy. Phase 2 extends the war-room module with a full turn engine — any change
to solution vectors or protocol data made in one location will silently not apply in the other.

**Fix required:**
Move the three constants into `hub-controller.js` as frozen exports (consistent with how
`PLANETARY_DATA`, `EXECUTIVE_BRIEFING_TOOLS`, `NAV_MODULES` etc. are handled there), or into a
new `src/constants.js` that both `app.js` and `war-room.js` import from. Remove the exports
from `app.js` and the private copy from `war-room.js`.

**Blocks Phase 2:** Yes. Phase 2 touches `war-room.js` directly and may adjust solution data.
Having two sources of truth for the same data is a guaranteed source of regression.

**Risk if deferred:** High. Maintenance errors. If Phase 2 adds a fourth strike solution or
changes protocol impact values in one place and not the other, the display and the state machine
diverge silently.

---

### Issue #12 — Protocol delta labels contradict the state machine ✓ COMPLETE
**File:** `src/modules/war-room.js`

**The problem:**
The UI labels claim:
- `containment` → `-6 THREAT`
- `deconflict` → `+4 READY`
- `signal-sweep` → `+8 SPECTRUM`

The actual `initiateThreatProtocol` function in `hub-controller.js` does:
- Always subtracts exactly 6 from `state.system.threat`
- Always subtracts 1 from `state.system.readiness`
- Never touches `spectrumIntegrity`
- The same mutation for all three protocols

`deconflict` and `signal-sweep` claim effects that do not exist in the engine. No protocol
adds readiness or improves spectrum. The `chip-amber` vs `chip-cyan` tone differentiation is
therefore also meaningless.

**Fix required:**
Either:
a) Correct the labels to match what `initiateThreatProtocol` actually does (`-6 THREAT`, `-1 READY`,
   `-1 READY` for all three), and give them distinct display labels only, not effect claims; or
b) Extend `hub-controller.js` to implement per-protocol effects (different deltas for each),
   and update the labels to match.

Option (b) is what the design intends. Deferring this to Phase 2 is acceptable only if the
labels are corrected first to stop claiming false effects.

**Blocks Phase 2:** Effectively yes. Phase 2 extends the war game turn engine. If the protocol
panel is already presenting incorrect cause-and-effect to the user, every Phase 2 test session
will produce confusing results when readiness goes down after clicking `deconflict` despite the
label saying `+4 READY`.

**Risk if deferred:** High. This is not cosmetic — it is a factual mismatch between displayed
behavior and actual behavior in the simulation's primary interactive module.

---

### Issue #31 — `selectScreen` updates `activeScreenId` but modules do not route on it ✓ COMPLETE
**Files:** `src/modules/overview.js`, `src/modules/war-room.js`, all screen-rail buttons

**The problem:**
`selectScreen(state, screenId)` in `hub-controller.js` updates:
- `state.activeModule` (to the screen's layer)
- `state.activeScreenId` (to the target screenId)
- `state.drillDown[layer].activeScreenId`

`dispatch` then correctly mounts the target module if `activeModule` changed. However, no module
uses `state.activeScreenId` to change its *internal view*. Each module routes internally by
`state.drillDown[moduleId].panel` (a string like `"spectrum"` or `"assets"`), not by screenId.

Result: clicking the `Signal Intelligence` screen row in war-room's rail navigates to the
`orbital` module, but the orbital module opens in whatever panel it was last on — not in the
spectrum panel that corresponds to the Signal Intelligence screen. Clicking any screen in the
`executive-briefing` module's rail (14 screens) opens the same briefing tool list regardless of
which screen was clicked.

**Fix required:**
Add a `screenId → panel` mapping table in each module (or derive it from `STITCH_SCREENS.route`),
and apply it in `mount()` and `update()` to set the correct sub-panel when `state.activeScreenId`
matches a known screen for that module. Minimal version: check `state.activeScreenId` at render
time and select the appropriate segmented-control panel.

**Blocks Phase 2:** Yes. Screen navigation is a core feature. As Phase 2 adds more screens and
sub-panels to the war-room and hormuz modules, the same broken routing will compound.

**Risk if deferred:** High. Every screen link in every module rail is currently broken as a
navigation target — it updates state but produces no visible change in the active module's view.

---

### Issue #32 — `[data-module]` click handler is on `document`, not the rail container ✓ COMPLETE
**File:** `src/app.js`

**The problem:**
```js
document.addEventListener("click", (e) => {
  const modBtn = e.target.closest("[data-module]");
  if (modBtn) {
    dispatch(transitionTerminal, id, ...);
  }
});
```
Any element anywhere in the page with a `data-module` attribute — including inside module
content — will trigger a module transition. Currently no module button uses `data-module`, so
there is no collision. Phase 2 adds more interactive panels to `war-room.js`. If any Phase 2
element accidentally gets a `data-module` attribute (in a data-binding context, template literal
error, or copy-paste), it will silently hijack navigation.

**Fix required:**
Scope the listener to the rail container:
```js
rail.addEventListener("click", (e) => {
  const modBtn = e.target.closest("[data-module]");
  if (modBtn) dispatch(transitionTerminal, modBtn.dataset.module, ...);
});
```
Or keep it on `document` but add a guard: `if (!rail.contains(modBtn)) return;`

**Blocks Phase 2:** Marginally. The risk is low today but increases with each new button
added in Phase 2. Cost to fix now: 3 lines. Cost to debug later: unknown.

**Risk if deferred:** Medium. Grows with every new interactive element added in Phase 2+.

---

## Group 2 — Fix During Phase 2

These issues are in files that Phase 2 will open and modify anyway, or are low-effort
fixes that are substantially cheaper to bundle with Phase 2 work than to do as a
separate pass later. None are strictly blocking, but all will be immediately visible
during Phase 2 development.

---

### Issue #1 — `renderShell()` innerHTML replaces the clock element on every dispatch ✓ COMPLETE (fixed alongside Issue #32)
**File:** `src/app.js`

**The problem:**
`renderTopBar()` replaces the entire topbar innerHTML, which destroys the `#shell-clock` span
that `tickClock()` updates every second. The setInterval closure re-queries by ID on each tick,
so the race is: dispatch fires → topbar innerHTML replaced → `#shell-clock` exists again → clock
resumes. Works in practice because the 1-second interval is slower than a render. But any rapid
dispatch sequence (e.g. Phase 2's turn engine) will cause the clock to stutter.

**Fix required:**
Extract the clock into a separate non-replaced element, or switch `renderTopBar()` to targeted
DOM updates for the metric values (`getElementById("shell-threat").textContent = ...`) instead
of innerHTML replacement. The brand, TOP SECRET badge, and icon buttons never change, so they
do not need to be re-rendered on every state change.

**Blocks Phase 2:** No. Fix when touching `app.js` for other reasons.

**Risk if deferred:** Low. The clock stutter is a cosmetic glitch, not a functional failure.

---

### Issue #3 — Dead imports in `app.js` ✓ COMPLETE (cleaned up with app.js rewrite)
**File:** `src/app.js`

**The problem:**
The following are imported but never referenced in `app.js`:
`COMMAND_CENTER_PATHS`, `EXECUTIVE_BRIEFING_TOOLS`, `getLayerSummary`, `PLANETARY_DATA`,
`SIDEBAR_TARGETS`, `SIMULATION_ASSETS`, `STITCH_PROJECT`, `STITCH_SCREENS`, `TACTICAL_THEME`,
`updateDrillDownState`, `validateAssetMappings`. Carried over from the old monolithic file.

**Fix required:** Remove unused import names. Takes 2 minutes.

**Blocks Phase 2:** No.

**Risk if deferred:** Low. Dead imports do not cause errors. They create confusion about
what `app.js` actually depends on and make future readers think these values are used somewhere.

---

### Issue #5 — `statusText()` defined but never called in `overview.js`
**File:** `src/modules/overview.js`

**The problem:**
```js
function statusText(status) {
  return { nominal: "chip chip-cyan", watch: "chip chip-amber", critical: "chip chip-red" }[status] ?? "chip chip-cyan";
}
```
Defined at line 31, never called. The same mapping is copy-pasted inline at other call sites.

**Fix required:** Remove the function, or actually use it where the chip class is computed.

**Blocks Phase 2:** No.

**Risk if deferred:** None. Dead code only.

---

### Issue #10/#11 — Directive checkboxes reset on every `update()` call
**File:** `src/modules/war-room.js`

**The problem:**
`update()` calls `container.innerHTML = html(state)`, which rebuilds the checkbox grid from
scratch. All checkboxes start unchecked. Since clicking "Advance Week" triggers `dispatch →
advanceWarRoom → update()`, the checkboxes the user had selected are cleared before they can
see what was submitted.

**Fix required:**
Option A: Before replacing innerHTML, capture the checked directive IDs, then re-check them after:
```js
export function update(container, state) {
  const checked = [...container.querySelectorAll(".wr-directive:checked")].map(cb => cb.value);
  container.innerHTML = html(state);
  checked.forEach(id => {
    const cb = container.querySelector(`.wr-directive[value="${id}"]`);
    if (cb) cb.checked = true;
  });
}
```
Option B: Store selected directives in `state.drillDown["war-room"].filters` and persist them,
then restore from state in `html()`. This is the clean solution but requires extending
`hub-controller.js` with a filters action. Better for Phase 2 when the turn engine is added.

**Blocks Phase 2:** No, but Phase 2 adds a full turn engine UI to war-room. The checkbox
pattern will be replaced. The real fix is Option B as part of the Phase 2 turn engine rewrite.

**Risk if deferred:** Medium UX. User cannot verify which directives were applied after advancing.

---

### Issue #14 — Orbital telemetry panel values are fully hardcoded
**File:** `src/modules/orbital.js`

**The problem:**
Velocity `7.66 km/s`, altitude `408 km`, inclination `51.6°`, period `92.68 min`, and
eccentricity `0.0003` are ISS parameters hardcoded as string literals. They never change.
The panel label says "Telemetry" and the chip says "online."

**Fix required:**
Connect these to simulation week at minimum (values should evolve). The cleanest approach
is to pull from `PLANETARY_DATA` for Earth-specific parameters and derive others from
`state.system.readiness` and `state.system.week` via the seeded noise approach used elsewhere.
For Phase 2, at minimum mark these clearly as `[STATIC]` in the UI or derive simple variations.

**Blocks Phase 2:** No.

**Risk if deferred:** Medium realism. The word "Telemetry" next to static strings is misleading.

---

### Issue #15 — Orbital module spectrum panel shows hardcoded channel values
**File:** `src/modules/orbital.js`

**The problem:**
```js
${["uplink", "jam-watch", "handoff"].map((ch, i) => `
  <div class="data-sm text-cyan">${78 + i * 5}% integrity</div>
`)}
```
Always `78%`, `83%`, `88%` regardless of `state.system.spectrumIntegrity`. The EW module
does this correctly with `channelHealth(base, spectrumIntegrity)`. The orbital module does not.

**Fix required:**
Copy the `channelHealth(base, si)` pattern from `electronic-warfare.js` into `orbital.js`'s
spectrum panel. One-line change per channel.

**Blocks Phase 2:** No.

**Risk if deferred:** Low-medium. The spectrum panel in orbital is a secondary view, but the
inconsistency between the orbital and EW modules is confusing when both are open and showing
different values for the same underlying metric.

---

### Issue #26 — Briefing tool buttons navigate to a screenId but content does not change
**File:** `src/modules/executive-briefing.js`

**The problem:**
The four briefing tool buttons dispatch `selectScreen(screenId)`. Since the target screens
are in the `executive-briefing` layer, `activeModule` does not change. `updateActive` is called,
which runs `update(container, state)`, which renders the same tool list regardless of which
tool was selected. There is no `if (activeScreenId === tool.screenId)` routing anywhere.

**Fix required:**
Add a screen-to-content routing block in `html(state)` (or in `update()`) that checks
`state.activeScreenId` against each briefing tool's screenId and renders the appropriate
sub-view. For Phase 1 this can be a simple switch with placeholder panels (with actual titles,
not blank rectangles). The routing infrastructure must exist before Phase 8 adds real content.

**Blocks Phase 2:** No. But this is the most user-visible broken behavior in a module that
exists specifically to present navigable tools.

**Risk if deferred:** Medium. Every user who clicks a briefing tool gets the same screen with
no feedback that anything happened.

---

### Issue #29 — All `update()` methods use full `container.innerHTML` replacement ✓ COMPLETE (war-room, hormuz — others deferred)
**Files:** All 8 module files

**The problem:**
Phase 2 will add Chart.js to `war-room.js` or `hormuz-escalation.js`. If `update()` calls
`container.innerHTML = html(state)` in those modules, it will destroy the `<canvas>` element
that Chart.js rendered into, invalidating the Chart instance and producing a blank panel.
The pattern must be changed in any module that owns a canvas before that canvas is initialized.

**Fix required:**
Before Phase 2 begins canvas work, the affected modules must split their `update()` into:
- Targeted DOM updates for text/badge/chip values (use `querySelector + textContent`)
- Leave the canvas element untouched
- Call `chart.update()` or `renderer.render()` directly on the instance stored in closure scope

This requires establishing the pattern in at least `war-room.js` and `hormuz-escalation.js`
before Phase 2 adds Chart.js to them. The other 6 modules can keep `innerHTML` for now.

**Blocks Phase 2:** Yes, for any module that Phase 2 adds a canvas to. Not blocking for the
shell or non-canvas modules.

**Risk if deferred:** Certain breakage. Chart.js canvas will be destroyed on the first state
update after it is created if `update()` is not refactored before the chart is initialized.

---

## Group 3 — Later Polish / Accessibility / Realism

These are real issues but none break functionality, cause data loss, or actively mislead
the simulation's core logic. Fix at the start of whichever phase touches the affected module,
or in a dedicated polish pass after Phase 4.

---

| # | File | Issue | Deferred Risk |
|---|------|--------|---------------|
| 6 | `overview.js` | Hierarchy node click hardcodes `"overview"` panel instead of restoring last panel | Low — navigation still works, just loses panel memory |
| 7 | `overview.js` | `STITCH_PROJECT.source` sentence renders in a tiny chip — will overflow | Low — cosmetic |
| 8 | `planets.js` | Orbital phase formula not real Keplerian; badge says `"live data"` for static JSON | Low — accuracy, not a functional failure |
| 9 | `planets.js` | `mount()` returns nothing; will silently leak Three.js renderer when Phase 4 adds it | Medium — must fix at Phase 4 start, not before |
| 13 | `war-room.js` | Screen rail shows full route strings (`/command-center/orbital`) that truncate badly | Low — cosmetic |
| 16 | `orbital.js` | Node telemetry card shows same hardcoded values for every node | Low — realism |
| 17 | `orbital.js` | `drill2` variable is a redundant re-read of `drill` already in scope | None — code quality only |
| 18 | `drone-swarm.js` | UAV lat/lng positions are static constants, never update with week or threat | Low — realism |
| 19 | `drone-swarm.js` | UAV node status hardcoded; `UAV-GHOST-12` is always `"watch"` | Low — realism |
| 20 | `drone-swarm.js` | SVG map paths are identical to `orbital.js` — visually indistinguishable | Low — cosmetic |
| 21 | `electronic-warfare.js` | EW node power levels and modes are static; not affected by `sig2` directive | Low — realism |
| 22 | `electronic-warfare.js` | `gps-denial` panel is reachable but renders a blank black rectangle with only a label | Low — expected placeholder, but user-facing |
| 23 | `hormuz-escalation.js` | Maritime lane statuses never change even at Rung 4 ("Active Blockade") | Medium — narrative inconsistency |
| 24 | `hormuz-escalation.js` | JSDoc says `hormuzSimulation.score()` is used; it is never imported or called | Low — misleading comment only |
| 25 | `hormuz-escalation.js` | Conflict probability formula duplicates (and differs from) `hormuz/index.js` formula | Medium — two formulas for same concept diverge silently |
| 27 | `executive-briefing.js` | Sit-rep is a monospaced string template, not a structured or exportable document | Low — expected for Phase 1 |
| 28 | `executive-briefing.js` | Decision log is a reversed string array, not parsed or categorized | Low — expected for Phase 1 |
| 30 | All modules | No keyboard navigation, `aria-current`, `aria-selected`, or focus management | Medium — accessibility, not blocking |

---

## Recommended Minimum Safe Set Before Phase 2

**All 6 fixes COMPLETE as of 2026-05-01. Phase 2 may begin.**

| Fix | Issue | File(s) | Status |
|-----|-------|---------|--------|
| 1 | #2 | `src/app.js` | ✓ Complete |
| 2 | #4 | `hub-controller.js`, `src/app.js`, `src/modules/war-room.js` | ✓ Complete |
| 3 | #12 | `hub-controller.js` | ✓ Complete |
| 4 | #32 | `src/app.js` | ✓ Complete |
| 4+ | #1 | `src/app.js` | ✓ Complete (bonus — fixed with #32) |
| 4+ | #3 | `src/app.js` | ✓ Complete (bonus — fixed with app.js rewrite) |
| 5 | #29 | `src/modules/war-room.js`, `src/modules/hormuz-escalation.js` | ✓ Complete |
| 6 | #31 | `src/modules/orbital.js`, `src/modules/electronic-warfare.js`, `src/modules/executive-briefing.js` | ✓ Complete |

### What can safely wait

Everything in Group 3 plus Issues #5, #6, #7, #8, #10/#11, #13, #14, #15, #26 can
be addressed during Phase 2 work on the files they appear in, or in a post-Phase-4 polish pass.
