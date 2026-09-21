// engine.mjs — Table-driven Finite State Machine for a washing machine.
// Pure JavaScript, no React or three.js imports.
// Reads the master clock for timing; all outputs are driven by state tables.

import * as clock from './clock.mjs';
import { INPUT, AND, NOT, OR, guardFailReasons } from './gates.mjs';

// ─── Moore output tables ──────────────────────────────────────────────
// Each state maps to its Moore outputs.
// { valve, motor, pump, doorLock, drumRpm, alarm }

const STATES = {
  IDLE:   { valve: false, motor: false, pump: false, doorLock: false, drumRpm: 0,   alarm: false },
  SOAK:   { valve: true,  motor: false, pump: false, doorLock: true,  drumRpm: 5,   alarm: false },
  WASH:   { valve: false, motor: true,  pump: false, doorLock: true,  drumRpm: 30,  alarm: false },
  RINSE:  { valve: true,  motor: true,  pump: false, doorLock: true,  drumRpm: 40,  alarm: false },
  SPIN:   { valve: false, motor: false, pump: true,  doorLock: true,  drumRpm: 800, alarm: false },
  PAUSED: { valve: false, motor: false, pump: false, doorLock: true,  drumRpm: 0,   alarm: false },
  FAULT:  { valve: false, motor: false, pump: false, doorLock: false, drumRpm: 0,   alarm: true  },
};

// ─── Transition table ─────────────────────────────────────────────────
// Normal (non-fault, non-pause) transitions.
// Each has { from, to, guard (gate tree), label, mealyOutputs? }.

const TRANSITIONS = [
  {
    from: 'IDLE',
    to: 'SOAK',
    label: 'Start wash cycle',
    guard: AND(INPUT('Start'), INPUT('DoorClosed'), NOT(INPUT('Fault'))),
    // Mealy: during the transition instant, lock the door early
    mealyOutputs: { doorLock: true },
  },
  {
    from: 'SOAK',
    to: 'WASH',
    label: 'Water full → agitate',
    guard: AND(INPUT('WaterLevelFull'), INPUT('DoorClosed'), NOT(INPUT('EStop'))),
    mealyOutputs: { valve: false, motor: true },
  },
  {
    from: 'WASH',
    to: 'RINSE',
    label: 'Wash done → rinse',
    guard: AND(INPUT('TimerDone'), INPUT('DoorClosed')),
    mealyOutputs: { valve: true },
  },
  {
    from: 'RINSE',
    to: 'SPIN',
    label: 'Rinse done → spin',
    guard: AND(INPUT('TimerDone'), INPUT('WaterLevelEmpty')),
    mealyOutputs: { pump: true, motor: false },
  },
  {
    from: 'SPIN',
    to: 'IDLE',
    label: 'Spin done → idle',
    guard: AND(INPUT('TimerDone'), INPUT('WaterLevelEmpty')),
    mealyOutputs: { pump: false, doorLock: false },
  },
];

// ─── Fault guard ──────────────────────────────────────────────────────
// Fault fires from any active state (SOAK, WASH, RINSE, SPIN).
// Three causes: EStop, NOT PumpOK, or door opened during WASH/SPIN.

const FAULT_GUARD = OR(
  INPUT('EStop'),
  NOT(INPUT('PumpOK')),
  // The door-open-mid-cycle condition is state-dependent; we inject a
  // synthetic input '_DoorUnsafeMidCycle' computed by step().
  INPUT('_DoorUnsafeMidCycle')
);

// States from which a fault can fire
const ACTIVE_STATES = new Set(['SOAK', 'WASH', 'RINSE', 'SPIN']);

// States from which Pause can fire
const PAUSABLE_STATES = new Set(['SOAK', 'WASH', 'RINSE', 'SPIN']);

// ─── FAULT → IDLE reset guard ─────────────────────────────────────────
const RESET_GUARD = AND(
  INPUT('Reset'),
  NOT(INPUT('EStop')),
  INPUT('PumpOK'),
  INPUT('DoorClosed')
);

// ─── Engine state ─────────────────────────────────────────────────────

let currentState = 'IDLE';
let previousState = null;    // stored when entering PAUSED
let mode = 'moore';          // 'moore' | 'mealy'
let currentOutputs = { ...STATES.IDLE };
let history = [{ state: 'IDLE', enteredAt: 0, exitedAt: null }];
let lastBlockedInfo = [];    // [{ label, reasons }] for the last step
let subscribers = [];        // listener callbacks

// ─── Internal helpers ─────────────────────────────────────────────────

/** Notify all subscribers of a state change. */
function notify() {
  for (const cb of subscribers) {
    try { cb(); } catch (_) { /* subscriber errors must not crash the engine */ }
  }
}

