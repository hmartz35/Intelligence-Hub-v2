export const STITCH_PROJECT = Object.freeze({
  id: "5470778299556296098",
  name: "projects/5470778299556296098",
  title: "Orbital Command Center UI",
  updatedAt: "2026-05-01T06:37:13.206638Z",
  source: "Live Stitch MCP production sync",
  homeScreenId: "68817393c07c4e0baa7344d5b0281c9f",
  screenCount: 55
});

export const COMMAND_CENTER_PATHS = Object.freeze({
  root: "command-center",
  baseRoute: "/command-center",
  assets: "command-center/assets",
  simulations: "command-center/simulations",
  nasa: "command-center/simulations/nasa",
  hormuz: "command-center/simulations/hormuz",
  stitchSnapshots: "command-center/stitch-snapshots"
});

export const SIMULATION_ASSETS = Object.freeze({
  nasa: {
    id: "legacy-nasa-planetary",
    scope: "legacy-nasa",
    label: "NASA Orbital Simulation Assets",
    entry: "command-center/simulations/nasa/index.js",
    manifest: "command-center/simulations/nasa/manifest.json",
    assetRoot: "command-center/assets/legacy/nasa",
    route: "/command-center/simulations/nasa"
  },
  hormuz: {
    id: "legacy-hormuz-escalation",
    scope: "legacy-hormuz",
    label: "Hormuz Escalation Simulation Assets",
    entry: "command-center/simulations/hormuz/index.js",
    manifest: "command-center/simulations/hormuz/manifest.json",
    assetRoot: "command-center/assets/legacy/hormuz",
    route: "/command-center/simulations/hormuz"
  },
  stitch: {
    id: "stitch-final-canvas",
    scope: "live-stitch",
    label: "Final Tactical Operations Command Canvas",
    entry: "command-center/stitch-snapshots/final-canvas.json",
    manifest: "command-center/stitch-snapshots/routes.json",
    assetRoot: "command-center/assets/stitch",
    route: "/command-center"
  }
});

export const TACTICAL_THEME = Object.freeze({
  colors: {
    void: "#06090E",
    background: "#0d131f",
    surfaceLowest: "#080e1a",
    surfaceLow: "#161c27",
    surface: "#1a202c",
    surfaceHigh: "#242a36",
    surfaceHighest: "#2f3542",
    onSurface: "#dde2f3",
    onSurfaceVariant: "#bec7d4",
    outline: "#88919d",
    outlineVariant: "#3f4852",
    commandBlue: "#00A3FF",
    primary: "#98cbff",
    secondary: "#67d4f9",
    amber: "#ffba20",
    critical: "#ff4d4d",
    peach: "#ffb186"
  },
  typography: {
    body: "Inter",
    display: "Instrument Serif",
    data: "JetBrains Mono",
    label: "Space Grotesk"
  },
  effects: {
    glassBlur: "16px",
    thinFilmBorder: "1px solid rgba(255,255,255,.10)",
    commandGlow: "0 0 18px rgba(0,163,255,.28)",
    criticalGlow: "0 0 18px rgba(255,77,77,.30)",
    scanlineOpacity: 0.2
  }
});

