// useFsm.js — Custom React hook for subscribing to FSM engine state using useSyncExternalStore.
// Returns current state, outputs, blocked reasons, history, mode, and previousState.

import { useSyncExternalStore } from 'react';
import * as engine from '../fsm/engine.mjs';
import { getIntensity, getIntensityPreset } from '../fsm/inputs.js';

/** Generate an immutable snapshot object of current engine state */
function getSnapshot() {
  const preset = getIntensityPreset();
  const rawOutputs = engine.getOutputs();
  
  // Scale drum RPM by current wash intensity preset
  const scaledOutputs = {
    ...rawOutputs,
    drumRpm: Math.round(rawOutputs.drumRpm * preset.rpmScale),
  };

  return {
    state: engine.getState(),
    outputs: scaledOutputs,
    blockedReasons: engine.getBlockedInfo(),
    history: engine.getHistory(),
    mode: engine.getMode(),
    previousState: engine.getPreviousState(),
    intensity: getIntensity(),
    intensityPreset: preset,
  };
}

/**
 * Custom React hook for reactive FSM engine state updates
 * @returns {{
 *   state: string,
 *   outputs: object,
 *   blockedReasons: Array,
 *   history: Array,
 *   mode: string,
 *   previousState: string|null,
 *   intensity: string,
 *   intensityPreset: object
 * }}
 */
export function useFsm() {
  return useSyncExternalStore(engine.subscribe, getSnapshot, getSnapshot);
}
