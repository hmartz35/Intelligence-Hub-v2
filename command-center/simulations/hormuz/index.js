import { SIMULATION_ASSETS } from "../../../hub-controller.js";

export const hormuzSimulation = {
  ...SIMULATION_ASSETS.hormuz,
  lanes: ["Traffic Separation Scheme", "Iranian littoral", "Omani approaches", "Gulf outbound"],
  escalationRungs: ["watch", "interdict", "mine-risk", "strike-risk", "full-scale-conflict"],
  score({ threat = 41, spectrumIntegrity = 78, swarmCohesion = 83 } = {}) {
    return Math.max(0, Math.min(100, Math.round(threat * 0.58 + (100 - spectrumIntegrity) * 0.27 + (100 - swarmCohesion) * 0.15)));
  }
};
