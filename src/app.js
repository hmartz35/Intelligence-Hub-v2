import {
  createHubState,
  getScreensForModule,
  NAV_MODULES,
  transitionTerminal
} from "../hub-controller.js";

import { registerModule, routeTo, updateActive } from "./router.js";
import { mount as mountOverview,   update as updateOverview   } from "./modules/overview.js";
import { mount as mountPlanets,    update as updatePlanets    } from "./modules/planets.js";
import { mount as mountWarRoom,    update as updateWarRoom    } from "./modules/war-room.js";
import { mount as mountOrbital,    update as updateOrbital    } from "./modules/orbital.js";
import { mount as mountDroneSwarm, update as updateDroneSwarm } from "./modules/drone-swarm.js";
import { mount as mountEW,         update as updateEW         } from "./modules/electronic-warfare.js";
import { mount as mountHormuz,     update as updateHormuz     } from "./modules/hormuz-escalation.js";
import { mount as mountBriefing,   update as updateBriefing   } from "./modules/executive-briefing.js";

// ─── Constants ───────────────────────────────────────────────────────────────

export const STORAGE_KEY = "intelligence-hub.command-center.state";

// ─── State ────────────────────────────────────────────────────────────────────

let state = loadState();

function loadState() {
  try {
    const fresh = createHubState();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fresh;
    const parsed = JSON.parse(stored);
    return {
      ...fresh,
      ...parsed,
      drillDown: { ...fresh.drillDown, ...(parsed.drillDown ?? {}) },
      strikePlanner: { ...fresh.strikePlanner, ...(parsed.strikePlanner ?? {}) },
      threatMatrix: { ...fresh.threatMatrix, ...(parsed.threatMatrix ?? {}) },
      hormuzParameters: { ...fresh.hormuzParameters, ...(parsed.hormuzParameters ?? {}) },
      terminalTransitions: parsed.terminalTransitions ?? fresh.terminalTransitions,
      causalBeliefs: parsed.causalBeliefs ?? fresh.causalBeliefs,
      causalInterventions: parsed.causalInterventions ?? fresh.causalInterventions,
      system: { ...fresh.system, ...parsed.system }
    };
  } catch {
    return createHubState();
  }
}

export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Shell DOM refs ───────────────────────────────────────────────────────────

const topbar = document.getElementById("shell-topbar");
const rail   = document.getElementById("shell-rail");
const mount  = document.getElementById("module-mount");

// ─── Module registration ──────────────────────────────────────────────────────

registerModule("overview",           { mount: mountOverview,   update: updateOverview   });
registerModule("planets",            { mount: mountPlanets,    update: updatePlanets    });
registerModule("war-room",           { mount: mountWarRoom,    update: updateWarRoom    });
registerModule("orbital",            { mount: mountOrbital,    update: updateOrbital    });
registerModule("drone-swarm",        { mount: mountDroneSwarm, update: updateDroneSwarm });
registerModule("electronic-warfare", { mount: mountEW,         update: updateEW         });
registerModule("hormuz-escalation",  { mount: mountHormuz,     update: updateHormuz     });
registerModule("executive-briefing", { mount: mountBriefing,   update: updateBriefing   });

// ─── Dispatch ─────────────────────────────────────────────────────────────────

/**
 * Single mutation path. Applies a pure hub-controller function, persists,
 * updates the shell chrome, and calls update() on the active module.
 * Does NOT remount the module unless activeModule changes.
 *
 * Fix #2: wrapped in try/catch — a bad state mutation logs and bails cleanly
 * rather than leaving state half-updated and crashing the event loop.
 */
export function dispatch(fn, ...args) {
  let next;
  try {
    next = fn(state, ...args);
  } catch (err) {
    console.error("[dispatch] state mutation failed:", err);
    return;
  }

  const prev = state.activeModule;
  state = next;

  try {
    persist();
  } catch (err) {
    console.warn("[dispatch] persist failed:", err);
  }

  updateShellMetrics();
  updateShellRail();

  if (state.activeModule !== prev) {
    routeTo(mount, state.activeModule, state, dispatch);
  } else {
    updateActive(mount, state);
  }
}

