import { PLANETARY_DATA, SIMULATION_ASSETS } from "../../../hub-controller.js";

export const nasaSimulation = {
  ...SIMULATION_ASSETS.nasa,
  bodies: PLANETARY_DATA,
  resolveBody(name) {
    return PLANETARY_DATA.find((body) => body.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
};
