# PROJECT CONTEXT: FSM_Lab, Mechatronics Digital Twin

Hackathon problem: "Washing machine control using basic AND and NOT gates"
(Electronics and Communication Engineering / Digital Applications).

Goal: an interactive 3D simulation of an industrial washing machine controlled by a
Finite State Machine (Moore and Mealy), where students see the control logic drive
the mechanical behaviour in real time.

## STACK (matches the existing scaffold)

- React 18 + JavaScript (.js / .jsx files, NO TypeScript), Vite, entry point src/index.jsx
- three.js and @react-three/fiber (already in package.json)
- Plain CSS for the HUD (no Tailwind)
- No zustand: the FSM engine has its own subscribe() and React reads it through a small
  hook built on useSyncExternalStore
- OrbitControls: use @react-three/drei only if it is approved in the CreatorCode asset
  store; otherwise import OrbitControls from "three/examples/jsm/controls/OrbitControls.js"

## DEPENDENCY RULES

- Only use dependencies approved by CreatorCode's asset store.
- Do NOT run `npm install <new-package>`. If a new package is needed, tell me its name
  and I will install it through `CreatorCode: Install Asset`.
- Do not remove existing scaffold files (.creatorcode, deployment.yaml, agents.md, etc.).
- `npm run build` must keep working.
- No backend. Must run as a static site.
- Must load in under 10 seconds, run 2+ minutes without crashing, and target 60 FPS.
- Tests: use Node's built-in test runner (`node --test`), no new packages. If ES module
  imports fail under node, use .mjs file extensions for the FSM files and tests.

## STATES

| State  | Code | Drum behaviour               | Outputs                      |
|--------|------|------------------------------|------------------------------|
| IDLE   | 000  | stopped                      | all off, door unlocked       |
| SOAK   | 001  | very slow (~5 rpm)           | inlet valve ON, door locked  |
| WASH   | 010  | slow reversing agitation     | motor ON                     |
| RINSE  | 011  | medium agitation             | inlet ON, then drain         |
| SPIN   | 100  | high RPM with vibration      | drain pump ON                |
| PAUSED | 101  | stopped, previous state kept | motor off                    |
| FAULT  | 111  | stopped                      | alarm ON, safe outputs       |

## INPUTS

Start, Pause, EStop, DoorClosed, WaterLevelFull, WaterLevelEmpty, TimerDone, PumpOK

## TRANSITIONS (guards written with AND / NOT logic)

- IDLE -> SOAK:  Start AND DoorClosed AND NOT Fault
- SOAK -> WASH:  WaterLevelFull AND DoorClosed AND NOT EStop
- WASH -> RINSE: TimerDone AND DoorClosed
- RINSE -> SPIN: TimerDone AND WaterLevelEmpty
- SPIN -> IDLE:  TimerDone AND WaterLevelEmpty
- any active state -> PAUSED on Pause (resume returns to the previous state)
- any state -> FAULT on EStop OR NOT PumpOK OR (NOT DoorClosed AND state in WASH/SPIN)
- FAULT -> IDLE on Reset once the fault is cleared

## REQUIRED FEATURES (from the problem statement)

- Laboratory workspace with a washing machine that has a transparent outer casing
- 3D control panel: Start, Pause, Emergency Stop, and wash-intensity selector
- Floating 3D state diagram that highlights the active state
- Drum rotation speed, direction and vibration change with the current state
- Sensor simulation (door lock, water level); a failed condition blocks the transition
- Configurable state durations through an in-scene digital terminal
- Visual output indicators (valve light, drain particle effect)
- Fault injection mode (for example a pump failure leading to a FAULT state)
- Logic Report at the end of a cycle (path taken, efficiency from user timings)
- Master clock for accurate timing, and a steady 60 FPS

## OUR EXTRAS

- Live AND/NOT gate circuit panel with truth table and state-encoding bits
- Moore / Mealy toggle
- Guided Demo and Fault Demo buttons

## RULES

- The FSM engine (src/fsm) is plain JavaScript with no React or three.js imports.
- All timers run from one master clock.
- 3D visuals only READ the FSM state; they never contain transition logic.
- Build one feature at a time and keep the app working after every change.
- Keep code commented and readable; the team must be able to explain every file.
- Follow agents.md: keep submission.md updated with only confirmed, real information.

## FOLDER PLAN

```
src/fsm     engine.js, clock.js, gates.js, tests
src/scene   Lab, WashingMachine, Drum, ControlPanel3D, StateDiagram3D,
            Terminal3D, Water, Particles, Sensors
src/ui      HUD, GatePanel, TruthTable, FaultPanel, LogicReport, GuidedDemo, FpsMeter
src/hooks   useFsm.js (useSyncExternalStore wrapper around the engine)
```