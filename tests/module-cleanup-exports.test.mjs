import test from "node:test";
import assert from "node:assert/strict";
import { cleanup as cleanupDroneSwarm } from "../src/modules/drone-swarm.js";
import { cleanup as cleanupElectronicWarfare } from "../src/modules/electronic-warfare.js";
import { cleanup as cleanupHormuz } from "../src/modules/hormuz-escalation.js";
import { cleanup as cleanupOrbital } from "../src/modules/orbital.js";
import { cleanup as cleanupPlanets } from "../src/modules/planets.js";
import { cleanup as cleanupWarRoom } from "../src/modules/war-room.js";

test("resource-owning modules expose explicit cleanup hooks", () => {
  assert.equal(typeof cleanupDroneSwarm, "function");
  assert.equal(typeof cleanupElectronicWarfare, "function");
  assert.equal(typeof cleanupHormuz, "function");
  assert.equal(typeof cleanupOrbital, "function");
  assert.equal(typeof cleanupPlanets, "function");
  assert.equal(typeof cleanupWarRoom, "function");
});