const SCREEN_ROWS = [
  ["68817393c07c4e0baa7344d5b0281c9f", "/", "Orbital Theater", "overview", "public"],
  ["e3b78e18fc844b70907ad0078ce8392b", "/overview-secondary", "Overview Secondary", "overview", "grid_view"],
  ["4b325f3822e448729fe3362c6466c2df", "/mission-control", "Mission Control", "overview", "shield"],
  ["731f7b1abe384585bdc4d22663cb1691", "/intel-feed", "Intel Feed", "overview", "stream"],
  ["320dd64e9d634714be2775ac99ce589f", "/operator-console", "Operator Console", "overview", "terminal"],
  ["43e1e6c25204477ca9b5e2f5307a53f4", "/simulation-clock", "Simulation Clock", "overview", "schedule"],
  ["5743983f1fea46ab8bb3d037536dfaeb", "/tactical-overview", "Tactical Overview", "overview", "dashboard"],
  ["f84152cc92984561b02d4f5ecc5b9d9a", "/data-vault", "Data Vault", "overview", "database"],
  ["aa636b4d3b0d4ce7b23341fbd730c925", "/system-health", "System Health", "overview", "monitor_heart"],
  ["2dadbe7cb9284c94904ac5b893007a29", "/planetary-index", "Planetary Index", "planets", "travel_explore"],
  ["a89c8aee7f4141d2a62318e54eef1543", "/earth-layer", "Earth Layer", "planets", "public"],
  ["8b50bbbb4699491293d6bee193b1854f", "/mars-layer", "Mars Layer", "planets", "orbit"],
  ["6b79e4ec719b43afbd94e9cb87b875ba", "/deep-space", "Deep Space", "planets", "rocket_launch"],
  ["12cb09361c99488481f50258d6eec0ac", "/planetary-comparison", "Planetary Comparison", "planets", "query_stats"],
  ["e9fea1b70ab8442f8d8cae4ced6ce605", "/mercury-venus", "Inner Planet Layer", "planets", "radio_button_checked"],
  ["7450b3af58e64c758271dd314132d0e5", "/outer-planets", "Outer Planet Layer", "planets", "trip_origin"],
  ["f43d274175044608a685d2d0de7c7d76", "/weapons-systems", "Weapons Systems Explorer", "war-room", "target"],
  ["87bde3d47be94b5392ab335ec86cfd46", "/threat-matrix", "Threat Matrix", "war-room", "warning"],
  ["057b367853ca4624a739649135dec936", "/readiness", "Readiness Layer", "war-room", "speed"],
  ["de9fb7397dfe4e5e8668347badd31b3c", "/strike-options", "Strike Options", "war-room", "gps_fixed"],
  ["c5e687eff1244be581784bf26758030c", "/causal-graph", "Causal Graph", "war-room", "hub"],
  ["c8ad86c3741a404db9b2ebc1a90a6b83", "/resource-board", "Resource Board", "war-room", "table_chart"],
  ["d63d7d0b770540d08904974e6c521469", "/alert-review", "Alert Review", "war-room", "priority_high"],
  ["cc9734b2a825437b9dee091bd8fdc62d", "/red-team", "Red Team", "war-room", "swords"],
  ["40ff18f57f4745a28c54ded1c6b4366e", "/blue-team", "Blue Team", "war-room", "verified_user"],
  ["359d68da5e5541f1b64f8fb629590511", "/orbital-theater-alt", "Orbital Theater HUD", "orbital", "satellite_alt"],
  ["e3c603dbe52d49e89822b3c8adbab77a", "/signal-intel", "Signal Intelligence", "orbital", "radar"],
  ["44bccb7dfe5d4c5d85b1d0764bdf4d6e", "/asset-tracking", "Asset Tracking", "orbital", "satellite"],
  ["df6791a8bf864ef8aad0c69e172ce834", "/telemetry", "Telemetry", "orbital", "monitoring"],
  ["1d665a31a663440d8ddfba2ebab2b4dd", "/orbital-assets", "Orbital Assets", "orbital", "deployed_code"],
  ["fac5343526644a31862ea3ebaac2714a", "/satellite-detail", "Satellite Detail", "orbital", "settings_input_antenna"],
  ["69b8e3c7a8e84d1a8464cb1f2f7f18fa", "/comms", "Comms", "orbital", "cell_tower"],
  ["bd45c822217c4e54bbc295b4322a29c8", "/sensor-grid", "Sensor Grid", "orbital", "sensors"],
  ["aedfaef5a6704d449c5b5fea63989375", "/asset-zoom", "Asset Zoom", "orbital", "zoom_in_map"],
  ["f49077c7325e4d9185bef87e127c15df", "/uav-intelligence-terminal", "UAV Intelligence Terminal", "drone-swarm", "flight"],
  ["5a41dc1d8c9940709c3babe0cdd87e95", "/theater-analysis", "Theater Analysis", "drone-swarm", "analytics"],
  ["0ef7fc4ccd5e4fd8b7444f2d02e05a8e", "/theater-zoom", "Theater Zoom", "drone-swarm", "pageview"],
  ["7bec89e5e9154527a1f1e2c713ec0b1c", "/swarm-control", "Swarm Control", "drone-swarm", "share_location"],
  ["e1b5320655834a57a5cf35890eeb732f", "/escalation-ladder", "Escalation Ladder", "hormuz-escalation", "stacked_line_chart"],
  ["9e7e6a620712440aa4cc0916c9d4c307", "/hormuz-conflict-dashboard", "Strait of Hormuz Conflict Dashboard", "hormuz-escalation", "crisis_alert"],
  ["25ac4cf7be584e7d9f64d5bcbdd494bc", "/executive-briefing", "Executive Briefing", "executive-briefing", "article"],
  ["27e9032c17054bb18a5944861d4b6968", "/global-impact-report", "Global Impact Report", "executive-briefing", "summarize"],
  ["f5b9145d5c334bd7ae192067419375ba", "/briefing-collation", "Briefing Collation", "executive-briefing", "fact_check"],
  ["06b10d87fd27424f86a4f988f880374a", "/command-brief", "Command Brief", "executive-briefing", "description"],
  ["03168667882946edb63c7a5860ffb693", "/briefing-room", "Briefing Room", "executive-briefing", "meeting_room"],
  ["3ba1da716c8a4869881c46dc2d02707f", "/executive-view", "Executive View", "executive-briefing", "view_quilt"],
  ["291e9880b9154b429a9028aaa6aa286b", "/diplomatic-channel", "Diplomatic Channel", "executive-briefing", "handshake"],
  ["48c87c5119144b7d87ee614a7c74fa47", "/scenario-builder", "Scenario Builder", "executive-briefing", "architecture"],
  ["42739911ec754b1ba47d68c5c09c5a80", "/policy-brief", "Policy Brief", "executive-briefing", "policy"],
  ["6f4dcd8d0fa14d09b03ad4eee55c4d62", "/allied-posture", "Allied Posture", "executive-briefing", "groups"],
  ["185be5e0d0bd416c80d9a85a3005979d", "/mission-aftercare", "Mission Aftercare", "executive-briefing", "assignment_turned_in"],
  ["e4dc7588598f4ff0b2a4836e14dcacf6", "/archive", "Archive", "executive-briefing", "inventory_2"],
  ["e71068ec469f484da6f1a675db4fcb75", "/decision-log", "Decision Log", "executive-briefing", "history_edu"],
  ["e2b74446e52f463690b52918f6f6a5ef", "/final-brief", "Final Brief", "executive-briefing", "task_alt"],
  ["ba61424ae5b84ff4bae5058ac3a6a8d0", "/spectrum-map", "Spectrum Map", "electronic-warfare", "settings_input_antenna"]
];

