/**
 * Hormuz Escalation module — Phase 2
 *
 * Panels (state.drillDown["hormuz-escalation"].panel):
 *   ladder    → 5-rung escalation ladder + advance button (Phase 1, unchanged)
 *   dashboard → Chart.js escalation trajectory + 4 parameter sliders
 *
 * Data sources:
 *   state.system.hormuzEscalation  → 0–100 escalation index
 *   state.system.hormuzHistory     → [{week, escalation}] trajectory
 *   state.system.threat            → drives conflict probability
 *   state.system.week              → simulation week
 *   state.hormuzParameters         → economicPressure, navalPosture, allianceCohesion, escalationRate
 *   getScreensForModule("hormuz-escalation") → 2 screens
 *
 * Events dispatched:
 *   selectScreen, advanceWarRoom, updateDrillDownState, setHormuzParameters
 */

import {
  getScreensForModule,
  selectScreen,
  advanceWarRoom,
  updateDrillDownState,
  setHormuzParameters
} from "../../hub-controller.js";

// ─── Static data ──────────────────────────────────────────────────────────────

const ESCALATION_RUNGS = [
  { level: 1, label: "Elevated Readiness",  threshold: 20, tone: "chip-cyan",  desc: "CENTCOM surges ISR assets. IRGCN probing maneuvers in the northern Gulf. No kinetic contact." },
  { level: 2, label: "Naval Posturing",     threshold: 40, tone: "chip-cyan",  desc: "Carrier strike group enters Gulf of Oman. IRGCN small-boat swarms shadow commercial traffic." },
  { level: 3, label: "Interdiction",        threshold: 55, tone: "chip-amber", desc: "IRGCN boards and seizes commercial vessels. US escort operations under fire. Oil markets spike." },
  { level: 4, label: "Active Blockade",     threshold: 72, tone: "chip-amber", desc: "Iran mines the Strait approaches. Tanker traffic halted. Coalition forces take casualties." },
  { level: 5, label: "Full-Scale Conflict", threshold: 88, tone: "chip-red",   desc: "Iran fires anti-ship ballistic missiles at CSG. Direct US-Iran naval engagement underway." }
];

const HORMUZ_LANES = [
  { id: "HORMUZ-LANE-A",  label: "Inbound Tanker Lane",       width: "2.5 nm", status: "open"       },
  { id: "HORMUZ-LANE-B",  label: "Outbound Tanker Lane",      width: "2.5 nm", status: "monitored"  },
  { id: "TSS-SEPARATION", label: "Traffic Separation Zone",   width: "1 nm",   status: "restricted" },
  { id: "DEEP-CHANNEL",   label: "Deep Water Channel",        width: "4 nm",   status: "open"       }
];

