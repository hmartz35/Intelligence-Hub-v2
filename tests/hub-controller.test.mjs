import test from "node:test";
import assert from "node:assert/strict";
import {
  createHubState,
  advanceWarRoom,
  setActiveModule,
  transitionTerminal,
  updateDrillDownState,
  validateAssetMappings,
  PLANETARY_DATA,
  NAV_MODULES,
  SIDEBAR_TARGETS,
  TERMINAL_HIERARCHY,
  STITCH_SCREENS,
  COMMAND_CENTER_PATHS,
  SIMULATION_ASSETS,
  TACTICAL_THEME,
  lockStrikeSolution,
  initiateThreatProtocol,
  initiateEWJammingEvent,
  getCausalChainSummary,
  setHormuzParameters,
  ESCALATION_RUNGS,
  WAR_GAME_ACTORS
} from "../hub-controller.js";

test("active module persists without resetting operational state", () => {
  const state = createHubState({ seed: 0x1a2b3c });
  const afterTurn = advanceWarRoom(state, ["mil1", "dip3"]);
  const routed = setActiveModule(afterTurn, "planets");

  assert.equal(routed.activeModule, "planets");
  assert.equal(routed.system.week, 2);
  assert.equal(routed.system.seed, 0x1a2b3c);
  assert.ok(routed.system.log.length >= 3);
});

test("navigation modules and NASA planetary data expose the full site scaffold", () => {
  assert.deepEqual(
    NAV_MODULES.map((module) => module.id),
    [
      "overview",
      "planets",
      "war-room",
      "orbital",
      "drone-swarm",
      "electronic-warfare",
      "hormuz-escalation",
      "executive-briefing"
    ]
  );
  assert.equal(PLANETARY_DATA.length, 8);
  assert.equal(PLANETARY_DATA[2].name, "Earth");
  assert.ok(PLANETARY_DATA.every((planet) => planet.source === "NASA Planetary Fact Sheet"));
});

test("final Stitch canvas maps the full multi-terminal hierarchy", () => {
  assert.equal(STITCH_SCREENS.length, 55);
  assert.equal(TERMINAL_HIERARCHY.root.id, "command-center");

  const ids = TERMINAL_HIERARCHY.terminals.map((terminal) => terminal.id);
  assert.ok(ids.includes("drone-swarm"));
  assert.ok(ids.includes("electronic-warfare"));
  assert.ok(ids.includes("hormuz-escalation"));
  assert.ok(ids.includes("executive-briefing"));

  for (const terminal of TERMINAL_HIERARCHY.terminals) {
    assert.ok(terminal.screens.length > 0, `${terminal.id} should have mapped screens`);
    assert.ok(terminal.route.startsWith(COMMAND_CENTER_PATHS.baseRoute));
  }
});

test("terminal transitions keep drill-down state persistent", () => {
  const state = createHubState({ seed: 0x5150 });
  const drilled = updateDrillDownState(state, "drone-swarm", {
    selectedNodeId: "UAV-RAVEN-03",
    panel: "telemetry"
  });
  const shifted = transitionTerminal(drilled, "electronic-warfare", "spectrum");
  const returned = transitionTerminal(shifted, "drone-swarm", "telemetry");

  assert.equal(returned.activeModule, "drone-swarm");
  assert.equal(returned.activeTerminal, "drone-swarm");
  assert.equal(returned.terminalTransitions.length, 2);
  assert.equal(returned.drillDown["drone-swarm"].selectedNodeId, "UAV-RAVEN-03");
  assert.equal(returned.drillDown["electronic-warfare"].panel, "spectrum");
  assert.equal(returned.system.seed, 0x5150);
});

test("legacy Hormuz and NASA simulations are path mapped into Command Center", () => {
  const report = validateAssetMappings();

  assert.equal(report.valid, true);
  assert.equal(COMMAND_CENTER_PATHS.root, "command-center");
  assert.equal(SIMULATION_ASSETS.nasa.scope, "legacy-nasa");
  assert.equal(SIMULATION_ASSETS.hormuz.scope, "legacy-hormuz");
  assert.ok(SIMULATION_ASSETS.nasa.entry.endsWith("command-center/simulations/nasa/index.js"));
  assert.ok(SIMULATION_ASSETS.hormuz.entry.endsWith("command-center/simulations/hormuz/index.js"));
  assert.ok(report.assets.every((asset) => asset.mappedPath.startsWith("command-center/")));
});