export const STITCH_SCREENS = Object.freeze(SCREEN_ROWS.map(([screenId, route, title, layer, icon], index) => ({
  screenId,
  route: `${COMMAND_CENTER_PATHS.baseRoute}${route}`,
  title,
  layer,
  icon,
  sourceScreen: `projects/${STITCH_PROJECT.id}/screens/${screenId}`,
  status: index % 11 === 0 ? "critical" : index % 5 === 0 ? "watch" : "nominal"
})));

export const NAV_MODULES = Object.freeze([
  { id: "overview", label: "Overview", icon: "grid_view", objective: "Synthesize theater-wide readiness." },
  { id: "planets", label: "Planets", icon: "public", objective: "Bridge NASA orbital data into command simulations." },
  { id: "war-room", label: "War Room", icon: "warning", objective: "Run resource, strike, and escalation decisions." },
  { id: "orbital", label: "Orbital", icon: "satellite_alt", objective: "Track orbital assets, sensors, and telemetry." },
  { id: "drone-swarm", label: "Drone Swarm", icon: "flight", objective: "Coordinate UAV node drill-down and ISR tasking." },
  { id: "electronic-warfare", label: "EW", icon: "settings_input_antenna", objective: "Monitor spectrum, comms, jamming, and sensor denial." },
  { id: "hormuz-escalation", label: "Hormuz", icon: "crisis_alert", objective: "Model Strait of Hormuz escalation ladders." },
  { id: "executive-briefing", label: "Executive Briefing", icon: "article", objective: "Prepare decision-grade reports and briefing tools." }
]);

export const TERMINAL_HIERARCHY = Object.freeze({
  root: {
    id: "command-center",
    label: "Tactical Operations Command",
    route: COMMAND_CENTER_PATHS.baseRoute
  },
  terminals: NAV_MODULES.map((module) => ({
    ...module,
    route: `${COMMAND_CENTER_PATHS.baseRoute}/${module.id}`,
    screens: STITCH_SCREENS.filter((screen) => screen.layer === module.id).map((screen) => screen.screenId)
  }))
});

