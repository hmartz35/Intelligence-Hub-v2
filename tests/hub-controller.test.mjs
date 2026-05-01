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
  TERMINAL_HIERARCHY,
  STITCH_SCREENS,
  COMMAND_CENTER_PATHS,
  SIMULATION_ASSETS
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