test("Aether Command navigation exposes the required full-swap sidebar targets", () => {
  assert.deepEqual(
    SIDEBAR_TARGETS.map((target) => target.label),
    ["Orbital Theater", "Asset Tracking", "Signal Intel", "Threat Matrix", "Comm Link"]
  );
  assert.ok(SIDEBAR_TARGETS.every((target) => STITCH_SCREENS.some((screen) => screen.screenId === target.screenId)));
  assert.equal(TACTICAL_THEME.colors.commandBlue, "#0EA5E9");
});

test("strike planner lock and threat protocol buttons mutate operational state", () => {
  const state = createHubState({ seed: 0xa37 });
  const locked = lockStrikeSolution(state, "solution-blue");

  assert.equal(locked.strikePlanner.lockedSolutionId, "solution-blue");
  assert.equal(locked.strikePlanner.lockCount, 1);
  assert.equal(locked.activeTerminal, "war-room");
  assert.ok(locked.system.log.at(-1).includes("Strike solution locked"));

  const initiated = initiateThreatProtocol(locked, "containment");
  assert.equal(initiated.threatMatrix.activeProtocolId, "containment");
  assert.equal(initiated.threatMatrix.protocolCount, 1);
  assert.ok(initiated.system.threat < locked.system.threat);
  assert.ok(initiated.system.log.at(-1).includes("Threat protocol initiated"));
});

// ─── Reference refactor tests ─────────────────────────────────────────────────

test("createHubState initialises actor hostility and economic model defaults", () => {
  const state = createHubState();
  assert.ok(state.system.actors, "system.actors must exist");
  assert.equal(typeof state.system.actors.iran,    "number");
  assert.equal(typeof state.system.actors.houthis, "number");
  assert.equal(typeof state.system.actors.israel,  "number");
  assert.equal(typeof state.system.actors.ksa,     "number");
  assert.ok(state.system.actors.iran > 0 && state.system.actors.iran < 1);
  assert.equal(state.hormuzParameters.oilPrice,  105);
  assert.equal(state.hormuzParameters.recession,  46);
});

test("advanceWarRoom drifts actor hostility based on directive domains", () => {
  const state = createHubState({ seed: 0x1234 });

  // Diplomatic directives should reduce Iran hostility
  const afterDiplo = advanceWarRoom(state, ["dip1", "dip3"]);
  assert.ok(afterDiplo.system.actors.iran < state.system.actors.iran,
    "diplomatic directives must reduce Iran hostility");

  // Military/escalation directives should raise Iran hostility
  const afterMil = advanceWarRoom(state, ["mil1", "hormuz7"]);
  assert.ok(afterMil.system.actors.iran > state.system.actors.iran,
    "military+escalation must raise Iran hostility");

  // dip1 specifically reduces KSA hostility more than baseline drift
  const afterDip1 = advanceWarRoom(state, ["dip1"]);
  const afterNoop  = advanceWarRoom(state, []);
  assert.ok(afterDip1.system.actors.ksa < afterNoop.system.actors.ksa,
    "dip1 must reduce KSA hostility vs no-action turn");

  // Drone ops should degrade Houthi hostility vs baseline
  const afterDrone = advanceWarRoom(state, ["drone5"]);
  assert.ok(afterDrone.system.actors.houthis < afterNoop.system.actors.houthis,
    "drone ops must reduce Houthi hostility vs no-action turn");
});

test("advanceWarRoom actors are clamped 0–1 and stored in system", () => {
  let state = createHubState({ seed: 0x9999 });
  for (let i = 0; i < 10; i++) {
    state = advanceWarRoom(state, ["mil1", "hormuz7"]);
  }
  const { iran, houthis, israel, ksa } = state.system.actors;
  assert.ok(iran    >= 0 && iran    <= 1);
  assert.ok(houthis >= 0 && houthis <= 1);
  assert.ok(israel  >= 0 && israel  <= 1);
  assert.ok(ksa     >= 0 && ksa     <= 1);
});

