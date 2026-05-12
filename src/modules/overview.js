/**
 * Overview module — Slide 48 bento layout.
 *
 * Layout: full-viewport bento grid (12-col)
 *   Left  3 cols — 4 metric hero cards with sparklines
 *   Center 6 cols — command theater: module hierarchy + screen scaffold
 *   Right  3 cols — incident log + selected entity card
 *
 * All existing state/simulation logic and dispatch behavior preserved.
 */

import {
  NAV_MODULES,
  STITCH_SCREENS,
  STITCH_PROJECT,
  COMMAND_CENTER_PATHS,
  getLayerSummary,
  getScreensForModule,
  selectScreen,
  transitionTerminal
} from "../../hub-controller.js";

// ─── Sparklines ───────────────────────────────────────────────────────────────

// Deterministic pseudo-history bars seeded from value + week
function sparkBars(value, week, activeColor, faintColor) {
  const bars = Array.from({ length: 8 }, (_, i) => {
    const h = ((value * 3 + week * 7 + i * 23 + i * i * 2) % 55) + 22;
    return Math.min(90, Math.max(12, h));
  });
  bars[7] = Math.max(10, Math.min(95, value)); // last bar = current value
  return `
    <div style="display:flex;align-items:flex-end;gap:2px;height:28px;margin-top:12px;">
      ${bars.map((h, i) =>
        `<div style="flex:1;height:${h}%;background:${i === 7 ? activeColor : faintColor};border-radius:1px;"></div>`
      ).join("")}
    </div>
  `;
}

// ─── Metric hero cards ────────────────────────────────────────────────────────

function metricCard(label, value, suffix, icon, heroColor, borderColor, subtext, sparkColor, faintColor, week) {
  return `
    <div class="ov-metric-card" style="border-color:${borderColor};">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div class="font-label-caps" style="color:#88919d;letter-spacing:0.15em;">${label}</div>
        <div style="width:28px;height:28px;background:rgba(26,32,44,0.8);border:1px solid rgba(63,72,82,0.6);
                    display:flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined" style="font-size:14px;color:#88919d;">${icon}</span>
        </div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:500;
                  line-height:1;color:${heroColor};margin-top:8px;letter-spacing:-0.01em;">
        ${value}<span style="font-size:12px;color:#88919d;margin-left:4px;">${suffix}</span>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${heroColor};
                  opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">
        ${subtext}
      </div>
      ${sparkBars(value, week, sparkColor, faintColor)}
    </div>
  `;
}

function threatCard(threat, week) {
  const color    = threat > 72 ? "#ffb4ab" : threat > 45 ? "#ffba20" : "#67d4f9";
  const border   = threat > 72 ? "rgba(255,180,171,0.35)" : threat > 45 ? "rgba(255,186,32,0.35)" : "rgba(103,212,249,0.25)";
  const label    = threat > 72 ? "CRITICAL" : threat > 45 ? "ELEVATED" : "NOMINAL";
  const filledSegs = Math.round(threat / 20);

  const segs = Array.from({ length: 5 }, (_, i) =>
    `<div style="flex:1;height:100%;background:${i < filledSegs ? color : "rgba(63,72,82,0.4)"};"></div>`
  ).join("");

  return `
    <div class="ov-metric-card" style="border-color:${border};">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div class="font-label-caps" style="color:${color};letter-spacing:0.15em;display:flex;align-items:center;gap:5px;">
          <span class="material-symbols-outlined" style="font-size:13px;">warning</span>THREAT LEVEL
        </div>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:500;
                  line-height:1;color:${color};margin-top:8px;">${threat}
        <span style="font-size:12px;color:#88919d;margin-left:4px;">IDX</span>
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;
                  color:${color};margin-top:4px;text-transform:uppercase;letter-spacing:0.1em;">${label}</div>
      <div style="display:flex;gap:3px;height:6px;margin-top:14px;border-radius:2px;overflow:hidden;">
        ${segs}
      </div>
      <div class="font-label-caps" style="color:#88919d;margin-top:6px;text-align:right;font-size:9px;">
        CENTCOM / W${week}
      </div>
    </div>
  `;
}

// ─── Log entry formatting ─────────────────────────────────────────────────────

