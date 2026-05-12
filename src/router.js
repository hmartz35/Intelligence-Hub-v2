/**
 * Module registry — mount/unmount/update lifecycle for interactive simulation modules.
 *
 * Each module exports:
 *   mount(container, state, dispatch) → cleanup fn | void
 *   update(container, state)
 *
 * Modules are NOT remounted on every state change — only when activeModule changes.
 * This keeps Three.js contexts, Leaflet maps, Chart.js instances, and Web Workers alive
 * across navigation events within the same module.
 */

const registry = new Map();
let _activeId = null;
let _cleanup = null;

function runCleanup() {
  if (!_cleanup) return;
  try {
    _cleanup();
  } catch (err) {
    console.warn("[router] module cleanup failed:", err);
  } finally {
    _cleanup = null;
  }
}

export function registerModule(id, mod) {
  registry.set(id, mod);
}

export function routeTo(container, moduleId, state, dispatch) {
  if (moduleId === _activeId) {
    const mod = registry.get(moduleId);
    if (mod?.update) mod.update(container, state);
    return;
  }

  // Tear down previous module before any new DOM is mounted.
  runCleanup();
  container.innerHTML = '';
  _activeId = moduleId;

  const mod = registry.get(moduleId);
  if (!mod) {
    container.innerHTML = `<div class="panel m-5"><p class="text-muted">Module "${moduleId}" not registered.</p></div>`;
    return;
  }
  const result = mod.mount(container, state, dispatch);
  _cleanup = typeof result === 'function' ? result : null;
}

export function updateActive(container, state) {
  if (!_activeId) return;
  const mod = registry.get(_activeId);
  if (mod?.update) mod.update(container, state);
}

export function activeModuleId() {
  return _activeId;
}

export function resetRouterForTests() {
  runCleanup();
  registry.clear();
  _activeId = null;
}
