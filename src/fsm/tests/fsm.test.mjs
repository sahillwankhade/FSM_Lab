// fsm.test.mjs — Tests for the FSM logic layer.
// Uses Node's built-in test runner (node --test) and assert module.
// No external test dependencies.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import * as clock from '../clock.mjs';
import { INPUT, AND, NOT, OR, guardFailReasons } from '../gates.mjs';
import * as engine from '../engine.mjs';

// ─── Helper: default "safe" inputs (everything happy-path) ───────────
function safeInputs(overrides = {}) {
  return {
    Start: false,
    Pause: false,
    Resume: false,
    EStop: false,
    DoorClosed: true,
    WaterLevelFull: false,
    WaterLevelEmpty: false,
    TimerDone: false,
    PumpOK: true,
    Fault: false,
    Reset: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CLOCK TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('clock', () => {
  beforeEach(() => clock.reset());

  it('tick with dtOverride returns scaled dt', () => {
    clock.setSpeed(2);
    const { dt, elapsed } = clock.tick(0.5);
    assert.equal(dt, 1.0, '0.5s at 2x should give dt=1.0');
    assert.equal(elapsed, 1.0);
  });

  it('pause freezes dt to zero', () => {
    clock.tick(1.0); // elapsed = 1
    clock.pause();
    const { dt, elapsed } = clock.tick(1.0);
    assert.equal(dt, 0);
    assert.equal(elapsed, 1.0, 'elapsed should not increase while paused');
  });

  it('resume continues accumulating time', () => {
    clock.tick(1.0); // elapsed = 1
    clock.pause();
    clock.tick(5.0); // paused, no effect
    clock.resume();
    const { dt, elapsed } = clock.tick(0.5);
    assert.equal(dt, 0.5);
    assert.equal(elapsed, 1.5);
  });

  it('setSpeed rejects invalid multipliers', () => {
    assert.throws(() => clock.setSpeed(3), /Invalid speed/);
  });

  it('4x speed quadruples dt', () => {
    clock.setSpeed(4);
    const { dt } = clock.tick(0.25);
    assert.equal(dt, 1.0);
  });

  it('getSpeed returns the current multiplier', () => {
    assert.equal(clock.getSpeed(), 1);
    clock.setSpeed(4);
    assert.equal(clock.getSpeed(), 4);
  });

  it('isPaused reflects pause state', () => {
    assert.equal(clock.isPaused(), false);
    clock.pause();
    assert.equal(clock.isPaused(), true);
    clock.resume();
    assert.equal(clock.isPaused(), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// GATES TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('gates', () => {
  it('INPUT reads a boolean from inputs', () => {
    const gate = INPUT('X');
    assert.equal(gate.evaluate({ X: true }).value, true);
    assert.equal(gate.evaluate({ X: false }).value, false);
    assert.equal(gate.evaluate({}).value, false); // missing → falsy
  });

  it('AND of two inputs', () => {
    const gate = AND(INPUT('A'), INPUT('B'));
    assert.equal(gate.evaluate({ A: true, B: true }).value, true);
    assert.equal(gate.evaluate({ A: true, B: false }).value, false);
    assert.equal(gate.evaluate({ A: false, B: true }).value, false);
  });

  it('NOT inverts a child', () => {
    const gate = NOT(INPUT('X'));
    assert.equal(gate.evaluate({ X: true }).value, false);
    assert.equal(gate.evaluate({ X: false }).value, true);
  });

  it('OR of two inputs', () => {
    const gate = OR(INPUT('A'), INPUT('B'));
    assert.equal(gate.evaluate({ A: false, B: false }).value, false);
    assert.equal(gate.evaluate({ A: true, B: false }).value, true);
    assert.equal(gate.evaluate({ A: false, B: true }).value, true);
  });

  it('complex guard: AND(A, NOT(B))', () => {
    const gate = AND(INPUT('A'), NOT(INPUT('B')));
    assert.equal(gate.evaluate({ A: true, B: false }).value, true);
    assert.equal(gate.evaluate({ A: true, B: true }).value, false);
  });

  it('wire map has correct structure', () => {
    const gate = AND(INPUT('A'), NOT(INPUT('B')));
    const { wire } = gate.evaluate({ A: true, B: false });
    assert.equal(wire.type, 'AND');
    assert.equal(wire.children.length, 2);
    assert.equal(wire.children[0].type, 'INPUT');
    assert.equal(wire.children[0].label, 'A');
    assert.equal(wire.children[1].type, 'NOT');
    assert.equal(wire.children[1].children[0].label, 'B');
  });

  it('guardFailReasons identifies blocking inputs', () => {
    const gate = AND(INPUT('Start'), INPUT('DoorClosed'), NOT(INPUT('Fault')));
    const result = gate.evaluate({ Start: true, DoorClosed: false, Fault: false });
    assert.equal(result.value, false);
    const reasons = guardFailReasons(result.wire);
    assert.ok(reasons.includes('DoorClosed'), 'should report DoorClosed');
  });

  it('guardFailReasons reports NOT failures', () => {
    const gate = AND(INPUT('Start'), NOT(INPUT('Fault')));
    const result = gate.evaluate({ Start: true, Fault: true });
    assert.equal(result.value, false);
    const reasons = guardFailReasons(result.wire);
    assert.ok(
      reasons.some((r) => r.includes('Fault')),
      'should report Fault in reasons'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════
// ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════

describe('engine', () => {
  beforeEach(() => engine.reset());

  // ─── Normal full cycle ──────────────────────────────────────────

  describe('normal cycle: IDLE → SOAK → WASH → RINSE → SPIN → IDLE', () => {
    it('starts in IDLE', () => {
      assert.equal(engine.getState(), 'IDLE');
    });

    it('IDLE → SOAK on Start + DoorClosed', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      assert.equal(engine.getState(), 'SOAK');
    });

    it('SOAK → WASH on WaterLevelFull', () => {
      engine.step(safeInputs({ Start: true }), 0.1);           // → SOAK
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);  // → WASH
      assert.equal(engine.getState(), 'WASH');
    });

    it('WASH → RINSE on TimerDone', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1);       // → RINSE
      assert.equal(engine.getState(), 'RINSE');
    });

    it('RINSE → SPIN on TimerDone + WaterLevelEmpty', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → SPIN
      assert.equal(engine.getState(), 'SPIN');
    });

    it('SPIN → IDLE on TimerDone + WaterLevelEmpty', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → IDLE
      assert.equal(engine.getState(), 'IDLE');
    });
  });

  // ─── Blocked guards ────────────────────────────────────────────

  describe('blocked guards report reasons', () => {
    it('IDLE stays if DoorClosed is false', () => {
      const result = engine.step(
        safeInputs({ Start: true, DoorClosed: false }),
        0.1
      );
      assert.equal(engine.getState(), 'IDLE');
      assert.ok(result.blockedReasons.length > 0, 'should have blocked reasons');
      const allReasons = result.blockedReasons.flatMap((b) => b.reasons);
      assert.ok(
        allReasons.some((r) => r.includes('DoorClosed')),
        'should mention DoorClosed'
      );
    });

    it('IDLE stays if Start is false', () => {
      const result = engine.step(safeInputs({ Start: false }), 0.1);
      assert.equal(engine.getState(), 'IDLE');
      assert.ok(result.blockedReasons.length > 0);
    });

    it('SOAK stays if WaterLevelFull is false', () => {
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      const result = engine.step(safeInputs({ WaterLevelFull: false }), 0.1);
      assert.equal(engine.getState(), 'SOAK');
      assert.ok(result.blockedReasons.length > 0);
      const allReasons = result.blockedReasons.flatMap((b) => b.reasons);
      assert.ok(allReasons.some((r) => r.includes('WaterLevelFull')));
    });

    it('WASH stays if TimerDone is false', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      const result = engine.step(safeInputs({ TimerDone: false }), 0.1);
      assert.equal(engine.getState(), 'WASH');
      assert.ok(result.blockedReasons.length > 0);
    });

    it('RINSE stays if WaterLevelEmpty is false', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1); // → RINSE
      const result = engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: false }), 0.1);
      assert.equal(engine.getState(), 'RINSE');
      assert.ok(result.blockedReasons.length > 0);
    });
  });

  // ─── PAUSED ─────────────────────────────────────────────────────

  describe('PAUSED state', () => {
    it('Pause from WASH enters PAUSED', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1); // → WASH
      engine.step(safeInputs({ Pause: true }), 0.1);          // → PAUSED
      assert.equal(engine.getState(), 'PAUSED');
    });

    it('PAUSED outputs: motor off, door locked', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ Pause: true }), 0.1);
      const outputs = engine.getOutputs();
      assert.equal(outputs.motor, false, 'motor should be off');
      assert.equal(outputs.doorLock, true, 'door should stay locked');
      assert.equal(outputs.drumRpm, 0, 'drum should be stopped');
    });

    it('Resume from PAUSED returns to previous state (WASH)', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ Pause: true }), 0.1);
      assert.equal(engine.getState(), 'PAUSED');
      assert.equal(engine.getPreviousState(), 'WASH');

      engine.step(safeInputs({ Resume: true }), 0.1);
      assert.equal(engine.getState(), 'WASH');
    });

    it('Pause from SOAK and resume', () => {
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      engine.step(safeInputs({ Pause: true }), 0.1); // → PAUSED
      assert.equal(engine.getState(), 'PAUSED');
      assert.equal(engine.getPreviousState(), 'SOAK');

      engine.step(safeInputs({ Resume: true }), 0.1);
      assert.equal(engine.getState(), 'SOAK');
    });

    it('Pause from SPIN and resume', () => {
      // Run to SPIN
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → SPIN
      assert.equal(engine.getState(), 'SPIN');

      engine.step(safeInputs({ Pause: true }), 0.1); // → PAUSED
      assert.equal(engine.getState(), 'PAUSED');

      engine.step(safeInputs({ Resume: true }), 0.1);
      assert.equal(engine.getState(), 'SPIN');
    });
  });

  // ─── Fault: EStop ──────────────────────────────────────────────

  describe('fault: EStop', () => {
    it('EStop from WASH → FAULT', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1); // → WASH
      engine.step(safeInputs({ EStop: true }), 0.1);          // → FAULT
      assert.equal(engine.getState(), 'FAULT');
    });

    it('EStop from SOAK → FAULT', () => {
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      engine.step(safeInputs({ EStop: true }), 0.1); // → FAULT
      assert.equal(engine.getState(), 'FAULT');
    });

    it('FAULT outputs: alarm on, everything else safe', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ EStop: true }), 0.1);
      const outputs = engine.getOutputs();
      assert.equal(outputs.alarm, true);
      assert.equal(outputs.motor, false);
      assert.equal(outputs.pump, false);
      assert.equal(outputs.valve, false);
    });
  });

  // ─── Fault: PumpOK = false ─────────────────────────────────────

  describe('fault: PumpOK failure', () => {
    it('PumpOK=false from RINSE → FAULT', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1); // → RINSE
      assert.equal(engine.getState(), 'RINSE');

      engine.step(safeInputs({ PumpOK: false }), 0.1);   // → FAULT
      assert.equal(engine.getState(), 'FAULT');
    });
  });

  // ─── Fault: Door open mid-cycle ────────────────────────────────

  describe('fault: door opened during WASH or SPIN', () => {
    it('DoorClosed=false during WASH → FAULT', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1); // → WASH
      engine.step(safeInputs({ DoorClosed: false }), 0.1);    // → FAULT
      assert.equal(engine.getState(), 'FAULT');
    });

    it('DoorClosed=false during SPIN → FAULT', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true }), 0.1);
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → SPIN
      engine.step(safeInputs({ DoorClosed: false }), 0.1);                      // → FAULT
      assert.equal(engine.getState(), 'FAULT');
    });

    it('DoorClosed=false during SOAK does NOT fault (soak is safe)', () => {
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      // Door open in SOAK should NOT trigger the door-unsafe fault
      // (only WASH/SPIN are dangerous). However SOAK→WASH guard needs DoorClosed.
      engine.step(safeInputs({ DoorClosed: false }), 0.1);
      assert.notEqual(engine.getState(), 'FAULT');
      assert.equal(engine.getState(), 'SOAK');
    });
  });

  // ─── FAULT reset ───────────────────────────────────────────────

  describe('FAULT → IDLE reset', () => {
    it('Reset with cleared faults → IDLE', () => {
      // Enter FAULT via EStop
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ EStop: true }), 0.1); // → FAULT
      assert.equal(engine.getState(), 'FAULT');

      // Reset: provide Reset=true, clear EStop, PumpOK=true, DoorClosed=true
      engine.step(safeInputs({ Reset: true, EStop: false }), 0.1);
      assert.equal(engine.getState(), 'IDLE');
    });

    it('Reset blocked if EStop still active', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ EStop: true }), 0.1);
      const result = engine.step(
        safeInputs({ Reset: true, EStop: true }),
        0.1
      );
      assert.equal(engine.getState(), 'FAULT', 'should stay in FAULT');
      assert.ok(result.blockedReasons.length > 0);
    });

    it('Reset blocked if PumpOK is false', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ PumpOK: false }), 0.1); // → FAULT
      const result = engine.step(
        safeInputs({ Reset: true, PumpOK: false }),
        0.1
      );
      assert.equal(engine.getState(), 'FAULT');
      assert.ok(result.blockedReasons.length > 0);
    });
  });

  // ─── Moore vs Mealy mode ───────────────────────────────────────

  describe('Moore vs Mealy mode', () => {
    it('Moore: outputs come from state table', () => {
      engine.setMode('moore');
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      const outputs = engine.getOutputs();
      // Moore SOAK outputs
      assert.equal(outputs.valve, true);
      assert.equal(outputs.doorLock, true);
    });

    it('Mealy: transition overrides outputs during the step', () => {
      engine.setMode('mealy');
      // IDLE → SOAK transition has mealyOutputs: { doorLock: true }
      // IDLE's Moore outputs have doorLock: false, so in Mealy mode
      // the transition fires and overrides.
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      const outputs = engine.getOutputs();
      // SOAK Moore outputs + Mealy override from IDLE→SOAK transition
      assert.equal(outputs.doorLock, true);
    });

    it('setMode rejects invalid mode', () => {
      assert.throws(() => engine.setMode('invalid'), /Invalid mode/);
    });
  });

  // ─── Subscribe / notify ────────────────────────────────────────

  describe('subscribe', () => {
    it('subscriber is called on state change', () => {
      let callCount = 0;
      const unsub = engine.subscribe(() => { callCount++; });
      engine.step(safeInputs({ Start: true }), 0.1); // → SOAK
      assert.ok(callCount > 0, 'subscriber should have been called');
      unsub();
    });

    it('unsubscribe stops notifications', () => {
      let callCount = 0;
      const unsub = engine.subscribe(() => { callCount++; });
      engine.step(safeInputs({ Start: true }), 0.1);
      const countAfterFirst = callCount;
      unsub();
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      assert.equal(callCount, countAfterFirst, 'should not increment after unsub');
    });
  });

  // ─── History log ───────────────────────────────────────────────

  describe('history', () => {
    it('records a full cycle with enteredAt and exitedAt', () => {
      engine.step(safeInputs({ Start: true }), 0.1);                            // → SOAK
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);                   // → WASH
      engine.step(safeInputs({ TimerDone: true }), 0.1);                        // → RINSE
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → SPIN
      engine.step(safeInputs({ TimerDone: true, WaterLevelEmpty: true }), 0.1); // → IDLE

      const history = engine.getHistory();
      // Should have 6 entries: IDLE, SOAK, WASH, RINSE, SPIN, IDLE
      assert.equal(history.length, 6);
      assert.equal(history[0].state, 'IDLE');
      assert.equal(history[1].state, 'SOAK');
      assert.equal(history[2].state, 'WASH');
      assert.equal(history[3].state, 'RINSE');
      assert.equal(history[4].state, 'SPIN');
      assert.equal(history[5].state, 'IDLE');

      // Each completed state should have both enteredAt and exitedAt
      for (let i = 0; i < 5; i++) {
        assert.notEqual(history[i].exitedAt, null, `history[${i}] should have exitedAt`);
      }
      // The last entry (current IDLE) should have exitedAt = null
      assert.equal(history[5].exitedAt, null);
    });

    it('reset clears history', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.reset();
      const history = engine.getHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0].state, 'IDLE');
    });
  });

  // ─── Reset ─────────────────────────────────────────────────────

  describe('engine.reset()', () => {
    it('returns to IDLE and clears outputs', () => {
      engine.step(safeInputs({ Start: true }), 0.1);
      engine.step(safeInputs({ WaterLevelFull: true }), 0.1);
      assert.equal(engine.getState(), 'WASH');

      engine.reset();
      assert.equal(engine.getState(), 'IDLE');
      const outputs = engine.getOutputs();
      assert.equal(outputs.motor, false);
      assert.equal(outputs.valve, false);
      assert.equal(outputs.alarm, false);
      assert.equal(outputs.doorLock, false);
    });
  });
});