function classifyLog(entry) {
  if (/strike|lock|kinetic|armed/i.test(entry))
    return { border: "#ffb4ab", color: "#ffb4ab", cat: "STRIKE" };
  if (/threat|critical|escalat|hostile|iran|houthi/i.test(entry))
    return { border: "#ffba20", color: "#ffba20", cat: "ALERT" };
  if (/spectrum|signal|ew|jamm|sweep/i.test(entry))
    return { border: "#67d4f9", color: "#67d4f9", cat: "EW" };
  if (/week|advance|resolv|direc/i.test(entry))
    return { border: "#98cbff", color: "#98cbff", cat: "SYS" };
  return { border: "#3f4852", color: "#88919d", cat: "LOG" };
}

function logEntryHTML(entry, idx) {
  const cls = classifyLog(entry);
  const weekMatch = entry.match(/^(W\d+):/);
  const ts   = weekMatch ? weekMatch[1] : "SYS";
  const text = weekMatch ? entry.replace(/^W\d+:\s*/, "") : entry;
  return `
    <div style="padding:5px 8px;border-left:2px solid ${cls.border};
                background:${idx === 0 ? `${cls.border}08` : "transparent"};
                margin-bottom:2px;cursor:default;">
      <div style="display:flex;justify-content:space-between;align-items:center;
                  font-family:'JetBrains Mono',monospace;font-size:10px;color:${cls.color};margin-bottom:2px;">
        <span>[${ts}]</span>
        <span>${cls.cat}</span>
      </div>
      <div style="font-family:'Inter',system-ui,sans-serif;font-size:11px;color:#bec7d4;line-height:1.4;">
        ${text}
      </div>
    </div>
  `;
}

// ─── Selected entity card ─────────────────────────────────────────────────────

