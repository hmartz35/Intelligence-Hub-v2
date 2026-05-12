# Intelligence Hub v2 Architecture

This app is a live command-center shell, not a set of static Stitch pages. The
architecture is intentionally small: `hub-controller.js` owns canonical state
and simulation transitions, `src/app.js` owns dispatch/persistence/shell chrome,
`src/router.js` owns module lifecycle, and `src/modules/*` render interactive
views over that state.

## Hard Rules

- Do not rewrite the shell/state architecture to introduce a second state path.
- Do not inject raw Stitch HTML into the app. Stitch exports are design
  references only.
- Do not move simulation rules, constants, or transition math out of
  `hub-controller.js` into UI modules.
- Do not mutate state directly from modules. Modules call `dispatch(fn, ...args)`
  with exported `hub-controller.js` transition functions.
- Do not remount the active module for routine state updates. Use `update()` for
  same-module changes.

## Runtime Ownership

`index.html` defines three persistent shell containers:

- `#shell-topbar`
- `#shell-rail`
- `#module-mount`

`src/app.js` initializes those containers, registers all modules, persists state
to local storage, and routes every state mutation through `dispatch()`.

`src/router.js` owns module transitions. When the active module changes, it must:

1. call the previous module cleanup function,
2. clear the module mount,
3. mount the next module,
4. store the next module cleanup function.

When routing to the already-active module, it must call `update()` only.

## Module Contract

Every module exports:

```js
export function mount(container, state, dispatch) {}
export function update(container, state) {}
```

Modules that own Chart.js, Three.js, Leaflet, animation frames, intervals,
canvases, workers, or long-lived listeners must also export:

```js
export function cleanup() {}
```

`cleanup()` must be idempotent. It must be safe to call before mount, after
route changes, after partial initialization, and more than once.

Resource-owning modules should call `cleanup()` at the start of `mount()` to
guard against direct remounts during tests or future autonomous edits.

## Lifecycle Safety

Use module-scope refs only for resources that need to survive `update()` within
the same active module:

- Chart.js instances
- Leaflet map instances
- animation frame IDs
- canvas elements/contexts
- event listener callbacks

Before replacing DOM that contains one of those resources, destroy or cancel the
resource first. Do not set the ref to `null` without calling the library cleanup
API.

Required cleanup examples:

- Chart.js: `chart.destroy()`
- Leaflet: `map.remove()`
- animation loop: `cancelAnimationFrame(id)`
- DOM listener: `container.removeEventListener(type, handler)`
- canvas refs: remove or allow owner DOM replacement, then null refs

## Update Pattern

`update(container, state)` should patch in place when a live resource is active.
For example, update chart data, redraw a canvas, or patch a selected-info panel
without replacing the resource's parent DOM.

Full `innerHTML` replacement is acceptable only when no live resource would be
orphaned, or after that resource has been explicitly cleaned up.

## Current Resource Owners

- `src/modules/hormuz-escalation.js`: Chart.js escalation chart
- `src/modules/orbital.js`: Leaflet theater map and marker handlers
- `src/modules/planets.js`: ISR canvas animation loop
- `src/modules/drone-swarm.js`: UAV canvas animation loop
- `src/modules/electronic-warfare.js`: GPS denial canvas
- `src/modules/war-room.js`: causal graph canvas reference

Simple static modules may rely on the cleanup function returned from `mount()`
for delegated container listeners, but any future long-lived resource should use
an explicit exported `cleanup()` function.

## Tests

Lifecycle changes should include tests for:

- cleanup running before next module mount,
- same-module routing using `update()` rather than remounting,
- resource-owning modules exporting explicit cleanup hooks,
- state transition behavior remaining centralized in `hub-controller.js`.
