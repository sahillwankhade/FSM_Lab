# FSM_Lab

### Problem Statement Fit

Washing machine control using basic AND and NOT gates (Electronics and Communication Engineering / Digital Applications). The project builds an interactive 3D simulation of an industrial washing machine controlled by a Finite State Machine (Moore and Mealy), where students see the control logic drive the mechanical behaviour in real time.

### Target Users

Engineering students studying mechatronics, digital logic, and control systems. The primary pain points are the abstract nature of FSM theory and the difficulty of visualising state transitions in a physical system.

### What We Built

- A pure-JavaScript FSM logic layer (`src/fsm/`) comprising a table-driven FSM engine, master simulation clock, and combinational gate-tree logic with 49 passing tests.
- A 3D simulation scene (`src/scene/`) using `@react-three/fiber` featuring a dark mechatronics laboratory environment and a transparent industrial washing machine.
- Reactive integration connecting the 3D scene to the FSM engine via a zero-dependency `useSyncExternalStore` hook (`useFsm.js`), an interactive 3D control panel (`ControlPanel3D.jsx`), a floating 3D state diagram (`StateDiagram3D.jsx`), and a guard-failed HUD toast.

### Core Features

- **FSM Logic Engine**: 7 states (IDLE, SOAK, WASH, RINSE, SPIN, PAUSED, FAULT) with Moore/Mealy toggle support, state history tracking, and blocked-guard diagnostic reporting.
- **Combinational Gate Logic**: AND/NOT/OR tree evaluation producing full wire maps for UI visualization.
- **Reactive React Hook (`useFsm.js`)**: Built on `useSyncExternalStore` without third-party state libraries (no zustand).
- **Frame Simulation Loop (`FsmSimulator.jsx`)**: Advances master clock and steps FSM engine in `useFrame`, automatically triggering state duration timers based on intensity settings.
- **3D Control Panel (`ControlPanel3D.jsx`)**: Pressable 3D buttons (Green Start, Yellow/Cyan Pause/Resume, Red Mushroom E-Stop, Blue Reset, and Intensity Selector) with hover glow and press depression animations.
- **Floating 3D State Diagram (`StateDiagram3D.jsx`)**: Positioned to the right of the machine. Features pulsing emissive active node glow, 3D transition connecting arrows, red flash on blocked transitions, outputs overlay card, and camera billboard orientation.
- **HUD Toast Notification**: Displays `"GUARD FAILED: <reason>"` toast when a transition attempt is blocked by failing input guards.
- **Interactive Sensor Toggles**: Live HUD buttons to simulate sensor faults (Door Open, Pump Fail, Water Level).

### Technical Architecture

- **Logic Layer (`src/fsm/`)**: `clock.mjs`, `gates.mjs`, `engine.mjs`, and `inputs.js` as standalone ES modules.
- **Integration Layer (`src/hooks/`)**: `useFsm.js` built with `useSyncExternalStore`.
- **3D Scene Layer (`src/scene/`)**: `Lab.jsx`, `WashingMachine.jsx`, `Drum.jsx`, `ControlPanel3D.jsx`, `StateDiagram3D.jsx`, `FsmSimulator.jsx`, and `CameraControls.jsx`.

### Tech Stack

- React 18, `@react-three/fiber`, `three.js`, Vite
- Node.js built-in test runner (`node --test`) — 49 tests passing

### Innovation / Uniqueness

- 3D components strictly READ state from the FSM engine; zero transition logic exists inside visual components.
- Interactive 3D control panel and floating state diagram react in real-time to state transitions and sensor condition failures.

### Demo Instructions

1. `npm install`
2. `npm test` — runs all 49 FSM logic unit tests
3. `npm run dev` — opens Vite dev server
4. Click **Start** on the 3D control panel to initiate the wash cycle (IDLE → SOAK → WASH → RINSE → SPIN → IDLE)
5. Click **Pause** / **Resume** or press the **Red Mushroom E-STOP** button to test fault and pause behaviors
6. Use the left-side HUD sensor toggles (e.g. set **Door Closed** to OFF) and click **Start** to view the **GUARD FAILED** toast and red transition flash
7. Orbit around the machine with mouse drag

### Known Limitations

- In-scene digital terminal and live AND/NOT gate logic panel UI are not yet implemented.
- End-of-cycle logic report summary view is not yet added.

### Future Work

- Build the live AND/NOT gate circuit panel and digital terminal.
- Add end-of-cycle efficiency report.