function entityCard(state, summary) {
  const active = summary.find(m => m.active) ?? summary[0];
  const si = state.system.spectrumIntegrity;
  const metrics = [
    { label: "SCREENS",   value: active?.screenCount ?? "–" },
    { label: "CRITICAL",  value: active?.critical ?? "–"    },
    { label: "WEEK",      value: `W${state.system.week}`    },
    { label: "THREAT",    value: state.system.threat        },
    { label: "SPECTRUM",  value: `${si}%`                   },
    { label: "READINESS", value: `${state.system.readiness}%` }
  ];

  return `
    <div style="background:rgba(6,9,14,0.80);border:1px solid rgba(63,72,82,0.6);
                padding:14px;display:flex;flex-direction:column;gap:10px;flex-shrink:0;">
      <div class="font-label-caps" style="color:#88919d;border-bottom:1px solid rgba(63,72,82,0.5);
                                          padding-bottom:8px;">ACTIVE MODULE</div>
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="width:44px;height:44px;background:rgba(26,32,44,0.9);
                    border:1px solid rgba(63,72,82,0.8);display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;">
          <span class="material-symbols-outlined" style="font-size:22px;color:#dde2f3;">
            ${active?.icon ?? "hub"}
          </span>
        </div>
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:500;
                      color:#98cbff;letter-spacing:0.04em;">${(active?.id ?? "OVERVIEW").toUpperCase()}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#88919d;
                      text-transform:uppercase;margin-top:2px;">
            CLASS: ${active?.label ?? "COMMAND"}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px;">
        ${metrics.map(m => `
          <div style="display:flex;flex-direction:column;">
            <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#88919d;
                         text-transform:uppercase;letter-spacing:0.08em;">${m.label}</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#dde2f3;">
              ${m.value}
            </span>
          </div>
        `).join("")}
      </div>
      <div style="border-top:1px solid rgba(63,72,82,0.4);padding-top:8px;display:flex;flex-direction:column;gap:4px;">
        <div class="font-label-caps" style="color:#3a4252;font-size:8px;margin-bottom:2px;">SYSTEM HEALTH</div>
        ${[
          { label: "COMMS",    ok: si >= 70,                       note: si >= 70 ? "nominal" : "degraded" },
          { label: "ISR",      ok: state.system.orbitalISRCertainty >= 70, note: `${state.system.orbitalISRCertainty ?? "–"}%` },
          { label: "UAV SWRM", ok: state.system.swarmCohesion >= 60, note: `${state.system.swarmCohesion}%` }
        ].map(r => `
          <div style="display:flex;align-items:center;justify-content:space-between;
                      font-family:'JetBrains Mono',monospace;font-size:9px;">
            <span style="color:#595f77;">${r.label}</span>
            <span style="color:${r.ok ? "#4ade80" : "#ffba20"};">${r.note}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ─── Module hierarchy (center column) ────────────────────────────────────────

function hierarchyCard(t) {
  return `
    <button class="ov-mod-card ${t.active ? "ov-mod-card-active" : ""}"
            data-ov-module="${t.id}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div>
          <div class="font-label-caps" style="color:#88919d;font-size:9px;">${t.id}</div>
          <div style="font-family:'Inter',system-ui,sans-serif;font-size:13px;font-weight:600;
                      color:#dde2f3;margin-top:2px;">${t.label}</div>
        </div>
        <span class="material-symbols-outlined" style="font-size:18px;color:${t.active ? "#38BDF8" : "#3f4852"};flex-shrink:0;">
          ${t.icon}
        </span>
      </div>
      <p style="font-size:11px;color:#88919d;line-height:1.4;margin-bottom:8px;">${t.objective}</p>
      <div style="display:flex;gap:6px;align-items:center;font-family:'JetBrains Mono',monospace;font-size:9px;color:#595f77;text-transform:uppercase;">
        <span>${t.screenCount} states</span>
        <span style="color:rgba(63,72,82,0.6);">·</span>
        <span>${t.critical > 0 ? `<span style="color:#ffb4ab;">${t.critical} crit</span>` : "0 crit"}</span>
        <span style="color:rgba(63,72,82,0.6);">·</span>
        <span>${t.panel}</span>
      </div>
    </button>
  `;
}

// ─── 55-screen scaffold (below hierarchy in center col) ───────────────────────

function screenScaffold(state) {
  return NAV_MODULES.map(mod => {
    const screens = getScreensForModule(mod.id);
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:6px;padding-bottom:4px;
                    border-bottom:1px solid rgba(63,72,82,0.4);">
          <div class="font-label-caps" style="color:#88919d;">${mod.label}</div>
          <span style="font-family:'JetBrains Mono',monospace;font-size:9px;
                       color:#595f77;border:1px solid rgba(63,72,82,0.5);padding:1px 5px;">
            ${screens.length}
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:1px;">
          ${screens.map(screen => `
            <button class="ov-screen-link ${screen.screenId === state.activeScreenId ? "ov-screen-active" : ""}"
                    data-ov-screen="${screen.screenId}">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${screen.title}</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#595f77;flex-shrink:0;">
                ${screen.route.replace(COMMAND_CENTER_PATHS.baseRoute, "") || "/"}
              </span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");
}

// ─── Main HTML ────────────────────────────────────────────────────────────────

function html(state) {
  const summary = getLayerSummary(state);
  const { threat, readiness, swarmCohesion, spectrumIntegrity, hormuzEscalation, week } = state.system;
  const logEntries = state.system.log.slice().reverse().slice(0, 14);

  const specColor  = spectrumIntegrity >= 70 ? "#98cbff" : "#ffba20";
  const cohColor   = swarmCohesion >= 60 ? "#67d4f9" : "#ffba20";
  const readColor  = readiness >= 60 ? "#67d4f9" : "#ffba20";
  const readBorder = readiness >= 60 ? "rgba(103,212,249,0.25)" : "rgba(255,186,32,0.3)";
  const specBorder = spectrumIntegrity >= 70 ? "rgba(152,203,255,0.25)" : "rgba(255,186,32,0.3)";

  return `
    <style>
      .ov-wrap {
        margin: -20px -24px -40px;
        height: calc(100vh - 56px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        background: transparent;
      }
      /* Header */
      .ov-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 14px 20px 10px;
        border-bottom: 1px solid rgba(26,32,44,0.9);
        flex-shrink: 0;
        background: rgba(6,9,14,0.6);
      }
      /* Bento grid */
      .ov-bento {
        flex: 1;
        display: grid;
        grid-template-columns: 240px 1fr 240px;
        gap: 0;
        overflow: hidden;
        min-height: 0;
      }
      /* Columns */
      .ov-col-left {
        display: flex; flex-direction: column; gap: 0;
        overflow-y: auto; overflow-x: hidden;
        border-right: 1px solid rgba(26,32,44,0.9);
        scrollbar-width: thin;
        scrollbar-color: rgba(63,72,82,0.6) transparent;
      }
      .ov-col-center {
        overflow-y: auto; overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: rgba(63,72,82,0.6) transparent;
        border-right: 1px solid rgba(26,32,44,0.9);
      }
      .ov-col-right {
        display: flex; flex-direction: column;
        overflow: hidden;
      }
      /* Metric hero card */
      .ov-metric-card {
        background: rgba(6,9,14,0.80);
        border-left: 2px solid transparent;
        border-bottom: 1px solid rgba(26,32,44,0.9);
        padding: 16px;
        flex-shrink: 0;
        transition: background 0.15s;
      }
      .ov-metric-card:hover { background: rgba(26,32,44,0.50); }
      /* Module hierarchy card */
      .ov-mod-card {
        display: block; width: 100%; text-align: left;
        background: rgba(6,9,14,0.40);
        border: none;
        border-bottom: 1px solid rgba(26,32,44,0.9);
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .ov-mod-card:hover { background: rgba(56,189,248,0.05); }
      .ov-mod-card-active {
        background: rgba(56,189,248,0.08);
        border-left: 2px solid #38BDF8;
      }
      /* Screen link */
      .ov-screen-link {
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
        width: 100%; text-align: left; background: transparent; border: none;
        padding: 4px 6px;
        font-size: 11px; color: #595f77;
        cursor: pointer; border-radius: 2px;
        transition: background 0.12s, color 0.12s;
      }
      .ov-screen-link:hover { background: rgba(56,189,248,0.06); color: #bec7d4; }
      .ov-screen-active { background: rgba(56,189,248,0.08); color: #98cbff; }
      /* Incident log */
      .ov-log-panel {
        flex: 1; display: flex; flex-direction: column; overflow: hidden;
        min-height: 0;
      }
      .ov-log-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(26,32,44,0.9);
        background: rgba(8,14,26,0.6);
        flex-shrink: 0;
      }
      .ov-log-scroll {
        flex: 1; overflow-y: auto; padding: 6px;
        scrollbar-width: thin;
        scrollbar-color: rgba(63,72,82,0.6) transparent;
      }
      /* Reticle */
      .ov-reticle {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 120px; height: 120px;
        border: 1px solid rgba(152,203,255,0.12);
        border-radius: 50%;
        pointer-events: none;
      }
      .ov-reticle::before, .ov-reticle::after {
        content: "";
        position: absolute;
        background: rgba(152,203,255,0.15);
      }
      .ov-reticle::before {
        width: 1px; height: 140%;
        top: -20%; left: 50%; transform: translateX(-50%);
      }
      .ov-reticle::after {
        height: 1px; width: 140%;
        left: -20%; top: 50%; transform: translateY(-50%);
      }
    </style>

    <div class="ov-wrap">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <header class="ov-header">
        <div>
          <h1 style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;
                     color:#88919d;display:flex;align-items:center;gap:8px;letter-spacing:0.12em;
                     text-transform:uppercase;">
            <span class="material-symbols-outlined" style="font-size:14px;color:#595f77;">grid_view</span>
            Theater Status
          </h1>
          <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#3a4252;
                    text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;">
            CENTCOM // W${week} // ${NAV_MODULES.length} modules // ${STITCH_SCREENS.length} states
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:transparent;border:1px solid rgba(63,72,82,0.5);
                      padding:4px 9px;display:flex;align-items:center;gap:6px;">
            <span style="width:5px;height:5px;border-radius:50%;background:#4ade80;flex-shrink:0;"></span>
            <span class="font-label-caps" style="color:#595f77;font-size:9px;">DATA LINK ACTIVE</span>
          </div>
          <div style="background:transparent;border:1px solid rgba(63,72,82,0.4);padding:4px 9px;">
            <span class="font-label-caps" style="color:#3a4252;font-size:9px;">CENTCOM THEATER</span>
          </div>
        </div>
      </header>

      <!-- ── Bento ──────────────────────────────────────────────────── -->
      <div class="ov-bento">

        <!-- Left: metric hero cards -->
        <div class="ov-col-left">
          ${metricCard("READINESS", readiness, "%", "verified",
            readColor, readBorder,
            readiness >= 60 ? "systems nominal" : "degraded posture",
            readColor, "rgba(103,212,249,0.15)", week)}
          ${threatCard(threat, week)}
          ${metricCard("SPECTRUM", spectrumIntegrity, "%", "wifi_tethering",
            specColor, specBorder,
            spectrumIntegrity >= 70 ? "comms integrity OK" : "interference detected",
            specColor, "rgba(152,203,255,0.12)", week)}
          ${metricCard("UAV COHESION", swarmCohesion, "%", "hub",
            cohColor, `rgba(${swarmCohesion >= 60 ? "103,212,249" : "255,186,32"},0.25)`,
            swarmCohesion >= 60 ? "swarm nominal" : "formation degraded",
            cohColor, `rgba(${swarmCohesion >= 60 ? "103,212,249" : "255,186,32"},0.12)`, week)}
          ${metricCard("HORMUZ", hormuzEscalation, "ESC", "warning_amber",
            hormuzEscalation > 65 ? "#ffb4ab" : hormuzEscalation > 40 ? "#ffba20" : "#98cbff",
            hormuzEscalation > 65 ? "rgba(255,180,171,0.3)" : hormuzEscalation > 40 ? "rgba(255,186,32,0.3)" : "rgba(152,203,255,0.2)",
            hormuzEscalation > 65 ? "blockade active" : hormuzEscalation > 40 ? "interdiction risk" : "strait nominal",
            hormuzEscalation > 65 ? "#ffb4ab" : hormuzEscalation > 40 ? "#ffba20" : "#98cbff",
            `rgba(${hormuzEscalation > 65 ? "255,180,171" : hormuzEscalation > 40 ? "255,186,32" : "152,203,255"},0.10)`, week)}
        </div>

        <!-- Center: module hierarchy + screen scaffold -->
        <div class="ov-col-center" style="position:relative;">
          <!-- subtle reticle decorative overlay -->
          <div class="ov-reticle" style="pointer-events:none;z-index:0;opacity:0.4;"></div>

          <!-- Scale HUD -->
          <div style="position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;
                      align-items:center;padding:7px 14px;
                      background:rgba(6,9,14,0.75);border-bottom:1px solid rgba(26,32,44,0.9);
                      backdrop-filter:blur(8px);">
            <span class="font-label-caps" style="color:#88919d;">MODULE INDEX</span>
            <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#3a4252;
                         border:1px solid rgba(63,72,82,0.4);padding:2px 6px;">
              ${summary.filter(t => t.active).map(t => t.label.toUpperCase()).join("") || "OVERVIEW"} // ACTIVE
            </span>
          </div>

          <!-- Module hierarchy cards -->
          <div style="position:relative;z-index:1;">
            ${summary.map(t => hierarchyCard(t)).join("")}
          </div>

          <!-- 55-screen scaffold (below hierarchy) -->
          <div style="padding:14px 14px 20px;border-top:1px solid rgba(26,32,44,0.9);">
            <div class="font-label-caps" style="color:#3a4252;margin-bottom:12px;padding-bottom:6px;
                         border-bottom:1px solid rgba(26,32,44,0.9);">
              STATE REGISTRY — ${STITCH_SCREENS.length} ENTRIES
            </div>
            ${screenScaffold(state)}
          </div>
        </div>

        <!-- Right: incident log + entity card -->
        <div class="ov-col-right">

          <div class="ov-log-panel">
            <div class="ov-log-header">
              <span class="font-label-caps" style="color:#88919d;">EVENT LOG</span>
              <span style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#3a4252;">
                W${week} · ${state.system.log.length} entries
              </span>
            </div>
            <div class="ov-log-scroll">
              ${logEntries.length
                ? logEntries.map((e, i) => logEntryHTML(e, i)).join("")
                : `<div style="font-family:'JetBrains Mono',monospace;font-size:10px;
                               color:#3a4252;text-align:center;padding:24px 0;text-transform:uppercase;">
                     No events recorded
                   </div>`
              }
            </div>
          </div>

          ${entityCard(state, summary)}

        </div>

      </div><!-- end bento -->
    </div><!-- end wrap -->
  `;
}

// ─── Mount / Update ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  container.innerHTML = html(state);

  function onClick(e) {
    const screenBtn = e.target.closest("[data-ov-screen]");
    if (screenBtn) { dispatch(selectScreen, screenBtn.dataset.ovScreen); return; }
    const modBtn = e.target.closest("[data-ov-module]");
    if (modBtn) { dispatch(transitionTerminal, modBtn.dataset.ovModule, "overview"); }
  }

  container.addEventListener("click", onClick);
  return () => container.removeEventListener("click", onClick);
}

export function update(container, state) {
  container.innerHTML = html(state);
}
