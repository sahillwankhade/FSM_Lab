// FsmSimulator.jsx — Frame-driven simulation loop for the FSM engine inside R3F Canvas.
// Advances the master clock and steps the engine every frame.
// Manages automatic state phase timers based on selected wash intensity.

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as engine from '../fsm/engine.mjs';
import { getInputs, clearPulses, getIntensityPreset, setSensor } from '../fsm/inputs.js';

export default function FsmSimulator() {
  const stateTimerRef = useRef(0);
  const lastStateRef = useRef(engine.getState());

  useFrame((_, delta) => {
    const currentState = engine.getState();
    const preset = getIntensityPreset();

    // Reset state timer whenever the FSM transitions to a new state
    if (currentState !== lastStateRef.current) {
      stateTimerRef.current = 0;
      lastStateRef.current = currentState;
      setSensor('TimerDone', false);
    } else {
      stateTimerRef.current += delta;
    }

    // Active wash states (SOAK, WASH, RINSE, SPIN) rely on TimerDone for auto-progression
    const activeWashStates = new Set(['SOAK', 'WASH', 'RINSE', 'SPIN']);
    if (activeWashStates.has(currentState)) {
      if (stateTimerRef.current >= preset.phaseDuration) {
        setSensor('TimerDone', true);
      }
    }

    // Step engine with current sensor & command inputs
    const inputs = getInputs();
    engine.step(inputs, delta);

    // Clear single-shot command pulses (Start, Pause, Resume, Reset) after step execution
    clearPulses();
  });

  return null;
}