// ─── Shell renderers ──────────────────────────────────────────────────────────

/**
 * Called once at boot to write the static shell structure.
 * The inner metric spans and rail buttons are updated in-place after that,
 * so the clock element is never destroyed by a re-render.
 */
function initTopBar() {
  topbar.innerHTML = `
    <div class="shell-top-inner">
      <div class="shell-brand">AETHER COMMAND</div>
      <div class="shell-top-right">
        <div class="shell-live-indicator">
          <span class="shell-live-dot"></span>
          <span>LIVE</span>
        </div>
        <span class="shell-clock" id="shell-clock">UTC --:--:--</span>
        <span class="shell-metrics">
          THREAT&nbsp;<span id="shell-threat" class="text-red">${state.system.threat}</span>
          &nbsp;|&nbsp;
          READY&nbsp;<span id="shell-ready" class="text-cyan">${state.system.readiness}</span>%
          &nbsp;|&nbsp;
          W<span id="shell-week">${state.system.week}</span>
        </span>
        <span class="material-symbols-outlined shell-icon-btn">notifications</span>
        <span class="material-symbols-outlined shell-icon-btn">settings_input_component</span>
        <span class="material-symbols-outlined shell-icon-btn">terminal</span>
        <div class="shell-avatar" aria-hidden="true"></div>
      </div>
    </div>
  `;
}

/** Targeted DOM updates for metric values — does not touch the clock element. */
function updateShellMetrics() {
  const threat = document.getElementById("shell-threat");
  const ready  = document.getElementById("shell-ready");
  const week   = document.getElementById("shell-week");
  if (threat) threat.textContent = state.system.threat;
  if (ready)  ready.textContent  = state.system.readiness;
  if (week)   week.textContent   = state.system.week;
}

function updateShellRail() {
  rail.innerHTML = `
    <div class="rail-nav">
      ${NAV_MODULES.map(mod => {
        const active = mod.id === state.activeModule;
        const screens = getScreensForModule(mod.id);
        const critCount = screens.filter(s => s.status === "critical").length;
        return `
          <button class="rail-btn ${active ? "rail-btn-active" : ""}" data-module="${mod.id}" title="${mod.label}">
            <span class="material-symbols-outlined">${mod.icon}</span>
            <span class="rail-btn-label">${mod.label}</span>
            ${critCount > 0 ? `<span class="rail-badge">${critCount}</span>` : ""}
          </button>
        `;
      }).join("")}
    </div>
    <div class="rail-footer">
      <div class="rail-week">W${state.system.week}</div>
    </div>
  `;
}

// ─── CSS additions for shell (injected once at boot) ──────────────────────────

