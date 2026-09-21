# Stage 2: 3D Scene

## Stage
Stage 2 (3D Scene Layer)

## Tool
Antigravity agent

## Date
2026-09-21

## Prompt (verbatim)
```markdown
Read PROJECT_CONTEXT.md and agents.md first. Build the 3D scene only, in JavaScript (.jsx), using @react-three/fiber and three. Do NOT wire the FSM yet. Do not add new dependencies.

- src/scene/Lab.jsx: a dark technical mechatronics lab with a polished floor, soft lighting, a workbench, wall screens, and simple ambient details.
- src/scene/WashingMachine.jsx: an industrial washing machine with a TRANSPARENT outer casing (use transmission or opacity, whichever keeps 60 FPS). Include a drum with paddles and holes, motor, belt, inlet valve, drain pump, pipes, and a door with a visible lock bolt. Every animated part must be its own named object/component.
- src/scene/Drum.jsx: accepts props rpm and direction and rotates smoothly in useFrame.
- Camera controls: use OrbitControls. If @react-three/drei is not in package.json, import OrbitControls from "three/examples/jsm/controls/OrbitControls.js" and use it through R3F's extend. Start the camera so the machine is centered and there is empty space to its right (the state diagram will float there later).
- Keep the triangle count low, use instancing for repeated parts, and clamp the pixel ratio (dpr).
- Add a temporary HTML slider to test the drum rpm and a direction toggle.
- Wire it into src/index.jsx so npm run dev shows the scene.

Show your plan first. Explain your approach in two sentences, and add short comments in the code.
```

## What it produced
- `src/scene/Lab.jsx` — Dark technical mechatronics laboratory environment (reflective floor, grid walls, wall screens, workbench, lighting)
- `src/scene/WashingMachine.jsx` — Industrial washing machine with transparent casing, inner tub, motor, belt, pipes, and door lock bolt
- `src/scene/Drum.jsx` — Drum component with smooth frame-based rotation, radial paddles, and instanced drainage holes
- `src/scene/CameraControls.jsx` — OrbitControls integrated via R3F `extend()` pattern with angle and distance clamping
- `src/index.css` — Global styling, dark background reset, and overlay controls styling
- `src/App.jsx` — Canvas container with camera configuration and temporary HTML slider controls

## Problems found and how we fixed them
- **Missing `@react-three/drei` package**: The scaffold lacked `@react-three/drei` in `package.json`. In accordance with dependency rules prohibiting unapproved installs, imported `OrbitControls` directly from `three/examples/jsm/controls/OrbitControls.js` and registered it using React Three Fiber's `extend({ OrbitControls })`.
- **Transparent casing performance & depth sorting**: Full `MeshPhysicalMaterial` transmission can incur heavy shader overhead on lower-end GPUs. Used `MeshStandardMaterial` with `opacity: 0.15`, `transparent: true`, and `depthWrite: false` to achieve a clean transparent casing maintaining 60 FPS.

## Our own notes
- **What the code does**: Sets up a 3D dark mechatronics laboratory environment (reflective floor, grid walls, wall data screens, overhead lights, safety lines) and an industrial washing machine with independently animated components (rotating drum with paddles and drainage holes, drive motor, belt, pipes, door with lock bolt).
- **Key design decision**: Utilized `<instancedMesh>` for the 24 drum drainage holes to minimize GPU draw calls, and configured initial camera framing with negative X-offset on the machine to leave dedicated visual space on the right for the subsequent 3D state diagram.