test("setHormuzParameters computes oil price and recession risk", () => {
  const state = createHubState();

  // Neutral params → baseline escalation, moderate oil price
  const neutral = setHormuzParameters(state, {
    navalPosture: 40, escalationRate: 35, economicPressure: 50, allianceCohesion: 65
  });
  assert.equal(typeof neutral.hormuzParameters.oilPrice,  "number");
  assert.equal(typeof neutral.hormuzParameters.recession, "number");
  assert.ok(neutral.hormuzParameters.oilPrice  >= 75);
  assert.ok(neutral.hormuzParameters.recession >= 5 && neutral.hormuzParameters.recession <= 95);

  // High naval posture should raise escalation → raise oil price
  const highNaval = setHormuzParameters(state, { navalPosture: 90 });
  assert.ok(highNaval.hormuzParameters.oilPrice > state.hormuzParameters.oilPrice,
    "high naval posture must raise oil price");
  assert.ok(highNaval.hormuzParameters.recession > state.hormuzParameters.recession,
    "high naval posture must raise recession risk");

  // Low cohesion drives escalation up
  const lowCohesion = setHormuzParameters(state, { allianceCohesion: 10 });
  assert.ok(lowCohesion.hormuzParameters.oilPrice > state.hormuzParameters.oilPrice);
});

test("ESCALATION_RUNGS export covers 10 rungs with required fields", () => {
  assert.equal(ESCALATION_RUNGS.length, 10);
  for (const r of ESCALATION_RUNGS) {
    assert.ok(typeof r.rung  === "number", "rung must be a number");
    assert.ok(typeof r.name  === "string" && r.name.length > 0,  "name required");
    assert.ok(typeof r.desc  === "string" && r.desc.length > 10, "desc must be non-trivial");
    assert.ok(typeof r.color === "string" && r.color.startsWith("#"), "color must be a hex string");
  }
  assert.equal(ESCALATION_RUNGS[0].rung, 0);
  assert.equal(ESCALATION_RUNGS[9].rung, 9);
});

test("WAR_GAME_ACTORS contains all 6 named regional actors", () => {
  const ids = WAR_GAME_ACTORS.map(a => a.id);
  assert.ok(ids.includes("us"),    "US must be present");
  assert.ok(ids.includes("iran"),  "Iran must be present");
  assert.ok(ids.includes("uae"),   "UAE must be present");
  assert.ok(ids.includes("ksa"),   "KSA must be present");
  assert.ok(ids.includes("oman"),  "Oman must be present");
  assert.ok(ids.includes("china"), "China must be present");
  assert.equal(WAR_GAME_ACTORS.length, 6);
});

test("hormuzHistory accumulates entries across advanceWarRoom and setHormuzParameters", () => {
  let state = createHubState();
  assert.equal(state.system.hormuzHistory.length, 1, "initial history has one entry");

  state = advanceWarRoom(state, ["hormuz7"]);
  assert.equal(state.system.hormuzHistory.length, 2);
  assert.equal(state.system.hormuzHistory[1].week, 2);

  state = setHormuzParameters(state, { navalPosture: 70 });
  assert.equal(state.system.hormuzHistory.length, 3);
  assert.equal(state.system.hormuzHistory[2].source, "parameters");
});

test("no-action turn still advances week and drifts actors without crash", () => {
  const state = createHubState({ seed: 0xbeef });
  const next = advanceWarRoom(state, []);
  assert.equal(next.system.week, 2);
  assert.ok(next.system.actors.iran >= 0 && next.system.actors.iran <= 1);
  assert.ok(next.system.log.some(e => e.startsWith("W2:")));
});

test("EW jamming event propagates through the flagship causal chain", () => {
  const state = createHubState();
  const before = getCausalChainSummary(state);
  const jammed = initiateEWJammingEvent(state, { source: "EW-NODE-12", intensity: 72 });
  const after = getCausalChainSummary(jammed);

  assert.equal(jammed.activeModule, "electronic-warfare");
  assert.equal(jammed.drillDown["electronic-warfare"].panel, "spectrum");
  assert.equal(jammed.system.ewJamming.events, 1);
  assert.equal(jammed.system.ewJamming.lastSource, "EW-NODE-12");

  assert.ok(jammed.system.spectrumIntegrity < state.system.spectrumIntegrity,
    "EW jamming must degrade spectrum integrity");
  assert.ok(jammed.system.sensorConfidence < state.system.sensorConfidence,
    "sensor confidence must drop");
  assert.ok(jammed.system.orbitalISRCertainty < state.system.orbitalISRCertainty,
    "orbital ISR certainty must drop");
  assert.ok(after.warRoomRiskSpread > before.warRoomRiskSpread,
    "war-room risk estimate must widen");
  assert.ok(jammed.system.actors.iran > state.system.actors.iran,
    "regional actor posture must shift");
  assert.ok(after.escalationProbability > before.escalationProbability,
    "escalation probability must rise");
  assert.ok(jammed.system.log.at(-1).includes("EW jamming event"));
});