function injectShellStyles() {
  const style = document.createElement("style");
  style.textContent = `
    /* ─── Topbar ──────────────────────────────────────────────────────────────── */
    #shell-topbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 50;
      height: 56px;
      background: rgba(6,9,14,0.90);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 20px rgba(0,163,255,0.08);
    }
    .shell-top-inner {
      display: flex; align-items: center; justify-content: space-between;
      height: 100%; padding: 0 24px;
    }
    .shell-brand {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 20px; font-weight: 900; letter-spacing: -0.03em;
      color: #38BDF8;
    }
    .shell-top-right {
      display: flex; align-items: center; gap: 18px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.10em;
      color: #595f77;
    }
    .shell-live-indicator {
      display: flex; align-items: center; gap: 6px;
      color: #bec7d4;
    }
    .shell-live-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #38BDF8;
      box-shadow: 0 0 6px rgba(56,189,248,0.7);
    }
    .shell-clock  { color: #595f77; }
    .shell-metrics { color: #595f77; }
    .text-red  { color: #ffb4ab; }
    .text-cyan { color: #38BDF8; }
    .shell-icon-btn {
      cursor: pointer; padding: 4px; border-radius: 4px;
      color: #595f77; font-size: 20px;
      transition: color 0.15s, background 0.15s;
    }
    .shell-icon-btn:hover { color: #38BDF8; background: rgba(56,189,248,0.08); }
    .shell-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(26,32,44,1);
      border: 1px solid rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    /* ─── Rail ────────────────────────────────────────────────────────────────── */
    #shell-rail {
      position: fixed; top: 56px; left: 0; bottom: 0; z-index: 40;
      width: 80px;
      background: rgba(6,9,14,0.95);
      backdrop-filter: blur(24px);
      border-right: 1px solid rgba(255,255,255,0.07);
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 0;
    }
    .rail-nav {
      flex: 1; display: flex; flex-direction: column; width: 100%; gap: 0; overflow-y: auto;
      scrollbar-width: none;
    }
    .rail-nav::-webkit-scrollbar { display: none; }
    .rail-btn {
      position: relative; display: flex; flex-direction: column; align-items: center;
      width: 100%; padding: 12px 6px; gap: 5px;
      background: transparent; border: none; border-right: 2px solid transparent;
      cursor: pointer;
      color: #595f77;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
    }
    .rail-btn .material-symbols-outlined {
      font-size: 22px;
      transition: color 0.15s;
    }
    .rail-btn-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px; font-weight: 400;
      line-height: 1.2; text-align: center;
      text-transform: uppercase; letter-spacing: 0.05em;
      max-width: 68px;
    }
    .rail-btn:hover {
      color: #bec7d4; background: rgba(255,255,255,0.04);
    }
    .rail-btn-active {
      color: #38BDF8;
      background: rgba(56,189,248,0.10);
      border-right-color: #38BDF8;
    }
    .rail-badge {
      position: absolute; top: 7px; right: 7px;
      min-width: 14px; height: 14px; border-radius: 7px;
      background: #ff4d4d; color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      padding: 0 3px;
    }
    .rail-footer {
      padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06);
      width: 100%; display: flex; justify-content: center;
    }
    .rail-week {
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      color: #3a4252; text-transform: uppercase; letter-spacing: 0.1em;
    }

    /* ─── Module mount ────────────────────────────────────────────────────────── */
    #module-mount {
      position: fixed; top: 56px; left: 80px; right: 0; bottom: 0;
      overflow-y: auto; overflow-x: hidden;
      /* Base dark background */
      background-color: #06090E;
      /* Tactical grid: 40px, very subtle white lines */
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 40px 40px;
      padding: 20px 24px 40px;
    }
    /* Edge fade — vignette overlay via box-shadow inset on a pseudo-element would need
       a wrapper, so instead we inject a fixed overlay pointer-events-none div at boot */
    .mount-edge-fade {
      position: fixed; top: 56px; left: 80px; right: 0; bottom: 0;
      pointer-events: none; z-index: 1;
      background:
        linear-gradient(to right,  #06090E 0px, transparent 40px),
        linear-gradient(to left,   #06090E 0px, transparent 40px),
        linear-gradient(to bottom, #06090E 0px, transparent 40px),
        linear-gradient(to top,    #06090E 0px, transparent 40px);
    }
    #module-mount::-webkit-scrollbar { width: 4px; }
    #module-mount::-webkit-scrollbar-track { background: transparent; }
    #module-mount::-webkit-scrollbar-thumb { background: rgba(63,72,82,0.8); border-radius: 2px; }
    #module-mount::-webkit-scrollbar-thumb:hover { background: rgba(136,145,157,0.6); }

    /* ─── Utility classes (used by modules) ──────────────────────────────────── */

    /* Glass panel — matches Stitch slide .glass-panel */
    .glass-panel {
      background: rgba(26,32,44,0.80);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(63,72,82,0.8);
    }

    /* HUD glass — lighter panel for floating overlays */
    .hud-glass {
      background: rgba(6,9,14,0.80);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    /* Font utilities from Stitch token system */
    .font-label-caps {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      font-size: 11px; font-weight: 700;
      line-height: 1.2; letter-spacing: 0.10em;
      text-transform: uppercase;
    }
    .font-data-sm {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 400; line-height: 1.4;
    }
    .font-data-lg {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px; font-weight: 500;
      line-height: 1.4; letter-spacing: 0.05em;
    }
    .font-headline-md {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 24px; font-weight: 500; line-height: 1.3;
    }
    .font-headline-lg {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 32px; font-weight: 600;
      line-height: 1.2; letter-spacing: -0.01em;
    }

    /* Color token shortcuts matching Stitch design system */
    .text-primary   { color: #98cbff; }
    .text-secondary { color: #67d4f9; }
    .text-tertiary  { color: #ffba20; }
    .text-error     { color: #ffb4ab; }
    .text-outline   { color: #88919d; }
    .text-on-surface         { color: #dde2f3; }
    .text-on-surface-variant { color: #bec7d4; }
    .bg-surface-container         { background-color: #1a202c; }
    .bg-surface-container-low     { background-color: #161c27; }
    .bg-surface-container-high    { background-color: #242a36; }
    .bg-surface-container-highest { background-color: #2f3542; }
    .border-outline-variant { border-color: rgba(63,72,82,0.8); }

    /* Glow utilities */
    .glow-primary  { box-shadow: 0 0 12px rgba(0,163,255,0.25); }
    .glow-error    { box-shadow: 0 0 12px rgba(255,180,171,0.25); }
    .glow-tertiary { box-shadow: 0 0 12px rgba(255,186,32,0.25); }

    /* ─── Simulation-specific styles (unchanged) ─────────────────────────────── */

    /* Phase 2 — War Game Turn Engine timeline */
    .timeline-week {
      width: 40px; height: 36px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      border: 1px solid rgba(255,255,255,0.07);
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .timeline-week-future { color: #3a4252; background: rgba(6,9,14,0.4); }
    .timeline-week-past   { color: #38BDF8; background: rgba(56,189,248,0.06); border-color: rgba(56,189,248,0.15); }
    .timeline-week-active {
      color: #0d131f; background: #38BDF8; border-color: #38BDF8;
      box-shadow: 0 0 12px rgba(56,189,248,0.45);
    }

    /* Phase 2 — Hormuz slider track */
    .hormuz-slider {
      -webkit-appearance: none; appearance: none;
      width: 100%; height: 4px;
      background: rgba(255,255,255,0.07);
      border-radius: 2px; outline: none; cursor: pointer;
    }
    .hormuz-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 14px; height: 14px; border-radius: 50%;
      background: #ffba20; border: 2px solid #0d131f; cursor: pointer;
    }
    .hormuz-slider::-moz-range-thumb {
      width: 14px; height: 14px; border-radius: 50%;
      background: #ffba20; border: 2px solid #0d131f; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // Edge-fade overlay for the module mount area
  const fade = document.createElement("div");
  fade.className = "mount-edge-fade";
  document.body.appendChild(fade);
}

// ─── Global event delegation ──────────────────────────────────────────────────
// Fix #32: scoped to the rail element so data-module attributes inside module
// content cannot accidentally trigger a module transition.

rail.addEventListener("click", (e) => {
  const modBtn = e.target.closest("[data-module]");
  if (modBtn) {
    const id = modBtn.dataset.module;
    dispatch(transitionTerminal, id, state.drillDown[id]?.panel ?? "overview");
  }
});

// ─── UTC clock tick ───────────────────────────────────────────────────────────
// Updates only the clock span — topbar HTML is stable after initTopBar().

function tickClock() {
  const el = document.getElementById("shell-clock");
  if (el) {
    const t = new Date().toUTCString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
    el.textContent = `UTC ${t}`;
  }
}
setInterval(tickClock, 1000);

// ─── Boot ─────────────────────────────────────────────────────────────────────

injectShellStyles();
initTopBar();
tickClock();
updateShellRail();
routeTo(mount, state.activeModule, state, dispatch);
persist();

export function getState() { return state; }