export const PLANETARY_DATA = Object.freeze([
  { name: "Mercury", diameterKm: 4879, orbitalPeriodDays: 88.0, gravityMs2: 3.7, source: "NASA Planetary Fact Sheet" },
  { name: "Venus", diameterKm: 12104, orbitalPeriodDays: 224.7, gravityMs2: 8.9, source: "NASA Planetary Fact Sheet" },
  { name: "Earth", diameterKm: 12756, orbitalPeriodDays: 365.2, gravityMs2: 9.8, source: "NASA Planetary Fact Sheet" },
  { name: "Mars", diameterKm: 6792, orbitalPeriodDays: 687.0, gravityMs2: 3.7, source: "NASA Planetary Fact Sheet" },
  { name: "Jupiter", diameterKm: 142984, orbitalPeriodDays: 4331, gravityMs2: 23.1, source: "NASA Planetary Fact Sheet" },
  { name: "Saturn", diameterKm: 120536, orbitalPeriodDays: 10747, gravityMs2: 9.0, source: "NASA Planetary Fact Sheet" },
  { name: "Uranus", diameterKm: 51118, orbitalPeriodDays: 30589, gravityMs2: 8.7, source: "NASA Planetary Fact Sheet" },
  { name: "Neptune", diameterKm: 49528, orbitalPeriodDays: 59800, gravityMs2: 11.0, source: "NASA Planetary Fact Sheet" }
]);

export const EXECUTIVE_BRIEFING_TOOLS = Object.freeze([
  { id: "impact-report", label: "Global Impact Report", motion: "briefing-slide-in", screenId: "27e9032c17054bb18a5944861d4b6968" },
  { id: "decision-log", label: "Decision Log", motion: "terminal-crossfade", screenId: "e71068ec469f484da6f1a675db4fcb75" },
  { id: "scenario-builder", label: "Scenario Builder", motion: "glass-lift", screenId: "48c87c5119144b7d87ee614a7c74fa47" },
  { id: "final-brief", label: "Final Brief", motion: "scan-reveal", screenId: "e2b74446e52f463690b52918f6f6a5ef" }
]);

const DIRECTIVES = Object.freeze({
  mil1: { label: "Raise orbital asset readiness", impact: 11, domain: "orbital" },
  dip3: { label: "Open allied diplomatic backchannel", impact: -6, domain: "executive-briefing" },
  sig2: { label: "Escalate signal-intelligence sweep", impact: 8, domain: "electronic-warfare" },
  drone5: { label: "Retask UAV swarm to maritime ISR", impact: 5, domain: "drone-swarm" },
  hormuz7: { label: "Advance Hormuz escalation ladder", impact: 14, domain: "hormuz-escalation" }
});

function seededNoise(seed, week, salt) {
  const x = Math.sin(seed + week * 997 + salt * 131) * 10000;
  return Math.floor((x - Math.floor(x)) * 9);
}

function defaultDrillDown() {
  return Object.fromEntries(NAV_MODULES.map((module) => [
    module.id,
    {
      panel: "overview",
      selectedNodeId: null,
      activeScreenId: STITCH_SCREENS.find((screen) => screen.layer === module.id)?.screenId ?? STITCH_PROJECT.homeScreenId,
      filters: {},
      scrollY: 0
    }
  ]));
}

export function createHubState(options = {}) {
  const activeModule = options.activeModule ?? "overview";
  const drillDown = {
    ...defaultDrillDown(),
    ...(options.drillDown ?? {})
  };

  return {
    activeModule,
    activeTerminal: activeModule,
    activeScreenId: drillDown[activeModule]?.activeScreenId ?? STITCH_PROJECT.homeScreenId,
    drillDown,
    terminalTransitions: [],
    system: {
      seed: options.seed ?? 0x5a17c0de,
      week: 1,
      readiness: 72,
      threat: 41,
      confidence: 86,
      spectrumIntegrity: 78,
      swarmCohesion: 83,
      hormuzEscalation: 46,
      log: [
        "Final Stitch canvas synced: Tactical Operations Command",
        "Command Center hierarchy initialized",
        "Persistent drill-down state online"
      ]
    }
  };
}

export function getScreensForModule(moduleId) {
  return STITCH_SCREENS.filter((screen) => screen.layer === moduleId);
}

export function setActiveModule(state, activeModule) {
  return transitionTerminal(state, activeModule, state.drillDown[activeModule]?.panel ?? "overview");
}

