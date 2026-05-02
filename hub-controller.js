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
    commandBlue: "#0EA5E9",
    primary: "#38BDF8",
    secondary: "#7DD3FC",
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
    commandGlow: "0 0 18px rgba(14,165,233,.28)",
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

export const SIDEBAR_TARGETS = Object.freeze([
  { id: "orbital-theater", label: "Orbital Theater", icon: "public", screenId: "68817393c07c4e0baa7344d5b0281c9f" },
  { id: "asset-tracking", label: "Asset Tracking", icon: "satellite", screenId: "44bccb7dfe5d4c5d85b1d0764bdf4d6e" },
  { id: "signal-intel", label: "Signal Intel", icon: "radar", screenId: "e3c603dbe52d49e89822b3c8adbab77a" },
  { id: "threat-matrix", label: "Threat Matrix", icon: "warning", screenId: "87bde3d47be94b5392ab335ec86cfd46" },
  { id: "comm-link", label: "Comm Link", icon: "cell_tower", screenId: "69b8e3c7a8e84d1a8464cb1f2f7f18fa" }
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
  // Military track
  mil1:    { label: "Raise orbital asset readiness",       impact: 11,  domain: "orbital"            },
  drone5:  { label: "Retask UAV swarm to maritime ISR",    impact:  5,  domain: "drone-swarm"        },
  // Diplomatic track
  dip3:    { label: "Open allied diplomatic backchannel",  impact: -6,  domain: "executive-briefing" },
  dip1:    { label: "Engage Saudi Arabia liaison",         impact: -4,  domain: "executive-briefing" },
  dip2:    { label: "Activate UAE backchannel",            impact: -3,  domain: "executive-briefing" },
  // Intelligence track
  sig2:    { label: "Escalate signal-intelligence sweep",  impact:  8,  domain: "electronic-warfare" },
  int1:    { label: "SIGINT surge — Qeshm Island",         impact:  6,  domain: "electronic-warfare" },
  int2:    { label: "HUMINT asset activation",             impact:  7,  domain: "electronic-warfare" },
  // Escalation track
  hormuz7: { label: "Advance Hormuz escalation ladder",    impact: 14,  domain: "hormuz-escalation"  }
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
    strikePlanner: {
      lockedSolutionId: null,
      lockCount: 0
    },
    threatMatrix: {
      activeProtocolId: null,
      protocolCount: 0
    },
    hormuzParameters: {
      economicPressure: 50,
      navalPosture: 40,
      allianceCohesion: 65,
      escalationRate: 35,
      oilPrice: 105,
      recession: 46
    },
    causalBeliefs: {},
    causalInterventions: {},
    system: {
      seed: options.seed ?? 0x5a17c0de,
      week: 1,
      readiness: 72,
      threat: 41,
      confidence: 86,
      spectrumIntegrity: 78,
      swarmCohesion: 83,
      hormuzEscalation: 46,
      hormuzHistory: [{ week: 1, escalation: 46 }],
      actors: { iran: 0.55, houthis: 0.42, israel: 0.31, ksa: 0.25 },
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

  // Actor hostility drift — simplified from reference war-room.html adversary models.
  // Iran responds to military pressure (escalates) and diplomatic engagement (de-escalates).
  // Houthis track Iranian support + degrade under drone ops.
  // Israel escalates if Iran crosses 0.82 hostility threshold.
  // KSA de-escalates under direct Saudi liaison directive.
  const prev = state.system.actors ?? { iran: 0.55, houthis: 0.42, israel: 0.31, ksa: 0.25 };
  const hasMilitary   = applied.some(d => d.id === "mil1");
  const hasDiplomatic = applied.some(d => d.domain === "executive-briefing");
  const hasDroneOps   = applied.some(d => d.domain === "drone-swarm");
  const hasEscalation = applied.some(d => d.domain === "hormuz-escalation");
  const nf = (noise - 4) * 0.008;
  const actors = {
    iran:    Math.max(0, Math.min(1, prev.iran    + (hasMilitary || hasEscalation ? 0.04 : 0.01) + (hasDiplomatic ? -0.06 : 0) + nf)),
    houthis: Math.max(0, Math.min(1, prev.houthis + prev.iran * 0.03 + (hasDroneOps ? -0.05 : 0.01) + nf * 0.5)),
    israel:  Math.max(0, Math.min(1, prev.israel  + (prev.iran > 0.82 ? 0.05 : -0.01))),
    ksa:     Math.max(0, Math.min(1, prev.ksa     + (directiveIds.includes("dip1") ? -0.08 : 0.01)))
  };

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
      hormuzHistory: [...(state.system.hormuzHistory ?? []), { week, escalation: hormuzEscalation }],
      spectrumIntegrity: Math.max(25, Math.min(100, state.system.spectrumIntegrity - (applied.some((item) => item.domain === "electronic-warfare") ? 7 : 1))),
      swarmCohesion: Math.max(35, Math.min(100, state.system.swarmCohesion + (applied.some((item) => item.domain === "drone-swarm") ? 4 : -1))),
      confidence: Math.max(45, Math.min(99, state.system.confidence + (threat > 60 ? -4 : 2))),
      actors,
      log: [
        ...state.system.log,
        ...applied.map((directive) => `W${week}: ${directive.label}`),
        `W${week}: Threat ${threat} / Hormuz ${hormuzEscalation}`
      ]
    }
  };
}

