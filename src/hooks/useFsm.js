// useFsm.js — Custom React hook for subscribing to FSM engine state using useSyncExternalStore.
// Uses a stable cached snapshot to prevent React infinite re-render loops.

import { useSyncExternalStore } from 'react';
import * as engine from '../fsm/engine.mjs';
import { getIntensity, getIntensityPreset } from '../fsm/inputs.js';

let cachedSnapshot = null;
let lastState = null;
let lastOutputsJson = null;
let lastBlockedJson = null;
let lastHistoryLength = 0;
let lastMode = null;
let lastPrevious = null;
let lastIntensity = null;

/**
 * Generate a cached, stable snapshot object.
 * Returns the exact same reference if underlying engine values have not changed.
 */
function getSnapshot() {
  const state = engine.getState();
  const rawOutputs = engine.getOutputs();
  const preset = getIntensityPreset();
  const intensity = getIntensity();
  const blockedReasons = engine.getBlockedInfo();
  const history = engine.getHistory();
  const mode = engine.getMode();
  const previousState = engine.getPreviousState();

  const scaledOutputs = {
    ...rawOutputs,
    drumRpm: Math.round(rawOutputs.drumRpm * preset.rpmScale),
  };

  const outputsJson = JSON.stringify(scaledOutputs);
  const blockedJson = JSON.stringify(blockedReasons);

  if (
    cachedSnapshot &&
    state === lastState &&
    mode === lastMode &&
    previousState === lastPrevious &&
    intensity === lastIntensity &&
    outputsJson === lastOutputsJson &&
    blockedJson === lastBlockedJson &&
    history.length === lastHistoryLength
  ) {
    return cachedSnapshot;
  }

  lastState = state;
  lastOutputsJson = outputsJson;
  lastBlockedJson = blockedJson;
  lastHistoryLength = history.length;
  lastMode = mode;
  lastPrevious = previousState;
  lastIntensity = intensity;

  cachedSnapshot = {
    state,
    outputs: scaledOutputs,
    blockedReasons,
    history,
    mode,
    previousState,
    intensity,
    intensityPreset: preset,
  };

  return cachedSnapshot;
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