export function updateDrillDownState(state, terminalId, patch) {
  if (!NAV_MODULES.some((module) => module.id === terminalId)) {
    throw new RangeError(`Unknown terminal: ${terminalId}`);
  }
  return {
    ...state,
    drillDown: {
      ...state.drillDown,
      [terminalId]: {
        ...state.drillDown[terminalId],
        ...patch
      }
    }
  };
}

export function transitionTerminal(state, terminalId, panel = "overview") {
  if (!NAV_MODULES.some((module) => module.id === terminalId)) {
    throw new RangeError(`Unknown terminal transition: ${terminalId}`);
  }
  const currentDrill = state.drillDown[terminalId] ?? defaultDrillDown()[terminalId];
  const activeScreenId = currentDrill.activeScreenId ?? getScreensForModule(terminalId)[0]?.screenId ?? STITCH_PROJECT.homeScreenId;
  return {
    ...state,
    activeModule: terminalId,
    activeTerminal: terminalId,
    activeScreenId,
    drillDown: {
      ...state.drillDown,
      [terminalId]: {
        ...currentDrill,
        panel,
        activeScreenId
      }
    },
    terminalTransitions: [
      ...state.terminalTransitions,
      {
        from: state.activeTerminal,
        to: terminalId,
        panel,
        week: state.system.week
      }
    ]
  };
}

export function selectScreen(state, screenId) {
  const screen = STITCH_SCREENS.find((entry) => entry.screenId === screenId);
  if (!screen) {
    throw new RangeError(`Unknown Stitch screen: ${screenId}`);
  }
  return updateDrillDownState({
    ...state,
    activeModule: screen.layer,
    activeTerminal: screen.layer,
    activeScreenId: screen.screenId
  }, screen.layer, {
    activeScreenId: screen.screenId,
    selectedNodeId: screen.screenId
  });
}

export function advanceWarRoom(state, directiveIds = []) {
  const applied = directiveIds.map((id) => DIRECTIVES[id]).filter(Boolean);
  const week = state.system.week + 1;
  const impact = applied.reduce((total, directive) => total + directive.impact, 0);
  const noise = seededNoise(state.system.seed, week, applied.length);
  const threat = Math.max(0, Math.min(100, state.system.threat + impact + noise - 4));
  const hormuzEscalation = Math.max(0, Math.min(100, state.system.hormuzEscalation + (applied.some((item) => item.domain === "hormuz-escalation") ? 12 : 2)));

  return {
    ...state,
    activeModule: "war-room",
    activeTerminal: "war-room",
    system: {
      ...state.system,
      week,
      readiness: Math.max(0, Math.min(100, state.system.readiness + applied.length * 3 - Math.ceil(threat / 25))),
      threat,
      hormuzEscalation,
      spectrumIntegrity: Math.max(25, Math.min(100, state.system.spectrumIntegrity - (applied.some((item) => item.domain === "electronic-warfare") ? 7 : 1))),
      swarmCohesion: Math.max(35, Math.min(100, state.system.swarmCohesion + (applied.some((item) => item.domain === "drone-swarm") ? 4 : -1))),
      confidence: Math.max(45, Math.min(99, state.system.confidence + (threat > 60 ? -4 : 2))),
      log: [
        ...state.system.log,
        ...applied.map((directive) => `W${week}: ${directive.label}`),
        `W${week}: Threat ${threat} / Hormuz ${hormuzEscalation}`
      ]
    }
  };
}

export function getLayerSummary(state) {
  return NAV_MODULES.map((module) => {
    const screens = getScreensForModule(module.id);
    return {
      ...module,
      screenCount: screens.length,
      critical: screens.filter((screen) => screen.status === "critical").length,
      active: module.id === state.activeModule,
      panel: state.drillDown[module.id]?.panel ?? "overview"
    };
  });
}

export function validateAssetMappings() {
  const assets = Object.values(SIMULATION_ASSETS).map((asset) => ({
    id: asset.id,
    scope: asset.scope,
    entry: asset.entry,
    manifest: asset.manifest,
    mappedPath: asset.entry,
    route: asset.route,
    valid: asset.entry.startsWith(COMMAND_CENTER_PATHS.root) && asset.manifest.startsWith(COMMAND_CENTER_PATHS.root)
  }));
  return {
    valid: assets.every((asset) => asset.valid),
    assets
  };
}