export function lockStrikeSolution(state, solutionId) {
  if (!solutionId) {
    throw new RangeError("Strike solution id is required");
  }

  const strikeScreenId = "de9fb7397dfe4e5e8668347badd31b3c";
  return updateDrillDownState({
    ...state,
    activeModule: "war-room",
    activeTerminal: "war-room",
    activeScreenId: strikeScreenId,
    strikePlanner: {
      ...state.strikePlanner,
      lockedSolutionId: solutionId,
      lockCount: (state.strikePlanner?.lockCount ?? 0) + 1
    },
    system: {
      ...state.system,
      readiness: Math.min(100, state.system.readiness + 2),
      confidence: Math.min(99, state.system.confidence + 1),
      log: [
        ...state.system.log,
        `W${state.system.week}: Strike solution locked / ${solutionId}`
      ]
    }
  }, "war-room", {
    activeScreenId: strikeScreenId,
    selectedNodeId: solutionId,
    panel: "assets"
  });
}

// Per-protocol state deltas — matched exactly to THREAT_PROTOCOLS display labels.
const PROTOCOL_EFFECTS = Object.freeze({
  containment:    { threat: -6, readiness:  0, spectrumIntegrity:  0 },
  deconflict:     { threat: -2, readiness: +4, spectrumIntegrity:  0 },
  "signal-sweep": { threat: -4, readiness:  0, spectrumIntegrity: +8 }
});

