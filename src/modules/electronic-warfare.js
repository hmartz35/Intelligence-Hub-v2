/**
 * Electronic Warfare module — spectrum dominance, signal intel, GPS denial model.
 *
 * Data sources:
 *   state.system.spectrumIntegrity  → 0–100 (drops when sig2 directive applied)
 *   state.system.threat             → drives jamming pressure
 *   state.system.week               → simulation week
 *   state.drillDown["electronic-warfare"] → panel, selectedNodeId
 *   getScreensForModule("electronic-warfare") → 1 screen (spectrum-map)
 *
 * GPS Denial Canvas (Phase 4):
 *   _gpsCanvas module-scope ref; canvas-safe lifecycle.
 *   drawGPSZones renders 4 EW node jammers as radial gradient denial zones
 *   over a Gulf theater background. Zone radius = (power/100) * BASE_RADIUS
 *   * (spectrumIntegrity/100). Higher spectrumIntegrity = larger US denial zones.
 *   Geographic coords mapped to canvas pixels via GEO bounds (same as drone-swarm).
 */

import {
  getCausalChainSummary,
  getScreensForModule,
  initiateEWJammingEvent,
  selectScreen,
  updateDrillDownState
} from "../../hub-controller.js";

const EW_NODES = [
  { id: "EW-NODE-12",   band: "L-Band",  power: 82, mode: "JAM",     status: "nominal", lat: 26.9, lng: 56.3 },
  { id: "EW-NODE-07",   band: "S-Band",  power: 67, mode: "SPOOF",   status: "watch",   lat: 25.4, lng: 57.6 },
  { id: "EW-NODE-21",   band: "C-Band",  power: 91, mode: "MONITOR", status: "nominal", lat: 27.5, lng: 55.1 },
  { id: "SATLINK-EW-1", band: "X-Band",  power: 74, mode: "RELAY",   status: "nominal", lat: 24.8, lng: 58.9 }
];

// GPS denial canvas geographic bounds (Gulf theater)
const GPS_GEO = { latMin: 24.0, latMax: 28.2, lngMin: 54.8, lngMax: 59.5 };
const GPS_BASE_RADIUS = 90; // canvas pixels at full power + full spectrum

function _geoToPx(lat, lng, W, H) {
  return {
    x: ((lng - GPS_GEO.lngMin) / (GPS_GEO.lngMax - GPS_GEO.lngMin)) * W,
    y: ((GPS_GEO.latMax - lat) / (GPS_GEO.latMax - GPS_GEO.latMin)) * H
  };
}

// ─── GPS denial canvas ────────────────────────────────────────────────────────

let _gpsCanvas = null;
let _container = null;
let _onClick = null;

function drawGPSZones(canvas, state) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const si = state.system.spectrumIntegrity;

  // Background
  ctx.fillStyle = "#06090E";
  ctx.fillRect(0, 0, W, H);

  // Tactical grid
  ctx.strokeStyle = "rgba(56,189,248,0.06)";
  ctx.lineWidth = 1;
  const gridStep = 40;
  for (let x = 0; x < W; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Strait of Hormuz label
  const hormuz = _geoToPx(26.6, 56.4, W, H);
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(56,189,248,0.35)";
  ctx.textAlign = "center";
  ctx.fillText("STRAIT OF HORMUZ", hormuz.x, hormuz.y);

  // Denial zones — radial gradients per node
  EW_NODES.forEach(node => {
    const pos = _geoToPx(node.lat, node.lng, W, H);
    const radius = (node.power / 100) * GPS_BASE_RADIUS * (si / 100);

    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
    const isJam = node.mode === "JAM" || node.mode === "SPOOF";
    const coreColor = isJam ? "rgba(255,60,60,0.45)" : "rgba(251,191,36,0.35)";
    const edgeColor = isJam ? "rgba(255,60,60,0)" : "rgba(251,191,36,0)";
    grad.addColorStop(0, coreColor);
    grad.addColorStop(0.55, isJam ? "rgba(255,60,60,0.12)" : "rgba(251,191,36,0.10)");
    grad.addColorStop(1, edgeColor);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isJam ? "rgba(255,60,60,0.5)" : "rgba(251,191,36,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Node icons + labels
  EW_NODES.forEach(node => {
    const pos = _geoToPx(node.lat, node.lng, W, H);
    const isJam = node.mode === "JAM" || node.mode === "SPOOF";
    const color = isJam ? "#FF4444" : "#FBBA24";

    // Center dot
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Cross-hairs
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pos.x - 9, pos.y); ctx.lineTo(pos.x + 9, pos.y);
    ctx.moveTo(pos.x, pos.y - 9); ctx.lineTo(pos.x, pos.y + 9);
    ctx.stroke();

    // Label
    ctx.font = "bold 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(node.id, pos.x, pos.y - 13);
    ctx.font = "7px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`${node.mode} ${node.power}%`, pos.x, pos.y + 18);
  });

  // GPS coverage legend
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,60,60,0.8)";
  ctx.fillRect(10, H - 42, 10, 10);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("JAM / SPOOF zone", 26, H - 33);
  ctx.fillStyle = "rgba(251,191,36,0.8)";
  ctx.fillRect(10, H - 26, 10, 10);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("MONITOR / RELAY zone", 26, H - 17);

  // Spectrum integrity HUD
  ctx.textAlign = "right";
  ctx.font = "bold 9px 'JetBrains Mono', monospace";
  ctx.fillStyle = si > 70 ? "#38BDF8" : si > 45 ? "#FBBA24" : "#FF4444";
  ctx.fillText(`SPECTRUM ${si}%`, W - 10, H - 10);
}

