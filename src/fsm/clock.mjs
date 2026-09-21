// clock.mjs — Master clock for the FSM simulation.
// Provides pause/resume, speed multiplier (1x/2x/4x), and a manual tick()
// so that dt values are consistent across the engine and testable.

/** @type {1|2|4} */
let speed = 1;
let paused = false;
let elapsed = 0;       // total simulation-time elapsed (seconds)
let lastWall = null;    // wall-clock timestamp of the previous tick (ms)

/**
 * Advance the clock by one frame.
 * If dtOverride is provided (seconds), use it instead of wall-clock delta.
 * This keeps unit tests deterministic.
 *
 * @param {number} [dtOverride] — explicit dt in seconds (for tests)
 * @returns {{ dt: number, elapsed: number }}
 */
export function tick(dtOverride) {
  if (paused) {
    // When paused, no time passes. Reset lastWall so the next
    // resume doesn't see a huge delta.
    lastWall = null;
    return { dt: 0, elapsed };
  }

  let rawDt;
  if (dtOverride !== undefined) {
    // Manual / test mode: use the supplied delta directly.
    rawDt = dtOverride;
  } else {
    // Real-time mode: measure wall-clock delta.
    const now = performance.now();
    rawDt = lastWall === null ? 0 : (now - lastWall) / 1000;
    lastWall = now;
  }

  // Scale by the speed multiplier.
  const dt = rawDt * speed;
  elapsed += dt;
  return { dt, elapsed };
}

/** Pause the clock. All subsequent tick() calls return dt = 0. */
export function pause() {
  paused = true;
}

/** Resume the clock after a pause. */
export function resume() {
  paused = false;
  lastWall = null; // avoid a spike on the first tick after resume
}

/** @returns {boolean} */
export function isPaused() {
  return paused;
}

/**
 * Set the speed multiplier.
 * @param {1|2|4} m
 */
export function setSpeed(m) {
  if (m !== 1 && m !== 2 && m !== 4) {
    throw new Error(`Invalid speed multiplier: ${m}. Use 1, 2, or 4.`);
  }
  speed = m;
}

/** @returns {1|2|4} */
export function getSpeed() {
  return speed;
}

/** @returns {number} total elapsed simulation-time in seconds */
export function getElapsed() {
  return elapsed;
}

/** Reset the clock to its initial state. */
export function reset() {
  speed = 1;
  paused = false;
  elapsed = 0;
  lastWall = null;
}
