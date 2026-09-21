# Stage 3: 3D Control Panel & State Diagram Integration

## Stage
Stage 3 (FSM & 3D Scene Integration)

## Tool
Antigravity agent

## Date
2026-09-21

## Prompt (verbatim)
```markdown
Read PROJECT_CONTEXT.md and agents.md first. Then read src/fsm/engine.js, clock.js and gates.js and the scene files in src/scene to learn the exact APIs that already exist. Use those APIs; do not rewrite the engine unless you find a bug, and tell me if you do.

Connect the 3D scene to the FSM. Use JavaScript (.js/.jsx). Do NOT add new dependencies (no zustand).

1. src/hooks/useFsm.js: a hook built on useSyncExternalStore that subscribes to the engine and returns the current state, outputs, blocked-transition reason, and history.
2. Simulation loop: ONE owner (a component using useFrame, or a single requestAnimationFrame) advances the master clock and calls engine.step(inputs, dt) every frame. Keep the sensor inputs in one small shared object: DoorClosed, WaterLevelFull, WaterLevelEmpty, PumpOK all true for now, so I can toggle them in Stage 4. For this stage, treat WaterLevelFull and WaterLevelEmpty as simple flags set by a temporary timer so the cycle can complete.
3. src/scene/ControlPanel3D.jsx: pressable 3D buttons Start, Pause, and a red mushroom Emergency Stop, plus an intensity selector (Light / Normal / Heavy) that changes state durations and RPM. Add hover and press animations. Clicking sets the right FSM input.
4. src/scene/StateDiagram3D.jsx: a floating diagram to the right of the machine with a node for every state and an arrow for every transition. The ACTIVE state glows and pulses, the last-taken transition animates, and a blocked transition flashes red. It always faces the camera and stays readable. Show the current outputs next to the active node.
5. A HUD toast in plain HTML/CSS showing "GUARD FAILED: <reason>" when a transition is blocked.
6. Feed the FSM's drumRpm output into the Drum component from Stage 2 and remove the temporary rpm slider.

Rules: 3D components only READ FSM state and never contain transition logic. Keep 60 FPS. Make sure npm run build and npm test still pass. Show your plan first. Explain your approach in two sentences, and add short comments in the code.
```

## What it produced
- `src/fsm/inputs.js` — Shared inputs state manager with default sensor flags, command pulse helpers, and wash intensity presets
- `src/hooks/useFsm.js` — Custom React hook built on `useSyncExternalStore` with cached snapshot references for reactive FSM engine consumption
- `src/scene/FsmSimulator.jsx` — Frame simulation loop inside R3F `useFrame` advancing clock, managing phase timers, stepping the engine, and clearing pulses
- `src/scene/ControlPanel3D.jsx` — 3D Control Panel with pressable Start, Pause/Resume, Emergency Stop red mushroom, Reset, and Intensity Selector buttons with hover/press animations
- `src/scene/StateDiagram3D.jsx` — Floating 3D state diagram with 7 nodes, transition arrows, active state pulsing glow, blocked red flash, billboard camera alignment, and real-time outputs overlay
- `src/App.jsx` — Wired 3D Canvas with simulator, control panel, state diagram, FSM drum RPM output, and Guard-Failed HUD Toast
- `src/index.css` — Added styling for HUD toast notifications, sensor toggles, and output monitor

## Problems found and how we fixed them
<!-- Team to fill in -->
- 

## Our own notes
<!-- Team to fill in: what the code does and one key design decision in our own words -->
- 