const SLIDER_DEFS = [
  { key: "navalPosture",     label: "Naval Posture",      min: 0, max: 100, default: 40, warn: 60 },
  { key: "escalationRate",   label: "Escalation Rate",    min: 0, max: 100, default: 35, warn: 55 },
  { key: "economicPressure", label: "Economic Pressure",  min: 0, max: 100, default: 50, warn: 65 },
  { key: "allianceCohesion", label: "Alliance Cohesion",  min: 0, max: 100, default: 65, warn: 40, inverse: true }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function activeRung(escalation) {
  let rung = ESCALATION_RUNGS[0];
  for (const r of ESCALATION_RUNGS) {
    if (escalation >= r.threshold) rung = r;
  }
  return rung;
}

function conflictProbability(escalation, threat) {
  return Math.min(99, Math.round(escalation * 0.6 + threat * 0.4));
}

function laneStatusClass(status) {
  return { open: "chip-cyan", monitored: "chip-amber", restricted: "chip-red" }[status] ?? "chip-cyan";
}

// ─── Panel: escalation ladder (Phase 1, unchanged) ───────────────────────────

function panelLadder(state) {
  const idx   = state.system.hormuzEscalation;
  const rung  = activeRung(idx);
  const cProb = conflictProbability(idx, state.system.threat);

  return `
    <div style="margin-bottom:20px">
      <div class="flex items-center justify-between gap-3" style="margin-bottom:6px">
        <span class="node-kicker">Escalation Index</span>
        <span class="metric-value ${idx > 72 ? "text-red" : idx > 40 ? "text-amber" : "text-cyan"}"
          style="font-size:1.5rem" id="hormuz-idx-val">${idx}</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${idx}%;background:${idx > 72 ? "#ff4d4d" : idx > 40 ? "#ffba20" : "#0EA5E9"};transition:width 0.5s;border-radius:4px"></div>
      </div>
      <div class="data-sm text-muted" style="margin-top:4px">
        Conflict probability: <span id="hormuz-cprob-val">${cProb}%</span> | Active rung: ${rung.level} / 5
      </div>
    </div>

    <div class="grid gap-2" style="margin-bottom:16px">
      ${ESCALATION_RUNGS.map(r => {
        const active = r.level === rung.level;
        return `
          <div class="target-card ${active ? "target-card-active" : ""}">
            ${active ? '<span class="neon-line"></span>' : ""}
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="node-kicker">Rung ${r.level} — threshold ${r.threshold}</div>
                <div class="node-title">${r.label}</div>
              </div>
              <span class="chip ${active ? r.tone : "chip-cyan"}">${active ? "ACTIVE" : r.threshold + "+"}</span>
            </div>
            ${active ? `<p class="data-sm text-muted" style="margin-top:6px;line-height:1.5">${r.desc}</p>` : ""}
          </div>`;
      }).join("")}
    </div>

    <button class="primary-action" data-hormuz-advance="true" style="width:100%">
      Advance Hormuz Ladder (hormuz7 directive)
    </button>
  `;
}

// ─── Panel: strategic dashboard (Phase 2) ────────────────────────────────────

function panelDashboard(state) {
  const params = state.hormuzParameters ?? {
    economicPressure: 50, navalPosture: 40, allianceCohesion: 65, escalationRate: 35
  };

  return `
    <!-- Chart -->
    <div style="margin-bottom:20px">
      <div class="node-kicker" style="margin-bottom:8px">Escalation Trajectory — W1 to W${state.system.week}</div>
      <div style="position:relative;height:220px;background:rgba(6,9,14,0.7);
        border:1px solid rgba(34,48,68,1);border-radius:4px;padding:4px">
        <canvas id="hormuz-chart"></canvas>
      </div>
    </div>

    <!-- Sliders -->
    <div class="node-kicker" style="margin-bottom:10px">Strategic Parameters</div>
    <div class="grid gap-4" style="margin-bottom:16px">
      ${SLIDER_DEFS.map(s => {
        const val = params[s.key] ?? s.default;
        const isHigh = s.inverse ? val < s.warn : val > s.warn;
        const color  = isHigh ? "#ffba20" : "#0EA5E9";
        return `
          <div>
            <div class="flex items-center justify-between gap-3" style="margin-bottom:6px">
              <span class="data-sm text-muted">${s.label}</span>
              <span class="data-sm" style="color:${color};font-weight:700" id="hormuz-lbl-${s.key}">${val}</span>
            </div>
            <input type="range" class="hormuz-slider" id="hormuz-sl-${s.key}"
              min="${s.min}" max="${s.max}" value="${val}"
              data-hormuz-param="${s.key}">
          </div>`;
      }).join("")}
    </div>

    <!-- Economic impact model (adapted from reference dashboard.html oil-price formula) -->
    <div class="data-card" style="margin-bottom:14px;border-color:rgba(255,186,32,0.2)">
      <div class="node-kicker" style="margin-bottom:8px">Economic Impact Model</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div>
          <div class="data-sm text-muted" style="margin-bottom:2px">Oil Price</div>
          <div class="metric-value text-amber" style="font-size:1.2rem" id="hormuz-oil-val">
            $${Math.round(75 + (state.system.hormuzEscalation / 100) * 65)}/bbl
          </div>
        </div>
        <div>
          <div class="data-sm text-muted" style="margin-bottom:2px">Recession Risk</div>
          <div class="metric-value ${state.system.hormuzEscalation > 55 ? "text-red" : "text-amber"}" style="font-size:1.2rem" id="hormuz-rec-val">
            ${Math.min(95, Math.max(5, Math.round((Math.round(75 + (state.system.hormuzEscalation / 100) * 65) - 80) * 1.2 + state.system.hormuzEscalation * 0.35)))}%
          </div>
        </div>
        <div>
          <div class="data-sm text-muted" style="margin-bottom:2px">Cost Ratio</div>
          <div class="metric-value text-red" style="font-size:1.2rem">60:1</div>
          <div class="data-sm text-dim">US/Houthi</div>
        </div>
      </div>
      <p class="data-sm text-muted" style="margin-top:8px;line-height:1.5">
        US defensive cost ~$624M/mo vs Houthi ~$10.4M/mo. Oil baseline $75 + escalation-driven shock.
      </p>
    </div>

    <div style="display:flex;align-items:center;gap:10px">
      <button class="primary-action" data-hormuz-apply="true" style="flex:1">
        Apply to Simulation
      </button>
      <button class="primary-action" data-hormuz-reset="true"
        style="flex:0 0 auto;background:transparent;border:1px solid rgba(255,255,255,0.12);color:#595f77">
        Reset
      </button>
    </div>

    <div class="data-card" style="margin-top:14px;border-color:rgba(255,186,32,0.2)">
      <div class="node-kicker">How parameters apply</div>
      <p class="mt-2 text-xs leading-5 text-muted">
        Adjusting sliders above their neutral positions (Naval Posture 40, Escalation Rate 35,
        Economic Pressure 50, Alliance Cohesion 65) pushes the Hormuz escalation index up or down.
        Press "Apply" to dispatch the mutation to the simulation state and log the event.
      </p>
    </div>
  `;
}

// ─── Full HTML shell ──────────────────────────────────────────────────────────

function html(state) {
  const idx     = state.system.hormuzEscalation;
  const rung    = activeRung(idx);
  const cProb   = conflictProbability(idx, state.system.threat);
  const screens = getScreensForModule("hormuz-escalation");
  const panel   = state.drillDown["hormuz-escalation"]?.panel ?? "ladder";

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Hormuz Escalation / W${state.system.week}</div>
        <h2>Strait of Hormuz</h2>
        <p>Escalation ladder, maritime status, and strategic parameter dashboard.</p>
      </div>
      <div class="hero-panel">
        <span class="chip ${idx > 72 ? "chip-red" : idx > 40 ? "chip-amber" : "chip-cyan"}"
          id="hormuz-head-idx">ESC ${idx}</span>
        <span class="chip chip-red" id="hormuz-head-cprob">CONFLICT ${cProb}%</span>
        <span class="chip chip-amber">W${state.system.week}</span>
      </div>
    </div>

    <div class="workspace-grid">
      <!-- Main panel -->
      <section class="panel panel-large">
        <div class="panel-head" style="margin-bottom:12px">
          <div><div class="node-kicker">Escalation Terminal</div><h3>${rung.label}</h3></div>
          <span class="chip ${rung.tone}">RUNG ${rung.level}</span>
        </div>

        <div class="segmented" style="margin-bottom:16px">
          <button class="${panel === "ladder"    ? "segment-active" : ""}" data-hormuz-panel="ladder">Ladder</button>
          <button class="${panel === "dashboard" ? "segment-active" : ""}" data-hormuz-panel="dashboard">Dashboard</button>
        </div>

        <div id="hormuz-panel-body">
          ${panel === "dashboard" ? panelDashboard(state) : panelLadder(state)}
        </div>
      </section>

      <!-- Right: lanes + screen list -->
      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">Maritime Lanes</div><h3>Strait Status</h3></div>
        </div>
        <div class="grid gap-3" style="margin-bottom:16px">
          ${HORMUZ_LANES.map(lane => `
            <div class="asset-row">
              <div>
                <div class="text-sm font-semibold text-ink">${lane.label}</div>
                <div class="mt-1 data-sm uppercase text-dim">${lane.id} — ${lane.width}</div>
              </div>
              <span class="chip ${laneStatusClass(lane.status)}">${lane.status}</span>
            </div>`).join("")}
        </div>

        <div class="panel-head">
          <div><div class="node-kicker">Screens</div><h3>Hormuz</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}"
              data-hormuz-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1 truncate text-ink">${s.title}</span>
            </button>`).join("")}
        </div>

        <div class="data-card" style="margin-top:16px;border-color:rgba(255,186,32,0.2)">
          <div class="node-kicker">Phase 5 — Nash Equilibrium Solver</div>
          <p class="mt-2 text-xs leading-5 text-muted">
            Game-theoretic escalation model with 6 actors.
            Nash solver computes equilibrium strategies per rung.
          </p>
        </div>
      </div>
    </div>
  `;
}

