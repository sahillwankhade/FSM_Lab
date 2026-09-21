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
<!-- Team to fill in -->
- 

## Our own notes
<!-- Team to fill in: what the code does and one key design decision in our own words -->
- 
