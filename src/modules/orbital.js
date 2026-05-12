/**
 * Orbital module — Phase 3: Leaflet 2D theater map + existing sub-panels.
 *
 * Overview panel replaced with CartoDB DarkMatter theater map showing
 * real Gulf/Hormuz geospatial assets from THEATER_ASSETS.
 *
 * Canvas-safe pattern: _map ref guards innerHTML replacement.
 * Cleanup: map.remove() called in returned cleanup fn from mount().
 */

import {
  SIMULATION_ASSETS,
  THEATER_ASSETS,
  THEATER_BOUNDS,
  HORMUZ_ZOOM_BOUNDS,
  getCausalChainSummary,
  getScreensForModule,
  selectScreen,
  updateDrillDownState,
  validateAssetMappings
} from "../../hub-controller.js";

const ROUTE_SUFFIX_TO_PANEL = {
  "signal-intel":       "spectrum",
  "asset-tracking":     "assets",
  "telemetry":          "telemetry",
  "comms":              "briefing",
  "sensor-grid":        "overview",
  "orbital-theater-alt":"overview",
  "orbital-assets":     "assets",
  "satellite-detail":   "telemetry",
  "asset-zoom":         "assets"
};

function orbitalPanelFromRoute(route) {
  const suffix = route.split("/").pop();
  return ROUTE_SUFFIX_TO_PANEL[suffix] ?? null;
}

// ─── Leaflet map state ────────────────────────────────────────────────────────

let _map       = null;
let _markers   = {};
let _dispatch  = null;
let _container = null;
let _onClick   = null;

export function cleanup() {
  if (_container && _onClick) {
    _container.removeEventListener("click", _onClick);
  }
  if (_map) {
    _map.remove();
  }
  _map = null;
  _markers = {};
  _dispatch = null;
  _container = null;
  _onClick = null;
}

// Asset type → color mapping (tactical palette)
const TYPE_COLOR = {
  naval:      "#0EA5E9",
  base:       "#38BDF8",
  threat:     "#ff4d4d",
  chokepoint: "#ffba20",
  uav:        "#a78bfa"
};

function assetColor(asset, state) {
  if (asset.type === "threat") {
    const actors = state.system?.actors ?? {};
    if (asset.id.startsWith("BANDAR") || asset.id.startsWith("FORD") || asset.id.startsWith("NATANZ")) {
      const iran = actors.iran ?? 0.55;
      return iran > 0.72 ? "#ff2d2d" : iran > 0.50 ? "#ff6b35" : "#ff4d4d";
    }
    if (asset.id.startsWith("HOD") || asset.id.startsWith("SANAA")) {
      const h = actors.houthis ?? 0.42;
      return h > 0.60 ? "#ff2d2d" : "#ff6b35";
    }
  }
  return TYPE_COLOR[asset.type] ?? "#595f77";
}