// ─── Chart.js lifecycle ───────────────────────────────────────────────────────

let _chart = null;
let _container = null;
let _onChange = null;
let _onClick = null;

export function cleanup() {
  if (_chart) {
    _chart.destroy();
    _chart = null;
  }
  if (_container && _onChange) {
    _container.removeEventListener("input", _onChange);
  }
  if (_container && _onClick) {
    _container.removeEventListener("click", _onClick);
  }
  _container = null;
  _onChange = null;
  _onClick = null;
}

function buildChartData(state) {
  const history = state.system.hormuzHistory ?? [{ week: 1, escalation: state.system.hormuzEscalation }];
  return {
    labels:   history.map(h => `W${h.week}`),
    datasets: [{
      label: "Escalation Index",
      data:  history.map(h => h.escalation),
      borderColor: "#ffba20",
      backgroundColor: "rgba(255,186,32,0.08)",
      borderWidth: 2,
      tension: 0.35,
      fill: true,
      pointRadius: 3,
      pointBackgroundColor: "#ffba20"
    }]
  };
}

function initChart(container, state) {
  if (_chart) {
    _chart.destroy();
    _chart = null;
  }
  const canvas = container.querySelector("#hormuz-chart");
  if (!canvas || typeof Chart === "undefined") return null;

  _chart = new Chart(canvas, {
    type: "line",
    data: buildChartData(state),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          grid:  { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#595f77", font: { family: "'JetBrains Mono', monospace", size: 10 } }
        },
        y: {
          min: 0, max: 100,
          grid:  { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#595f77", font: { family: "'JetBrains Mono', monospace", size: 10 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Escalation: ${ctx.parsed.y}`
          }
        }
      }
    }
  });
  return _chart;
}