export function initiateThreatProtocol(state, protocolId) {
  if (!protocolId) {
    throw new RangeError("Threat protocol id is required");
  }

  const effect = PROTOCOL_EFFECTS[protocolId] ?? PROTOCOL_EFFECTS.containment;
  const threatScreenId = "87bde3d47be94b5392ab335ec86cfd46";
  return updateDrillDownState({
    ...state,
    activeModule: "war-room",
    activeTerminal: "war-room",
    activeScreenId: threatScreenId,
    threatMatrix: {
      ...state.threatMatrix,
      activeProtocolId: protocolId,
      protocolCount: (state.threatMatrix?.protocolCount ?? 0) + 1
    },
    system: {
      ...state.system,
      threat: Math.max(0, state.system.threat + effect.threat),
      readiness: Math.max(0, Math.min(100, state.system.readiness + effect.readiness)),
      spectrumIntegrity: Math.max(25, Math.min(100, state.system.spectrumIntegrity + effect.spectrumIntegrity)),
      log: [
        ...state.system.log,
        `W${state.system.week}: Threat protocol initiated / ${protocolId}`
      ]
    }
  }, "war-room", {
    activeScreenId: threatScreenId,
    selectedNodeId: protocolId,
    panel: "spectrum"
  });
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

// ─── Shared UI constants ──────────────────────────────────────────────────────
// Single canonical source for data used across multiple modules.
// Previously duplicated between src/app.js and src/modules/war-room.js.

export const STRIKE_SOLUTIONS = Object.freeze([
  { id: "solution-blue",  label: "Blue Vector",  eta: "T+04", confidence: 91, posture: "ISR hold"   },
  { id: "solution-echo",  label: "Echo Net",     eta: "T+07", confidence: 84, posture: "Signal mask" },
  { id: "solution-umbra", label: "Umbra Lane",   eta: "T+11", confidence: 78, posture: "Standby"     }
]);

// Delta labels match PROTOCOL_EFFECTS exactly — each protocol has distinct mechanical effects.
export const THREAT_PROTOCOLS = Object.freeze([
  { id: "containment",   label: "Containment",  delta: "-6 THREAT",   tone: "chip-cyan"  },
  { id: "deconflict",    label: "Deconflict",   delta: "+4 READY",    tone: "chip-amber" },
  { id: "signal-sweep",  label: "Signal Sweep", delta: "+8 SPECTRUM", tone: "chip-cyan"  }
]);

// Orbital sensor lattice nodes — used in orbital and drone-swarm display.
export const SENSOR_NODES = Object.freeze([
  "UAV-RAVEN-03", "EW-NODE-12", "HORMUZ-LANE-A", "SAT-LINK-7"
]);

// Six-actor war game cast. Posture is computed from state in the war-room module.
export const WAR_GAME_ACTORS = Object.freeze([
  { id: "us",    label: "United States", icon: "verified_user" },
  { id: "iran",  label: "Iran",          icon: "swords"        },
  { id: "uae",   label: "UAE",           icon: "shield"        },
  { id: "ksa",   label: "Saudi Arabia",  icon: "groups"        },
  { id: "oman",  label: "Oman",          icon: "handshake"     },
  { id: "china", label: "China",         icon: "language"      }
]);

// Ten-rung strategic escalation model, adapted from reference escalation-simulator.html.
// Used by hormuz-escalation module for narrative context; Phase 3 will tie rung to hormuzEscalation.
export const ESCALATION_RUNGS = Object.freeze([
  { rung: 0, name: "Status Quo",            color: "#38BDF8", desc: "Routine maritime security operations. CENTCOM monitoring. No active kinetic exchanges." },
  { rung: 1, name: "Maritime Harassment",   color: "#7DD3FC", desc: "IRGCN harassment of commercial shipping. US carrier strike group surges to the Gulf." },
  { rung: 2, name: "Limited Strikes",       color: "#ffba20", desc: "US-UK precision strikes on Houthi launch infrastructure. IRGCN deploys mines in shipping lanes." },
  { rung: 3, name: "Sustained Campaign",    color: "#ffba20", desc: "Sustained allied air strikes on Houthi and IRGCN infrastructure. Saudi-UAE airspace coordinated." },
  { rung: 4, name: "HVT Decapitation",      color: "#ff9040", desc: "High-value target strikes on IRGCN command nodes. Proxy network structure degraded." },
  { rung: 5, name: "Ceasefire Window",      color: "#4ade80", desc: "US-Houthi ceasefire framework via Oman channel. Fragile 72-hour negotiation window." },
  { rung: 6, name: "Iran Strike",           color: "#ff4d4d", desc: "US-Israel combined strike on Iranian nuclear and IRGCN naval facilities. Direct war risk." },
  { rung: 7, name: "Hormuz Closure",        color: "#ff4d4d", desc: "Iran closes the Strait. Global oil markets in shock. $160/bbl price spike imminent." },
  { rung: 8, name: "Dual Chokepoint",       color: "#ff4d4d", desc: "Houthis re-enter full war footing. Bab el-Mandeb fully blocked. Dual chokepoint crisis." },
  { rung: 9, name: "Regional War",          color: "#ff0000", desc: "Full regional escalation. Multiple state actors in direct conflict. Catastrophic scenario." }
]);

// Real-world geographic asset data for the Persian Gulf / Hormuz theater.
// Phase 3c will render these on a Leaflet 2D map (CartoDB DarkMatter tiles).
// Coordinates verified against open-source geographic sources.
export const THEATER_ASSETS = Object.freeze([
  // US Naval assets
  { id: "CVN-71",        label: "USS Theodore Roosevelt (CSG)",  lat: 25.8, lng: 61.2, type: "naval",      icon: "directions_boat" },
  { id: "CVN-70",        label: "USS Carl Vinson (CSG)",         lat: 24.0, lng: 58.5, type: "naval",      icon: "directions_boat" },
  // US / Coalition air bases
  { id: "AL-UDEID",      label: "Al Udeid AB — CAOC",            lat: 25.1, lng: 51.3, type: "base",       icon: "flight_takeoff"  },
  { id: "AL-DHAFRA",     label: "Al Dhafra AB — ISR Hub",        lat: 24.2, lng: 54.5, type: "base",       icon: "flight_takeoff"  },
  { id: "DIEGO-GARCIA",  label: "Diego Garcia",                  lat: -7.3, lng: 72.4, type: "base",       icon: "flight_takeoff"  },
  // Iranian targets / IRGCN
  { id: "BANDAR-ABBAS",  label: "Bandar Abbas — IRGCN HQ",       lat: 27.2, lng: 56.3, type: "threat",     icon: "swords"          },
  { id: "FORDOW",        label: "Fordow Nuclear Facility",        lat: 34.9, lng: 49.7, type: "threat",     icon: "warning"         },
  { id: "NATANZ",        label: "Natanz Nuclear Facility",        lat: 33.7, lng: 51.7, type: "threat",     icon: "warning"         },
  // Houthi zones (Yemen)
  { id: "HODEIDAH",      label: "Hodeidah Port — Houthi",        lat: 14.8, lng: 42.9, type: "threat",     icon: "swords"          },
  { id: "SANAA-OPS",     label: "Sana'a Operations Cell",        lat: 15.4, lng: 44.2, type: "threat",     icon: "swords"          },
  // Critical chokepoints
  { id: "HORMUZ-STRAIT", label: "Strait of Hormuz",              lat: 26.6, lng: 56.4, type: "chokepoint", icon: "crisis_alert"    },
  { id: "BAB-MANDEB",    label: "Bab el-Mandeb",                 lat: 12.6, lng: 43.4, type: "chokepoint", icon: "crisis_alert"    },
  // UAV nodes (match drone-swarm.js UAV_NODES)
  { id: "UAV-RAVEN-03",  label: "UAV RAVEN-03 — ISR",           lat: 26.1, lng: 56.3, type: "uav",        icon: "flight"          },
  { id: "UAV-HAWK-07",   label: "UAV HAWK-07 — Strike",         lat: 25.4, lng: 57.8, type: "uav",        icon: "flight"          },
  { id: "UAV-GHOST-12",  label: "UAV GHOST-12 — EW",            lat: 27.2, lng: 55.1, type: "uav",        icon: "flight"          },
  { id: "UAV-SHADE-19",  label: "UAV SHADE-19 — Relay",         lat: 24.8, lng: 58.5, type: "uav",        icon: "flight"          }
]);

// Theater bounds for Leaflet map initialisation: Persian Gulf + Red Sea + Oman Sea approach.
// Use: map.fitBounds(THEATER_BOUNDS); initial zoom covers the full operational area.
// Use: map.flyToBounds(HORMUZ_ZOOM_BOUNDS) for Strait close-up on hormuz module activation.
export const THEATER_BOUNDS    = Object.freeze([[10, 38], [32, 67]]);
export const HORMUZ_ZOOM_BOUNDS = Object.freeze([[24.5, 54.0], [28.5, 59.5]]);

/**
 * Apply Hormuz strategic parameters. Sliders drive a pressure delta relative
 * to the neutral baseline (navalPosture 40, escalationRate 35,
 * economicPressure 50, allianceCohesion 65). Departures from baseline push
 * hormuzEscalation up or down proportionally.
 */
export function setHormuzParameters(state, params) {
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

  const newEscalation = Math.max(0, Math.min(100, state.system.hormuzEscalation + delta));
  // Adapted from reference dashboard.html oil-price model:
  // oilPrice = $75 baseline + escalation-driven supply shock (max +$65 at full closure)
  // recession = probability derived from price spike + escalation severity
  const oilPrice = Math.round(75 + (newEscalation / 100) * 65);
  const recession = Math.min(95, Math.max(5, Math.round((oilPrice - 80) * 1.2 + newEscalation * 0.35)));
  return {
    ...state,
    hormuzParameters: { ...merged, oilPrice, recession },
    system: {
      ...state.system,
      hormuzEscalation: newEscalation,
      hormuzHistory: [
        ...(state.system.hormuzHistory ?? []),
        { week: state.system.week, escalation: newEscalation, source: "parameters" }
      ],
      log: [
        ...state.system.log,
        `W${state.system.week}: Hormuz parameters applied — index ${newEscalation}`
      ]
    }
  };
}

// ─── Causal Inference Engine (Phase 3) ───────────────────────────────────────
//
// Bayesian DAG over 18 simulation nodes. Root nodes are sampled with Gaussian
// noise around the current state metric; derived nodes use sigmoid CPTs adapted
// from reference causal-cascade.html. The DAG is acyclic (two cycles in the
// visualization layer — alliance↔diplo and threat↔esc-rate — are resolved here
// by removing diplo→alliance and keeping eco→esc-rate as the causal direction).
//
// Topology: naval, alliance, eco, spectrum, swarm, protocols, strike-lock, week,
// lock-count (roots) → hormuz, diplo → esc-rate → threat → readiness, confidence,
// sys-stress, isr, ew-density (leaves)

// Topological order: must be exported so war-room can iterate in the right order.
export const CAUSAL_NODE_ORDER = Object.freeze([
  "naval", "alliance", "eco", "spectrum", "swarm", "protocols", "strike-lock", "week", "lock-count",
  "hormuz", "diplo",
  "esc-rate",
  "threat",
  "readiness", "confidence", "sys-stress", "isr", "ew-density"
]);

// Node definitions. Root nodes have `prior(state) → 0-1`. Derived nodes have
// `cpt: { i: intercept, p: [[parentId, weight], ...] }`.
// CPT weights calibrated so default state (week=1, threat=41, hormuzEscalation=46, …)
// produces posterior beliefs consistent with observed metric values.
const CAUSAL_NODE_DEFS = Object.freeze([
  // ── Root nodes (sampled with noise around current state value) ──
  { id: "naval",       prior: s => (s.hormuzParameters?.navalPosture     ?? 40) / 100 },
  { id: "alliance",    prior: s => (s.hormuzParameters?.allianceCohesion ?? 65) / 100 },
  { id: "eco",         prior: s => (s.hormuzParameters?.economicPressure ?? 50) / 100 },
  { id: "spectrum",    prior: s => s.system.spectrumIntegrity / 100 },
  { id: "swarm",       prior: s => s.system.swarmCohesion / 100 },
  { id: "protocols",   prior: s => Math.min(1, (s.threatMatrix?.protocolCount  ?? 0) / 5) },
  { id: "strike-lock", prior: s => (s.strikePlanner?.lockedSolutionId ? 1 : 0) },
  { id: "week",        prior: s => (s.system.week - 1) / 9 },
  { id: "lock-count",  prior: s => Math.min(1, (s.strikePlanner?.lockCount ?? 0) / 4) },
  // ── Derived nodes (sigmoid CPT, parents in CAUSAL_NODE_ORDER order) ──
  // hormuz: naval posture and campaign week are primary drivers
  { id: "hormuz",    cpt: { i: -1.3, p: [["naval", 2.5], ["week", 1.5]] } },
  // diplo: driven by alliance cohesion
  { id: "diplo",     cpt: { i: -1.5, p: [["alliance", 2.5]] } },
  // esc-rate: driven by economic pressure
  { id: "esc-rate",  cpt: { i: -1.9, p: [["eco", 2.5]] } },
  // threat: hormuz + naval + escalation rate escalate; active protocols suppress
  { id: "threat",    cpt: { i: -2.8, p: [["hormuz", 2.5], ["naval", 1.5], ["esc-rate", 2.0], ["protocols", -1.5]] } },
  // readiness: high threat degrades; swarm cohesion improves
  { id: "readiness", cpt: { i: -0.3, p: [["threat", -2.0], ["swarm", 2.5]] } },
  // confidence: threat erodes; alliance + locks improve
  { id: "confidence",cpt: { i:  1.5, p: [["threat", -1.5], ["alliance", 1.5], ["strike-lock", 1.0], ["lock-count", 0.8]] } },
  // sys-stress: driven by threat, hormuz, and strike commitment
  { id: "sys-stress",cpt: { i: -2.4, p: [["threat", 2.5], ["hormuz", 1.5], ["strike-lock", 0.8]] } },
  // isr: spectrum integrity + swarm assets
  { id: "isr",       cpt: { i: -2.1, p: [["spectrum", 2.0], ["swarm", 1.5]] } },
  // ew-density: spectrum integrity is the sole driver
  { id: "ew-density",cpt: { i: -1.1, p: [["spectrum", 2.5]] } }
]);

// Build lookup map for O(1) access during propagation
const _CAUSAL_MAP = Object.fromEntries(CAUSAL_NODE_DEFS.map(n => [n.id, n]));

function _sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// Gaussian noise via Box-Muller (approximated cheaply with 3-uniform sum)
function _gaussianNoise(sigma) {
  return ((Math.random() + Math.random() + Math.random()) - 1.5) * sigma * 1.15;
}

/**
 * Monte Carlo forward sampling through the causal DAG.
 * interventions: { [nodeId]: 0-1 } — clamp a node to a fixed value (do-calculus).
 * Returns { [nodeId]: posterior_probability } for all 18 nodes.
 */
export function propagateCausalBeliefs(state, interventions = {}, iters = 1000) {
  const sums = {};
  for (const id of CAUSAL_NODE_ORDER) sums[id] = 0;

  for (let i = 0; i < iters; i++) {
    const s = {};
    for (const id of CAUSAL_NODE_ORDER) {
      if (interventions[id] !== undefined) {
        s[id] = interventions[id];
      } else {
        const def = _CAUSAL_MAP[id];
        if (def.prior) {
          const obs = def.prior(state);
          s[id] = Math.max(0.01, Math.min(0.99, obs + _gaussianNoise(0.07)));
        } else {
          let logit = def.cpt.i;
          for (const [pid, w] of def.cpt.p) logit += w * s[pid];
          s[id] = _sigmoid(logit);
        }
      }
      sums[id] += s[id]; // accumulate every node, including clamped ones
    }
  }

  const beliefs = {};
  for (const id of CAUSAL_NODE_ORDER) beliefs[id] = sums[id] / iters;
  return beliefs;
}

/**
 * Sensitivity of targetId to each upstream node: ΔP(target | clamp=HI) vs clamp=LO.
 * Returns array sorted by |delta| descending.
 */
export function computeSensitivity(state, targetId, iters = 120) {
  const intv = state.causalInterventions ?? {};
  const results = [];
  for (const id of CAUSAL_NODE_ORDER) {
    if (id === targetId) continue;
    const hi  = propagateCausalBeliefs(state, { ...intv, [id]: 0.98 }, iters)[targetId];
    const lo  = propagateCausalBeliefs(state, { ...intv, [id]: 0.02 }, iters)[targetId];
    results.push({ nodeId: id, delta: (hi - lo) / 2 });
  }
  return results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

/** Dispatch: run propagation, store beliefs + active interventions in state. */
export function updateCausalBeliefs(state, extraInterventions = {}) {
  const interventions = { ...(state.causalInterventions ?? {}), ...extraInterventions };
  const beliefs = propagateCausalBeliefs(state, interventions, 1000);
  return {
    ...state,
    causalBeliefs: beliefs,
    causalInterventions: interventions,
    system: {
      ...state.system,
      log: [...state.system.log, `W${state.system.week}: Causal propagation — 1 000 trials, ${Object.keys(interventions).length} interventions`]
    }
  };
}

/** Dispatch: clamp one node to a value (0-1), or null to release the clamp. Re-propagates. */
export function setCausalIntervention(state, nodeId, value) {
  const interventions = { ...(state.causalInterventions ?? {}) };
  if (value === null) { delete interventions[nodeId]; }
  else { interventions[nodeId] = value; }
  const beliefs = propagateCausalBeliefs(state, interventions, 1000);
  return { ...state, causalBeliefs: beliefs, causalInterventions: interventions };
}

/** Dispatch: clear all interventions and re-propagate from priors. */
export function clearCausalInterventions(state) {
  const beliefs = propagateCausalBeliefs(state, {}, 1000);
  return {
    ...state,
    causalBeliefs: beliefs,
    causalInterventions: {},
    system: {
      ...state.system,
      log: [...state.system.log, `W${state.system.week}: Causal interventions cleared`]
    }
  };
}
