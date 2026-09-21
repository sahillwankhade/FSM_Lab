// inputs.js — Shared FSM input state manager and wash intensity settings.
// Holds current sensor values and single-shot command pulses.

/** Default input state matching requirement (DoorClosed, WaterLevelFull, WaterLevelEmpty, PumpOK set to true) */
const inputs = {
  Start: false,
  Pause: false,
  Resume: false,
  EStop: false,
  Reset: false,
  Fault: false,
  DoorClosed: true,
  WaterLevelFull: true,
  WaterLevelEmpty: true,
  PumpOK: true,
  TimerDone: false,
};

/** Wash intensity presets: duration per phase (seconds) and RPM multiplier */
const INTENSITY_PRESETS = {
  light: { label: 'Light', phaseDuration: 3, rpmScale: 0.8 },
  normal: { label: 'Normal', phaseDuration: 5, rpmScale: 1.0 },
  heavy: { label: 'Heavy', phaseDuration: 8, rpmScale: 1.2 },
};

let currentIntensity = 'normal';

/** @returns {object} Copy of current FSM inputs */
export function getInputs() {
  return { ...inputs };
}

/** Set a persistent sensor input value */
export function setSensor(name, val) {
  if (name in inputs) {
    inputs[name] = !!val;
  }
}

/** Pulse a single-shot command input (e.g. Start, Pause, Resume, EStop, Reset) */
export function pulseInput(name) {
  if (name in inputs) {
    inputs[name] = true;
  }
}

/** Clear single-shot command pulses after an engine step */
export function clearPulses() {
  inputs.Start = false;
  inputs.Pause = false;
  inputs.Resume = false;
  inputs.Reset = false;
  inputs.Fault = false;
}

/** Toggle emergency stop state */
export function toggleEStop() {
  inputs.EStop = !inputs.EStop;
}

/** Set wash intensity ('light' | 'normal' | 'heavy') */
export function setIntensity(mode) {
  if (INTENSITY_PRESETS[mode]) {
    currentIntensity = mode;
  }
}

/** @returns {'light'|'normal'|'heavy'} Current wash intensity mode */
export function getIntensity() {
  return currentIntensity;
}

/** @returns {{ label: string, phaseDuration: number, rpmScale: number }} Preset details */
export function getIntensityPreset() {
  return INTENSITY_PRESETS[currentIntensity];
}
