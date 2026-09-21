# FSM_Lab

### Problem Statement Fit

Washing machine control using basic AND and NOT gates (Electronics and Communication Engineering / Digital Applications). The project builds an interactive 3D simulation of an industrial washing machine controlled by a Finite State Machine (Moore and Mealy), where students see the control logic drive the mechanical behaviour in real time.

### Target Users

Engineering students studying mechatronics, digital logic, and control systems. The primary pain points are the abstract nature of FSM theory and the difficulty of visualising state transitions in a physical system.

### What We Built

- A pure-JavaScript FSM logic layer (`src/fsm/`) comprising a table-driven FSM engine, master simulation clock, and combinational gate-tree logic with 49 passing tests.
- A 3D simulation scene (`src/scene/`) using `@react-three/fiber` featuring a dark mechatronics laboratory environment and a transparent industrial washing machine with independently animated components.
- Subpath-compatible relative build configuration (`base: './'`) for static deployment.

### Core Features

- **FSM Logic Engine**: 7 states (IDLE, SOAK, WASH, RINSE, SPIN, PAUSED, FAULT) with Moore/Mealy toggle support, state history tracking, and blocked-guard diagnostic reporting.
- **Combinational Gate Logic**: AND/NOT/OR tree evaluation producing full wire maps for UI visualization.
- **Dark Mechatronics Lab Scene**: Polished reflective floor, grid-pattern walls, glowing wall screens, workbench with props, overhead strip lights, and floor safety markings.
- **Transparent Washing Machine**: Outer casing with transparent material showing internal components: inner tub, drum with paddles & instanced drainage holes, motor, drive belt, inlet valve & pipe, drain pump & pipe, door with glass and lock bolt.
- **Drum Animation**: Smooth frame-based rotation driven by RPM and direction props.
- **Camera Controls**: Interactive OrbitControls with clamped polar angles, distance bounds, and smooth damping.
- **Subpath Static Deployment**: Configured with `base: './'` so static bundles load cleanly when hosted under subdomains or subpaths.

### Technical Architecture

- **Logic Layer (`src/fsm/`)**: `clock.mjs`, `gates.mjs`, and `engine.mjs` built as standalone ES modules without React/Three.js dependencies.
- **3D Scene Layer (`src/scene/`)**: `Lab.jsx`, `WashingMachine.jsx`, `Drum.jsx`, and `CameraControls.jsx` built with `@react-three/fiber` and `three`.
- **Build Setup**: Vite with `@vitejs/plugin-react` and relative `base: './'`.

### Tech Stack

- React 18, `@react-three/fiber`, `three.js`, Vite
- Node.js built-in test runner (`node --test`) — 49 tests passing

### Innovation / Uniqueness

- Transparent outer casing allows real-time visual inspection of internal mechanical reactions (drum spin, motor drive) alongside control state changes.
- Procedural Three.js geometry without external textures or heavy GLTF assets for fast loading (< 10s target) and steady 60 FPS performance.

### Demo Instructions

1. `npm install`
2. `npm test` — runs all 49 FSM logic unit tests
3. `npm run dev` — opens Vite dev server to view the 3D lab & interactive washing machine
4. Use the bottom-left overlay slider and button to test drum RPM (0–800) and direction (CW/CCW)
5. Drag with the mouse to orbit around the machine

### Known Limitations

- FSM engine is not yet wired to the 3D scene (drum speed is currently driven by the temporary HTML overlay).
- 3D HUD, 3D state diagram, terminal, and gate circuit UI panels are not yet implemented.

### Future Work

- Wire the FSM engine to the 3D scene using a `useSyncExternalStore` hook (`useFsm.js`).
- Build the floating 3D state diagram and in-scene 3D control panel.
- Implement the live AND/NOT gate circuit panel and digital terminal.