// Patch slider labels without HTML replacement
function patchSliderLabels(container, params) {
  for (const s of SLIDER_DEFS) {
    const lbl = container.querySelector(`#hormuz-lbl-${s.key}`);
    const sl  = container.querySelector(`#hormuz-sl-${s.key}`);
    if (lbl) lbl.textContent = params[s.key] ?? s.default;
    if (sl)  sl.value = params[s.key] ?? s.default;
  }
}

// ─── Module exports ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  cleanup();
  container.innerHTML = html(state);

  const panel = state.drillDown["hormuz-escalation"]?.panel ?? "ladder";
  if (panel === "dashboard") {
    initChart(container, state);
  }

  function onChange(e) {
    // Live slider → update label in real time (no dispatch)
    const sl = e.target.closest("[data-hormuz-param]");
    if (!sl) return;
    const key = sl.dataset.hormuzParam;
    const lbl = container.querySelector(`#hormuz-lbl-${key}`);
    if (lbl) lbl.textContent = sl.value;
    // Update chart preview with projected escalation
    if (_chart) {
      const params = readSliders(container);
      const preview = projectEscalation(state, params);
      const data = _chart.data;
      // Append a preview point (unsaved) after last real point
      if (data.labels[data.labels.length - 1] !== "preview") {
        data.labels.push("preview");
        data.datasets[0].data.push(preview);
        data.datasets[0].borderDash = [];
      } else {
        data.datasets[0].data[data.datasets[0].data.length - 1] = preview;
      }
      _chart.update("none");
    }
  }

  function onClick(e) {
    const panelBtn = e.target.closest("[data-hormuz-panel]");
    if (panelBtn) {
      dispatch(updateDrillDownState, "hormuz-escalation", { panel: panelBtn.dataset.hormuzPanel });
      return;
    }
    const advBtn = e.target.closest("[data-hormuz-advance]");
    if (advBtn) { dispatch(advanceWarRoom, ["hormuz7"]); return; }

    const applyBtn = e.target.closest("[data-hormuz-apply]");
    if (applyBtn) {
      const params = readSliders(container);
      dispatch(setHormuzParameters, params);
      return;
    }

    const resetBtn = e.target.closest("[data-hormuz-reset]");
    if (resetBtn) {
      const defaults = { economicPressure: 50, navalPosture: 40, allianceCohesion: 65, escalationRate: 35 };
      dispatch(setHormuzParameters, defaults);
      return;
    }

    const screenBtn = e.target.closest("[data-hormuz-screen]");
    if (screenBtn) { dispatch(selectScreen, screenBtn.dataset.hormuzScreen); }
  }

  container.addEventListener("input", onChange);
  container.addEventListener("click", onClick);
  _container = container;
  _onChange = onChange;
  _onClick = onClick;

  return cleanup;
}

