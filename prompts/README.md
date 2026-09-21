# AI Prompts & Engineering Log

This folder records the engineering prompts used with the AI agent to design, build, test, and deploy **FSM_Lab**, along with the key architectural decisions made by the team. This log serves as an audit trail for hackathon evaluation and technical review.

## Prompt Index

| # | Title | Stage | Purpose | Files produced or changed | Status |
|---|---|---|---|---|---|
| **00** | [PROJECT_CONTEXT.md](../PROJECT_CONTENTS.md) | Foundation | Shared specification, state definitions, gate logic, and rules referenced at the start of every prompt | `PROJECT_CONTENTS.md` | Active |
| **01** | [01-stage1-fsm-engine.md](./01-stage1-fsm-engine.md) | Stage 1 | Build standalone FSM logic layer (clock, gates, table-driven engine, tests) with zero dependencies | `src/fsm/engine.mjs`<br>`src/fsm/clock.mjs`<br>`src/fsm/gates.mjs`<br>`src/fsm/tests/fsm.test.mjs`<br>`package.json` | Done |
| **02** | [02-stage2-3d-scene.md](./02-stage2-3d-scene.md) | Stage 2 | Build 3D mechatronics lab and transparent industrial washing machine using Three.js / R3F | `src/scene/Lab.jsx`<br>`src/scene/WashingMachine.jsx`<br>`src/scene/Drum.jsx`<br>`src/scene/CameraControls.jsx`<br>`src/App.jsx`<br>`src/index.css` | Done |
| **03** | [03-deployment-fix.md](./03-deployment-fix.md) | Deployment | Diagnose S3 AccessDenied error, configure relative base path for subpath hosting, and verify static build | `vite.config.js`<br>`index.html`<br>`.gitignore`<br>`dist/` | Done |

---

## How to add a new prompt

When issuing a new prompt or advancing to the next milestone:

1. Duplicate [`_TEMPLATE.md`](./_TEMPLATE.md) and name it using sequential numbering and descriptive slug (for example: `04-stage3-hud-wiring.md`).
2. Fill in each section accurately following the template guidelines.
3. Add a corresponding entry in the table above with current status (`Done`, `In progress`, or `Not verified`).