function initGPSCanvas(container, state) {
  destroyGPSCanvas();
  const wrap = container.querySelector("#gps-canvas-mount");
  if (!wrap) return;
  wrap.innerHTML = "";
  const W = wrap.clientWidth || 520;
  const H = 280;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.style.cssText = "display:block;width:100%;height:100%";
  wrap.appendChild(canvas);
  _gpsCanvas = canvas;
  drawGPSZones(canvas, state);
}

function destroyGPSCanvas() {
  if (_gpsCanvas?.parentNode) _gpsCanvas.parentNode.removeChild(_gpsCanvas);
  _gpsCanvas = null;
}

export function cleanup() {
  if (_container && _onClick) {
    _container.removeEventListener("click", _onClick);
  }
  destroyGPSCanvas();
  _container = null;
  _onClick = null;
}

const SPECTRUM_CHANNELS = [
  { id: "uplink",    label: "Uplink",     base: 78 },
  { id: "jam-watch", label: "Jam-Watch",  base: 83 },
  { id: "handoff",   label: "Handoff",    base: 88 }
];

function channelHealth(base, spectrumIntegrity) {
  return Math.round(base * (spectrumIntegrity / 100));
}

function html(state) {
  const drill = state.drillDown["electronic-warfare"] ?? { panel: "overview", selectedNodeId: null };
  const screens = getScreensForModule("electronic-warfare");
  const si = state.system.spectrumIntegrity;
  const chain = getCausalChainSummary(state);

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Electronic Warfare / W${state.system.week}</div>
        <h2>Spectrum Operations</h2>
        <p>Monitor spectrum integrity, jamming overlays, GPS denial zones. Apply "sig2" directive in War Room to degrade spectrum.</p>
      </div>
      <div class="hero-panel">
        <span class="chip ${si > 70 ? "chip-cyan" : si > 45 ? "chip-amber" : "chip-red"}">SPECTRUM ${si}%</span>
        <span class="chip ${chain.sensorConfidence > 70 ? "chip-cyan" : "chip-amber"}">SENSOR ${chain.sensorConfidence}%</span>
        <span class="chip chip-amber">THREAT ${state.system.threat}</span>
      </div>
    </div>

    <div class="workspace-grid" style="margin-bottom:12px">
      <section class="panel panel-large">
        <div class="panel-head">
          <div><div class="node-kicker">EW Terminal</div><h3>Spectrum Dominance</h3></div>
          <span class="chip ${si > 70 ? "chip-cyan" : "chip-amber"}">${si}% integrity</span>
        </div>

        <div class="segmented">
          ${["overview","spectrum","nodes","gps-denial"].map(p => `
            <button class="${drill.panel === p ? "segment-active" : ""}" data-ew-panel="${p}">${p}</button>
          `).join("")}
        </div>

        <div style="margin-top:16px">
          ${drill.panel === "spectrum" ? `
            <div class="grid gap-3" style="margin-bottom:12px;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
              ${SPECTRUM_CHANNELS.map(ch => {
                const health = channelHealth(ch.base, si);
                return `
                  <div class="data-card">
                    <div class="node-kicker">${ch.id}</div>
                    <div class="mt-2 data-sm ${health > 70 ? "text-cyan" : health > 50 ? "text-amber" : "text-red"}">${health}% integrity</div>
                    <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-top:8px">
                      <div style="height:100%;width:${health}%;background:${health > 70 ? "#0EA5E9" : "#ffba20"};transition:width 0.5s"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
            <div class="data-card" style="margin-top:8px">
              <div class="node-kicker">Composite Spectrum Integrity</div>
              <div class="metric-value ${si > 70 ? "text-cyan" : si > 45 ? "text-amber" : "text-red"}" style="font-size:3rem;margin-top:8px">${si}<span>%</span></div>
              <div class="data-sm text-muted" style="margin-top:8px">Sensor confidence ${chain.sensorConfidence}% / ISR certainty ${chain.orbitalISRCertainty}%.</div>
              <button class="primary-action mt-4" data-ew-jam="EW-NODE-12" data-ew-intensity="72">Trigger Jamming Event</button>
            </div>
          ` : drill.panel === "nodes" ? `
            <div class="grid gap-3">
              ${EW_NODES.map(n => {
                const active = drill.selectedNodeId === n.id;
                return `
                  <button class="target-card ${active ? "target-card-active" : ""}" data-ew-node="${n.id}">
                    ${active ? '<span class="neon-line"></span>' : ""}
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="node-kicker">${n.band} — ${n.mode}</div>
                        <div class="node-title">${n.id}</div>
                      </div>
                      <span class="chip ${n.status === "nominal" ? "chip-cyan" : "chip-amber"}">${n.status}</span>
                    </div>
                    <dl class="mt-3 data-stack">
                      <div><dt>Power</dt><dd>${n.power}%</dd></div>
                      <div><dt>Mode</dt><dd>${n.mode}</dd></div>
                    </dl>
                  </button>
                `;
              }).join("")}
            </div>
          ` : drill.panel === "gps-denial" ? `
            <div class="data-card" style="border-color:rgba(255,77,77,0.2)">
              <div class="panel-head" style="margin-bottom:8px">
                <div><div class="node-kicker">GPS Denial Model</div><h3>Jamming Coverage</h3></div>
                <span class="chip ${si > 70 ? "chip-cyan" : si > 45 ? "chip-amber" : "chip-red"}">SI ${si}%</span>
              </div>
              <p class="data-sm text-muted" style="margin-bottom:10px;line-height:1.5">
                Radial denial zones over Gulf theater. Zone radius scales with node power × spectrum integrity.
                Apply <strong class="text-amber">sig2</strong> in War Room to degrade spectrum and shrink US jamming coverage.
              </p>
              <div id="gps-canvas-mount" style="width:100%;height:280px;background:rgba(6,9,14,0.8);border:1px solid rgba(255,77,77,0.15);border-radius:4px;overflow:hidden"></div>
              <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">
                ${EW_NODES.map(n => `
                  <span class="data-sm" style="color:${n.mode==="JAM"||n.mode==="SPOOF"?"#FF4444":"#FBBA24"}">● ${n.id} (${n.mode})</span>
                `).join("")}
              </div>
            </div>
          ` : `
            <!-- Overview: sensor lattice -->
            <div class="terminal-frame">
              <div class="terminal-frame-head">
                <div><div class="node-kicker">EW Sensor Lattice</div><h2 class="terminal-title">Signal Sweep</h2></div>
                <span class="chip chip-cyan">${si}% clean</span>
              </div>
              <div class="sensor-map" style="margin-top:16px">
                <div class="sensor-grid"></div>
                ${EW_NODES.map((n, i) => `
                  <button class="map-node map-node-${i + 1} ${drill.selectedNodeId === n.id ? "map-node-active" : ""}"
                    data-ew-node="${n.id}" title="${n.id}">
                    <span></span>
                  </button>
                `).join("")}
                <svg class="map-lines" viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M18 30 C35 12 57 16 72 28" />
                  <path d="M22 76 C45 52 58 65 83 46" />
                  <path class="danger" d="M36 42 C48 50 62 50 76 64" />
                </svg>
              </div>
              <div class="data-card" style="margin-top:12px;border-color:rgba(255,186,32,0.2)">
                <div class="node-kicker">Flagship Chain</div>
                <div class="mt-2 data-sm text-muted">
                  Jamming ${chain.ewJammingActive ? "active" : "idle"} / sensor ${chain.sensorConfidence}% / escalation ${chain.escalationProbability}%
                </div>
                <button class="primary-action mt-4" data-ew-jam="EW-NODE-12" data-ew-intensity="72">Trigger Jamming Event</button>
              </div>
            </div>
          `}
        </div>
      </section>

      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">EW Screens</div><h3>Navigation</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}" data-ew-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1 truncate text-ink">${s.title}</span>
            </button>
          `).join("")}
        </div>

        <!-- Spectrum summary -->
        <div style="margin-top:16px">
          <div class="node-kicker" style="margin-bottom:8px">Channel Health</div>
          ${SPECTRUM_CHANNELS.map(ch => {
            const health = channelHealth(ch.base, si);
            return `
              <div style="margin-bottom:10px">
                <div class="flex items-center justify-between gap-3" style="margin-bottom:4px">
                  <span class="data-sm text-muted">${ch.label}</span>
                  <span class="data-sm ${health > 70 ? "text-cyan" : "text-amber"}">${health}%</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${health}%;background:${health > 70 ? "#0EA5E9" : "#ffba20"};transition:width 0.5s"></div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

export function mount(container, state, dispatch) {
  cleanup();
  container.innerHTML = html(state);

  const drill = state.drillDown["electronic-warfare"] ?? { panel: "overview" };
  if (drill.panel === "gps-denial") initGPSCanvas(container, state);

  function onClick(e) {
    const panelBtn = e.target.closest("[data-ew-panel]");
    if (panelBtn) { dispatch(updateDrillDownState, "electronic-warfare", { panel: panelBtn.dataset.ewPanel }); return; }
    const nodeBtn = e.target.closest("[data-ew-node]");
    if (nodeBtn) { dispatch(updateDrillDownState, "electronic-warfare", { selectedNodeId: nodeBtn.dataset.ewNode }); return; }
    const jamBtn = e.target.closest("[data-ew-jam]");
    if (jamBtn) {
      dispatch(initiateEWJammingEvent, {
        source: jamBtn.dataset.ewJam,
        intensity: Number(jamBtn.dataset.ewIntensity ?? 72)
      });
      return;
    }
    const screenBtn = e.target.closest("[data-ew-screen]");
    if (screenBtn) {
      const screenId = screenBtn.dataset.ewScreen;
      const screens = getScreensForModule("electronic-warfare");
      const screen = screens.find(s => s.screenId === screenId);
      const suffix = screen?.route.split("/").pop();
      dispatch(selectScreen, screenId);
      if (suffix === "spectrum-map") dispatch(updateDrillDownState, "electronic-warfare", { panel: "spectrum" });
    }
  }

  container.addEventListener("click", onClick);
  _container = container;
  _onClick = onClick;
  return cleanup;
}

export function update(container, state) {
  const drill = state.drillDown["electronic-warfare"] ?? { panel: "overview" };

  if (drill.panel === "gps-denial" && _gpsCanvas) {
    // Canvas alive — redraw with updated state (spectrum may have changed)
    drawGPSZones(_gpsCanvas, state);
    // Patch spectrum integrity chip in panel head
    const chip = container.querySelector(".hero-panel .chip:first-child");
    if (chip) {
      const si = state.system.spectrumIntegrity;
      chip.textContent = `SPECTRUM ${si}%`;
      chip.className = `chip ${si > 70 ? "chip-cyan" : si > 45 ? "chip-amber" : "chip-red"}`;
    }
    return;
  }

  // Full re-render (covers panel switches and non-canvas panels)
  destroyGPSCanvas();
  container.innerHTML = html(state);
  if (drill.panel === "gps-denial") initGPSCanvas(container, state);
}