/** Record exiting the current state and entering a new one. */
function changeState(newState, elapsed) {
  // Stamp exitedAt on the current history entry
  const last = history[history.length - 1];
  if (last && last.exitedAt === null) {
    last.exitedAt = elapsed;
  }
  currentState = newState;
  history.push({ state: newState, enteredAt: elapsed, exitedAt: null });
  // Default outputs come from the Moore table
  currentOutputs = { ...STATES[newState] };
  notify();
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Advance the FSM by one step.
 *
 * @param {object} inputs — boolean map: Start, Pause, EStop, DoorClosed,
 *   WaterLevelFull, WaterLevelEmpty, TimerDone, PumpOK, Reset, Fault
 * @param {number} [dtOverride] — explicit dt in seconds (for tests);
 *   if omitted the master clock computes dt from wall time.
 * @returns {{ state: string, outputs: object, blockedReasons: Array }}
 */
export function step(inputs, dtOverride) {
  const { dt, elapsed } = clock.tick(dtOverride);
  const blocked = [];

  // Inject the synthetic door-unsafe flag for the fault guard.
  // Door opened mid-cycle is only dangerous in WASH or SPIN.
  const augmented = {
    ...inputs,
    _DoorUnsafeMidCycle:
      !inputs.DoorClosed && (currentState === 'WASH' || currentState === 'SPIN'),
  };

  // ── 1. Check fault transitions (highest priority) ────────────────
  if (ACTIVE_STATES.has(currentState)) {
    const faultResult = FAULT_GUARD.evaluate(augmented);
    if (faultResult.value) {
      // A fault condition is true — enter FAULT.
      previousState = null; // cannot resume from a fault
      changeState('FAULT', elapsed);
      return { state: currentState, outputs: currentOutputs, blockedReasons: [] };
    }
  }

  // ── 2. Handle PAUSED ─────────────────────────────────────────────
  if (currentState !== 'PAUSED' && currentState !== 'IDLE' && currentState !== 'FAULT') {
    // Check if Pause is requested
    if (inputs.Pause) {
      previousState = currentState;
      changeState('PAUSED', elapsed);
      return { state: currentState, outputs: currentOutputs, blockedReasons: [] };
    }
  }

  // Resume from PAUSED
  if (currentState === 'PAUSED') {
    if (inputs.Resume && previousState) {
      const dest = previousState;
      previousState = null;
      changeState(dest, elapsed);
      return { state: currentState, outputs: currentOutputs, blockedReasons: [] };
    }
    // While paused, nothing else happens.
    lastBlockedInfo = [];
    return { state: currentState, outputs: currentOutputs, blockedReasons: [] };
  }

  // ── 3. FAULT → IDLE reset ───────────────────────────────────────
  if (currentState === 'FAULT') {
    const resetResult = RESET_GUARD.evaluate(augmented);
    if (resetResult.value) {
      changeState('IDLE', elapsed);
    } else {
      blocked.push({
        label: 'FAULT → IDLE (reset)',
        reasons: guardFailReasons(resetResult.wire),
      });
    }
    lastBlockedInfo = blocked;
    return { state: currentState, outputs: currentOutputs, blockedReasons: blocked };
  }

  // ── 4. Normal transitions ───────────────────────────────────────
  for (const t of TRANSITIONS) {
    if (t.from !== currentState) continue;

    const result = t.guard.evaluate(augmented);
    if (result.value) {
      // Transition fires
      changeState(t.to, elapsed);

      // In Mealy mode, apply transition-specific output overrides
      if (mode === 'mealy' && t.mealyOutputs) {
        currentOutputs = { ...currentOutputs, ...t.mealyOutputs };
      }

      lastBlockedInfo = [];
      return { state: currentState, outputs: currentOutputs, blockedReasons: [] };
    } else {
      // Guard failed — record why
      blocked.push({
        label: t.label,
        reasons: guardFailReasons(result.wire),
      });
    }
  }

  // No transition fired; outputs stay as Moore defaults.
  lastBlockedInfo = blocked;
  return { state: currentState, outputs: currentOutputs, blockedReasons: blocked };
}

/** @returns {string} current state name */
export function getState() {
  return currentState;
}

/** @returns {object} current output values */
export function getOutputs() {
  return { ...currentOutputs };
}

/**
 * Subscribe to state changes.
 * @param {function} cb — called with no args whenever the state changes
 * @returns {function} unsubscribe
 */
export function subscribe(cb) {
  subscribers.push(cb);
  return () => {
    subscribers = subscribers.filter((s) => s !== cb);
  };
}

/**
 * Switch between Moore and Mealy output modes at runtime.
 * @param {'moore'|'mealy'} m
 */
export function setMode(m) {
  if (m !== 'moore' && m !== 'mealy') {
    throw new Error(`Invalid mode: ${m}. Use 'moore' or 'mealy'.`);
  }
  mode = m;
}

/** @returns {'moore'|'mealy'} */
export function getMode() {
  return mode;
}

/** @returns {Array<{ state: string, enteredAt: number, exitedAt: number|null }>} */
export function getHistory() {
  return history.map((h) => ({ ...h }));
}

/** @returns {Array<{ label: string, reasons: string[] }>} blocked info from last step */
export function getBlockedInfo() {
  return lastBlockedInfo;
}

/** @returns {string|null} the state that was active before PAUSED */
export function getPreviousState() {
  return previousState;
}

/** Reset everything back to IDLE. Also resets the master clock. */
export function reset() {
  clock.reset();
  currentState = 'IDLE';
  previousState = null;
  mode = 'moore';
  currentOutputs = { ...STATES.IDLE };
  history = [{ state: 'IDLE', enteredAt: 0, exitedAt: null }];
  lastBlockedInfo = [];
  notify();
}

// ─── Exports for tests ────────────────────────────────────────────────
// Allow tests to inspect the static tables.
export { STATES, TRANSITIONS, FAULT_GUARD, RESET_GUARD };