function buildDivIcon(asset, state, selected) {
  const color = assetColor(asset, state);
  const ring  = selected ? `box-shadow:0 0 0 2px ${color},0 0 12px ${color}66;` : "";
  return window.L.divIcon({
    className: "",
    iconSize:  [28, 28],
    iconAnchor:[14, 14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:rgba(6,9,14,0.85);
      border:1.5px solid ${color};
      display:flex;align-items:center;justify-content:center;
      ${ring}
      transition:box-shadow 0.2s;
    ">
      <span class="material-symbols-outlined" style="font-size:13px;color:${color};user-select:none">${asset.icon}</span>
    </div>`
  });
}

function initMap(container, state) {
  if (_map) {
    _map.remove();
    _map = null;
    _markers = {};
  }
  if (!window.L) return;

  const mapEl = container.querySelector("#theater-map-mount");
  if (!mapEl) return;

  _map = window.L.map(mapEl, {
    zoomControl: true,
    attributionControl: false
  });

  window.L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { subdomains: "abcd", maxZoom: 15 }
  ).addTo(_map);

  _map.fitBounds(THEATER_BOUNDS);

  const drillSelected = state.drillDown?.["orbital"]?.selectedNodeId ?? null;

  // Shipping lanes (simplified great-circle approximations)
  const LANES = [
    // Hormuz transit
    [[26.6, 56.4], [24.5, 58.0], [22.0, 60.5]],
    // Red Sea / Bab-el-Mandeb
    [[12.6, 43.4], [15.0, 42.0], [20.0, 38.5]],
    // Gulf to Indian Ocean
    [[24.0, 58.5], [21.0, 62.0], [17.0, 65.0]]
  ];

  for (const lane of LANES) {
    window.L.polyline(lane, {
      color: "rgba(14,165,233,0.18)",
      weight: 1.5,
      dashArray: "6 6"
    }).addTo(_map);
  }

  // Hormuz strait zone
  window.L.rectangle(HORMUZ_ZOOM_BOUNDS, {
    color: "#ffba20",
    weight: 1,
    fillColor: "#ffba20",
    fillOpacity: 0.05,
    dashArray: "4 4"
  }).addTo(_map);

  // Asset markers
  _markers = {};
  for (const asset of THEATER_ASSETS) {
    const selected = asset.id === drillSelected;
    const marker = window.L.marker([asset.lat, asset.lng], {
      icon: buildDivIcon(asset, state, selected)
    }).addTo(_map);

    marker.bindTooltip(asset.label, {
      direction: "top",
      offset: [0, -14],
      className: "theater-tooltip"
    });

    marker.on("click", () => {
      if (_dispatch) {
        _dispatch(updateDrillDownState, "orbital", { selectedNodeId: asset.id });
      }
    });

    _markers[asset.id] = marker;
  }
}

function patchMap(state) {
  if (!_map || !window.L) return;
  const drillSelected = state.drillDown?.["orbital"]?.selectedNodeId ?? null;
  for (const asset of THEATER_ASSETS) {
    const m = _markers[asset.id];
    if (!m) continue;
    m.setIcon(buildDivIcon(asset, state, asset.id === drillSelected));
  }
}

function selectedAssetHTML(state) {
  const id    = state.drillDown?.["orbital"]?.selectedNodeId ?? null;
  const asset = id ? THEATER_ASSETS.find(a => a.id === id) : null;
  if (!asset) return "";
  const color = assetColor(asset, state);
  return `
    <div class="data-card" style="border-color:${color}44;margin-top:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <span class="material-symbols-outlined" style="color:${color};font-size:16px">${asset.icon}</span>
        <span class="data-sm text-ink" style="font-weight:700">${asset.label}</span>
        <span class="chip" style="margin-left:auto;font-size:8px;color:${color};border-color:${color}66">${asset.type.toUpperCase()}</span>
      </div>
      <div class="data-sm text-muted">${asset.lat.toFixed(2)}°N ${asset.lng.toFixed(2)}°E · ID: ${asset.id}</div>
    </div>
  `;
}

// ─── Panel content ────────────────────────────────────────────────────────────

function panelOverview(state) {
  const chain = getCausalChainSummary(state);
  return `
    <style>
      #theater-map-mount { height:400px;border-radius:4px;border:1px solid rgba(34,48,68,1);overflow:hidden }
      .theater-tooltip { background:rgba(6,9,14,0.92)!important;border:1px solid rgba(14,165,233,0.4)!important;color:#cbd5e1!important;font-size:11px!important;font-family:'JetBrains Mono',monospace!important;padding:4px 8px!important;box-shadow:none!important }
      .theater-tooltip::before { display:none!important }
      .leaflet-control-zoom { border:1px solid rgba(34,48,68,0.9)!important;background:rgba(6,9,14,0.85)!important }
      .leaflet-control-zoom a { color:#38BDF8!important;background:transparent!important;border-color:rgba(34,48,68,0.6)!important }
      .leaflet-control-zoom a:hover { background:rgba(14,165,233,0.1)!important }
    </style>

    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
      <button class="primary-action" data-orb-map-zoom="theater" style="padding:5px 12px;font-size:10px">Full Theater</button>
      <button class="primary-action" data-orb-map-zoom="hormuz"  style="padding:5px 12px;font-size:10px">Hormuz Strait</button>
      <button class="primary-action" data-orb-map-zoom="redsea"  style="padding:5px 12px;font-size:10px">Red Sea / Bab-el-Mandeb</button>
    </div>

    <div id="theater-map-mount"></div>

    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">
      <span class="data-sm" style="color:#0EA5E9">● Naval CSG</span>
      <span class="data-sm" style="color:#38BDF8">● Air Base</span>
      <span class="data-sm" style="color:#ff4d4d">● Threat / Iran / Houthi</span>
      <span class="data-sm" style="color:#ffba20">● Chokepoint</span>
      <span class="data-sm" style="color:#a78bfa">● UAV Node</span>
    </div>

    <div id="theater-selected-info">${selectedAssetHTML(state)}</div>
    <div class="data-card" style="margin-top:12px;border-color:rgba(255,186,32,0.2)">
      <div class="node-kicker">ISR Certainty</div>
      <div class="metric-value ${chain.orbitalISRCertainty > 70 ? "text-cyan" : "text-amber"}" style="font-size:2rem;margin-top:6px">${chain.orbitalISRCertainty}<span>%</span></div>
      <div class="data-sm text-muted" style="margin-top:6px">
        Sensor confidence ${chain.sensorConfidence}% after EW pressure.
      </div>
    </div>
  `;
}

function panelContent(state) {
  const drill = state.drillDown["orbital"] ?? { panel: "overview", selectedNodeId: null };
  const panel = drill.panel;

  if (panel === "assets") {
    const report = validateAssetMappings();
    return `
      <div class="grid gap-3">
        ${Object.values(SIMULATION_ASSETS).map(asset => {
          const mapping = report.assets.find(a => a.id === asset.id);
          return `
            <div class="asset-row">
              <div>
                <div class="text-sm font-semibold text-ink">${asset.label}</div>
                <div class="mt-1 data-sm uppercase text-dim">${asset.scope}</div>
              </div>
              <div class="min-w-0 text-right data-sm text-muted">
                <div class="truncate">${asset.entry}</div>
                <div class="${mapping?.valid ? "text-green" : "text-red"}">${mapping?.valid ? "MAPPED" : "BROKEN"}</div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  if (panel === "spectrum") {
    return `
      <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));margin-bottom:12px">
        ${["uplink", "jam-watch", "handoff"].map((ch, i) => `
          <div class="data-card">
            <div class="node-kicker">${ch}</div>
            <div class="mt-2 data-sm text-cyan">${78 + i * 5}% integrity</div>
          </div>
        `).join("")}
      </div>
      <div class="data-card" style="margin-top:8px">
        <div class="node-kicker">Spectrum Integrity</div>
        <div class="metric-value text-cyan" style="font-size:2rem;margin-top:8px">${state.system.spectrumIntegrity}<span>%</span></div>
      </div>
    `;
  }

  if (panel === "telemetry") {
    const items = [
      ["Velocity",    "7.66 km/s",  "text-cyan"],
      ["Altitude",    "408 km",     "text-cyan"],
      ["Inclination", "51.6°",      "text-amber"],
      ["Period",      "92.68 min",  "text-ink"],
      ["Eccentricity","0.0003",     "text-muted"],
      ["Readiness",   `${state.system.readiness}%`, "text-green"]
    ];
    return `
      <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
        ${items.map(([label, value, tone]) => `
          <div class="data-card">
            <div class="node-kicker">${label}</div>
            <div class="mt-2 data-sm ${tone}">${value}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  if (panel === "briefing") {
    return `
      <div class="terminal-frame">
        <div class="terminal-frame-head">
          <div>
            <div class="node-kicker">Relay Status</div>
            <h2 class="terminal-title">SAT-LINK-7</h2>
          </div>
          <span class="chip chip-cyan">online</span>
        </div>
        <div class="grid gap-3 md:grid-cols-3 mt-4">
          <div class="data-card"><div class="node-kicker">Latency</div><div class="mt-2 data-sm text-cyan">42 ms</div></div>
          <div class="data-card"><div class="node-kicker">Channel</div><div class="mt-2 data-sm text-ink">HORZ-SEC-04</div></div>
          <div class="data-card"><div class="node-kicker">Last Protocol</div><div class="mt-2 data-sm text-amber">${state.threatMatrix.activeProtocolId ?? "none"}</div></div>
        </div>
        <div class="mt-4">
          ${state.system.log.slice(-5).reverse().map(e => `<div class="log-entry">${e}</div>`).join("")}
        </div>
      </div>
    `;
  }

  // Default: overview
  return panelOverview(state);
}

function html(state) {
  const drill = state.drillDown["orbital"] ?? { panel: "overview" };
  const screens = getScreensForModule("orbital");
  const chain = getCausalChainSummary(state);

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Orbital / W${state.system.week}</div>
        <h2>Theater Map &amp; Sensor Operations</h2>
        <p>Live theater map, asset tracking, telemetry, and encrypted relay.</p>
      </div>
      <div class="hero-panel">
        <span class="chip chip-cyan">spectrum ${state.system.spectrumIntegrity}%</span>
        <span class="chip ${chain.orbitalISRCertainty > 70 ? "chip-cyan" : "chip-amber"}">ISR ${chain.orbitalISRCertainty}%</span>
        <span class="chip chip-amber">W${state.system.week}</span>
      </div>
    </div>

    <div class="workspace-grid" style="margin-bottom:12px">
      <section class="panel panel-large">
        <div class="panel-head">
          <div><div class="node-kicker">Orbital Terminal</div><h3>Sensor Operations</h3></div>
          <span class="chip chip-cyan">online</span>
        </div>
        <div class="segmented">
          ${["overview","telemetry","spectrum","assets","briefing"].map(p => `
            <button class="${drill.panel === p ? "segment-active" : ""}" data-orb-panel="${p}">${p}</button>
          `).join("")}
        </div>
        <div style="margin-top:16px">${panelContent(state)}</div>
      </section>

      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">Orbital Screens</div><h3>Navigation</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}" data-orb-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-ink">${s.title}</span>
              </span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// ─── Module exports ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  cleanup();
  _dispatch = dispatch;

  container.innerHTML = html(state);

  const panel = state.drillDown?.["orbital"]?.panel ?? "overview";
  if (panel === "overview") {
    initMap(container, state);
  }

  function onClick(e) {
    const panelBtn = e.target.closest("[data-orb-panel]");
    if (panelBtn) {
      dispatch(updateDrillDownState, "orbital", { panel: panelBtn.dataset.orbPanel });
      return;
    }

    const zoomBtn = e.target.closest("[data-orb-map-zoom]");
    if (zoomBtn && _map) {
      const zone = zoomBtn.dataset.orbMapZoom;
      if (zone === "hormuz") {
        _map.flyToBounds(HORMUZ_ZOOM_BOUNDS, { duration: 1.2, easeLinearity: 0.35 });
      } else if (zone === "redsea") {
        _map.flyToBounds([[10, 38], [18, 47]], { duration: 1.2, easeLinearity: 0.35 });
      } else {
        _map.flyToBounds(THEATER_BOUNDS, { duration: 1.2, easeLinearity: 0.35 });
      }
      return;
    }

    const screenBtn = e.target.closest("[data-orb-screen]");
    if (screenBtn) {
      const screenId = screenBtn.dataset.orbScreen;
      const screens = getScreensForModule("orbital");
      const screen = screens.find(s => s.screenId === screenId);
      const panel = screen ? orbitalPanelFromRoute(screen.route) : null;
      dispatch(selectScreen, screenId);
      if (panel) dispatch(updateDrillDownState, "orbital", { panel });
    }
  }

  container.addEventListener("click", onClick);
  _container = container;
  _onClick = onClick;
  return cleanup;
}

export function update(container, state) {
  const panel = state.drillDown?.["orbital"]?.panel ?? "overview";

  if (panel === "overview") {
    if (_map) {
      // Map is alive — patch markers and selected info only, no innerHTML
      patchMap(state);
      const infoEl = container.querySelector("#theater-selected-info");
      if (infoEl) infoEl.innerHTML = selectedAssetHTML(state);
      // Patch tab active states
      container.querySelectorAll("[data-orb-panel]").forEach(btn => {
        btn.classList.toggle("segment-active", btn.dataset.orbPanel === "overview");
      });
      return;
    }
    // Map not yet created — full render then init
    container.innerHTML = html(state);
    initMap(container, state);
    return;
  }

  // Non-map panels
  if (_map) { _map.remove(); _map = null; _markers = {}; }
  container.innerHTML = html(state);
}
