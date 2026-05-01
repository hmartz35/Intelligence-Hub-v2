import {
  advanceWarRoom,
  COMMAND_CENTER_PATHS,
  createHubState,
  EXECUTIVE_BRIEFING_TOOLS,
  getLayerSummary,
  getScreensForModule,
  NAV_MODULES,
  PLANETARY_DATA,
  selectScreen,
  SIMULATION_ASSETS,
  STITCH_PROJECT,
  STITCH_SCREENS,
  TACTICAL_THEME,
  transitionTerminal,
  updateDrillDownState,
  validateAssetMappings
} from "../hub-controller.js";

const STORAGE_KEY = "intelligence-hub.command-center.state";
const app = document.querySelector("#app");
const numberFormat = new Intl.NumberFormat("en-US");

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
      drillDown: {
        ...fresh.drillDown,
        ...(parsed.drillDown ?? {})
      },
      terminalTransitions: parsed.terminalTransitions ?? fresh.terminalTransitions,
      system: {
        ...fresh.system,
        ...parsed.system
      }
    };
  } catch {
    return createHubState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeScreen() {
  return STITCH_SCREENS.find((screen) => screen.screenId === state.activeScreenId) ?? STITCH_SCREENS[0];
}

function statusClass(status) {
  return {
    nominal: "chip chip-cyan",
    watch: "chip chip-amber",
    critical: "chip chip-red"
  }[status] ?? "chip chip-cyan";
}

function renderTerminalNav() {
  return NAV_MODULES.map((terminal) => {
    const active = terminal.id === state.activeTerminal ? "terminal-nav-active" : "";
    const count = getScreensForModule(terminal.id).length;
    return `
      <button class="terminal-nav ${active}" data-terminal="${terminal.id}">
        <span class="material-symbols-outlined text-[18px]">${terminal.icon}</span>
        <span class="min-w-0 flex-1 truncate">${terminal.label}</span>
        <span class="terminal-count">${count}</span>
      </button>
    `;
  }).join("");
}

function renderMetrics() {
  const metrics = [
    ["THREAT", state.system.threat, "IDX", state.system.threat > 62 ? "text-red" : "text-amber"],
    ["READINESS", state.system.readiness, "%", "text-cyan"],
    ["SWARM", state.system.swarmCohesion, "%", "text-green"],
    ["SPECTRUM", state.system.spectrumIntegrity, "%", "text-cyan"],
    ["HORMUZ", state.system.hormuzEscalation, "ESC", "text-red"],
    ["SCREENS", STITCH_SCREENS.length, "HTML", "text-ink"]
  ];

  return metrics.map(([label, value, suffix, tone]) => `
    <div class="metric-tile">
      <div class="metric-label">${label}</div>
      <div class="metric-value ${tone}">${value}<span>${suffix}</span></div>
    </div>
  `).join("");
}

function renderHierarchy() {
  return getLayerSummary(state).map((terminal) => `
    <button class="hierarchy-node ${terminal.active ? "hierarchy-node-active" : ""}" data-terminal="${terminal.id}">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="node-kicker">${terminal.id}</div>
          <div class="node-title">${terminal.label}</div>
        </div>
        <span class="material-symbols-outlined text-cyan">${terminal.icon}</span>
      </div>
      <p class="mt-3 text-xs leading-5 text-muted">${terminal.objective}</p>
      <div class="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase text-muted">
        <span>${terminal.screenCount} screens</span>
        <span>${terminal.critical} crit</span>
        <span>${terminal.panel}</span>
      </div>
    </button>
  `).join("");
}

function renderScreenRail() {
  return getScreensForModule(state.activeTerminal).map((screen) => `
    <button class="screen-row ${screen.screenId === state.activeScreenId ? "screen-row-active" : ""}" data-screen="${screen.screenId}">
      <span class="material-symbols-outlined text-[17px]">${screen.icon}</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-ink">${screen.title}</span>
        <span class="block truncate text-[10px] uppercase tracking-[.08em] text-dim">${screen.route}</span>
      </span>
      <span class="${statusClass(screen.status)}">${screen.status}</span>
    </button>
  `).join("");
}

function renderDrillDown() {
  const drill = state.drillDown[state.activeTerminal];
  const screen = activeScreen();
  const panels = ["overview", "telemetry", "spectrum", "assets", "briefing"];

  return `
    <div class="terminal-frame">
      <div class="terminal-frame-head">
        <div>
          <div class="node-kicker">${state.activeTerminal}</div>
          <h2 class="terminal-title">${screen.title}</h2>
        </div>
        <span class="${statusClass(screen.status)}">${screen.status}</span>
      </div>
      <div class="segmented">
        ${panels.map((panel) => `
          <button class="${drill.panel === panel ? "segment-active" : ""}" data-panel="${panel}">${panel}</button>
        `).join("")}
      </div>
      <div class="sensor-map">
        <div class="sensor-grid"></div>
        ${["UAV-RAVEN-03", "EW-NODE-12", "HORMUZ-LANE-A", "SAT-LINK-7"].map((node, index) => `
          <button
            class="map-node map-node-${index + 1} ${drill.selectedNodeId === node ? "map-node-active" : ""}"
            data-node="${node}"
            title="${node}"
          >
            <span></span>
          </button>
        `).join("")}
        <svg class="map-lines" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M18 30 C35 12 57 16 72 28" />
          <path d="M22 76 C45 52 58 65 83 46" />
          <path class="danger" d="M36 42 C48 50 62 50 76 64" />
        </svg>
      </div>
      <div class="mt-4 grid gap-3 md:grid-cols-3">
        <div class="data-card">
          <div class="node-kicker">Selected Node</div>
          <div class="mt-2 font-mono text-sm text-cyan">${drill.selectedNodeId ?? "NONE"}</div>
        </div>
        <div class="data-card">
          <div class="node-kicker">Terminal Panel</div>
          <div class="mt-2 font-mono text-sm text-ink">${drill.panel}</div>
        </div>
        <div class="data-card">
          <div class="node-kicker">Persistent Screen</div>
          <div class="mt-2 truncate font-mono text-sm text-amber">${screen.screenId}</div>
        </div>
      </div>
    </div>
  `;
}

function renderSimulations() {
  const report = validateAssetMappings();
  return Object.values(SIMULATION_ASSETS).map((asset) => {
    const mapping = report.assets.find((item) => item.id === asset.id);
    return `
      <div class="asset-row">
        <div>
          <div class="text-sm font-semibold text-ink">${asset.label}</div>
          <div class="mt-1 font-mono text-[10px] uppercase tracking-[.08em] text-dim">${asset.scope}</div>
        </div>
        <div class="min-w-0 text-right font-mono text-[10px] text-muted">
          <div class="truncate">${asset.entry}</div>
          <div class="${mapping?.valid ? "text-green" : "text-red"}">${mapping?.valid ? "MAPPED" : "BROKEN"}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderPlanetaryData() {
  return PLANETARY_DATA.map((planet) => `
    <div class="planet-row">
      <span class="font-semibold text-ink">${planet.name}</span>
      <span>${numberFormat.format(planet.diameterKm)} KM</span>
      <span>${numberFormat.format(planet.orbitalPeriodDays)} D</span>
      <span>${planet.gravityMs2} M/S2</span>
    </div>
  `).join("");
}

function renderBriefingTools() {
  return EXECUTIVE_BRIEFING_TOOLS.map((tool) => `
    <button class="briefing-tool" data-screen="${tool.screenId}">
      <span>${tool.label}</span>
      <span class="font-mono text-[10px] uppercase tracking-[.08em] text-cyan">${tool.motion}</span>
    </button>
  `).join("");
}

function renderLog() {
  return state.system.log.slice(-9).reverse().map((entry) => `
    <div class="log-entry">${entry}</div>
  `).join("");
}

function render() {
  const screen = activeScreen();

  app.innerHTML = `
    <div class="command-shell">
      <aside class="command-sidebar">
        <div class="brand-block">
          <div class="brand-line"><span></span>AETHER COMMAND</div>
          <h1>Tactical Operations Command</h1>
          <p>Final Stitch sync ${new Date(STITCH_PROJECT.updatedAt).toISOString()}</p>
        </div>
        <nav class="mt-5 grid gap-2">${renderTerminalNav()}</nav>
        <div class="mt-5 data-card">
          <div class="node-kicker">Command Center Root</div>
          <div class="mt-2 font-mono text-xs text-cyan">${COMMAND_CENTER_PATHS.root}</div>
          <div class="mt-3 grid grid-cols-6 gap-1">
            ${Object.values(TACTICAL_THEME.colors).slice(0, 12).map((color) => `<span class="swatch" style="background:${color}"></span>`).join("")}
          </div>
        </div>
      </aside>

      <main class="command-main">
        <header class="top-status">
          <span>SECURE / STRATCOM / HORZ-SEC-04</span>
          <span>${STITCH_PROJECT.source}</span>
          <span class="text-cyan">SYSTEM READY</span>
        </header>

        <section class="command-hero">
          <div class="hero-copy">
            <div class="node-kicker">Multi-Terminal Hierarchy / Live Canvas ${STITCH_PROJECT.id}</div>
            <h2>Command Center</h2>
            <p>
              Production tactical shell for Drone Swarm Intelligence, Electronic Warfare, Hormuz Escalation, orbital/NASA simulation layers, and Executive Briefing tools. Terminal transitions persist every drill-down panel, selected node, and screen route.
            </p>
          </div>
          <div class="hero-panel">
            <span class="chip chip-red">TOP SECRET</span>
            <span class="chip chip-cyan">${STITCH_SCREENS.length} screens</span>
            <span class="chip chip-amber">${screen.title}</span>
          </div>
        </section>

        <section class="metrics-grid">${renderMetrics()}</section>

        <section class="workspace-grid">
          <div class="panel panel-large">
            <div class="panel-head">
              <div>
                <div class="node-kicker">Terminal Drill-Down</div>
                <h3>${screen.title}</h3>
              </div>
              <button class="primary-action" data-advance="all">Advance Drill</button>
            </div>
            ${renderDrillDown()}
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <div class="node-kicker">Active Screen Rail</div>
                <h3>${state.activeTerminal}</h3>
              </div>
              <span class="chip chip-cyan">${getScreensForModule(state.activeTerminal).length}</span>
            </div>
            <div class="screen-list">${renderScreenRail()}</div>
          </div>
        </section>

        <section class="lower-grid">
          <div class="panel">
            <div class="panel-head">
              <div>
                <div class="node-kicker">Hierarchy Map</div>
                <h3>Multi-Terminal Stack</h3>
              </div>
            </div>
            <div class="hierarchy-grid">${renderHierarchy()}</div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <div class="node-kicker">Dependency Check</div>
                <h3>Simulation Paths</h3>
              </div>
            </div>
            <div class="grid gap-2">${renderSimulations()}</div>
          </div>
        </section>

        <section class="lower-grid">
          <div class="panel">
            <div class="panel-head">
              <div>
                <div class="node-kicker">NASA Simulation Data</div>
                <h3>Planetary Fact Sheet</h3>
              </div>
            </div>
            <div class="planet-table">${renderPlanetaryData()}</div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <div class="node-kicker">Executive Briefing Tools</div>
                <h3>Motion States</h3>
              </div>
            </div>
            <div class="grid gap-2">${renderBriefingTools()}</div>
            <div class="mt-4">${renderLog()}</div>
          </div>
        </section>
      </main>
    </div>
  `;
}

function commit(nextState) {
  state = nextState;
  persist();
  render();
}

app.addEventListener("click", (event) => {
  const terminal = event.target.closest("[data-terminal]");
  const screen = event.target.closest("[data-screen]");
  const panel = event.target.closest("[data-panel]");
  const node = event.target.closest("[data-node]");
  const advance = event.target.closest("[data-advance]");

  if (screen) {
    commit(selectScreen(state, screen.dataset.screen));
    return;
  }

  if (terminal) {
    commit(transitionTerminal(state, terminal.dataset.terminal, state.drillDown[terminal.dataset.terminal]?.panel ?? "overview"));
    return;
  }

  if (panel) {
    commit(updateDrillDownState(state, state.activeTerminal, { panel: panel.dataset.panel }));
    return;
  }

  if (node) {
    commit(updateDrillDownState(state, state.activeTerminal, { selectedNodeId: node.dataset.node }));
    return;
  }

  if (advance) {
    commit(advanceWarRoom(state, ["mil1", "sig2", "drone5", "hormuz7"]));
  }
});

render();
persist();