export function update(container, state) {
  const panel = state.drillDown["hormuz-escalation"]?.panel ?? "ladder";

  if (_chart && panel === "dashboard") {
    // Canvas-safe update: patch chart data and slider labels in place
    const data = buildChartData(state);
    _chart.data.labels = data.labels;
    _chart.data.datasets[0].data = data.datasets[0].data;
    _chart.update("none");

    patchSliderLabels(container, state.hormuzParameters ?? {});

    // Update headline chips and economic model outputs
    const idx   = state.system.hormuzEscalation;
    const cProb = conflictProbability(idx, state.system.threat);
    const hi    = container.querySelector("#hormuz-head-idx");
    const hc    = container.querySelector("#hormuz-head-cprob");
    if (hi) hi.textContent = `ESC ${idx}`;
    if (hc) hc.textContent = `CONFLICT ${cProb}%`;
    const oilEl = container.querySelector("#hormuz-oil-val");
    const recEl = container.querySelector("#hormuz-rec-val");
    if (oilEl) {
      const oil = Math.round(75 + (idx / 100) * 65);
      oilEl.textContent = `$${oil}/bbl`;
    }
    if (recEl) {
      const oil = Math.round(75 + (idx / 100) * 65);
      recEl.textContent = `${Math.min(95, Math.max(5, Math.round((oil - 80) * 1.2 + idx * 0.35)))}%`;
    }
    return;
  }

  // Non-dashboard, or switching panels — full re-render
  if (_chart) {
    _chart.destroy();
    _chart = null;
  }
  container.innerHTML = html(state);

  if (panel === "dashboard") {
    initChart(container, state);
  }
}

// ─── Slider utilities ─────────────────────────────────────────────────────────

function readSliders(container) {
  const params = {};
  for (const s of SLIDER_DEFS) {
    const el = container.querySelector(`#hormuz-sl-${s.key}`);
    if (el) params[s.key] = Number(el.value);
  }
  return params;
}

function projectEscalation(state, params) {
  const prev = state.hormuzParameters ?? {
    economicPressure: 50, navalPosture: 40, allianceCohesion: 65, escalationRate: 35
  };
  const merged = { ...prev, ...params };
  const delta = Math.round(
    (merged.navalPosture    - 40) * 0.25 +
    (merged.escalationRate  - 35) * 0.20 +
    (merged.economicPressure - 50) * 0.10 +
    (65 - merged.allianceCohesion) * 0.10
  );
  return Math.max(0, Math.min(100, state.system.hormuzEscalation + delta));
}
