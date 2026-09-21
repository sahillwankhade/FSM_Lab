# Stage 1: FSM Logic Engine

## Stage
Stage 1 (FSM Logic Layer)

## Tool
Antigravity agent

## Date
2026-09-21

## Prompt (verbatim)
```markdown
Read PROJECT_CONTEXT.md and agents.md first. Build ONLY the logic layer in src/fsm as plain JavaScript (ES modules), with no 3D and no React yet.

1. engine.js: a table-driven FSM. Each transition has {from, to, guard(inputs), label}.
   Each state has Moore outputs (valve, motor, pump, doorLock, drumRpm, alarm).
   Support a runtime switch between Moore and Mealy (Mealy outputs attach to transitions).
   Expose step(inputs, dt), getState(), subscribe(), reset(), and a history log of
   {state, enteredAt, exitedAt}. When a transition is blocked, record which input
   made the guard fail so the UI can show the reason.
2. clock.js: a master clock with pause and 1x/2x/4x speed. Engine timers must use it.
3. gates.js: express every guard as a tree of AND / NOT nodes (OR only where required)
   that can be evaluated and returns every intermediate wire value.
4. Tests using Node's built-in test runner (node --test), with no new packages. Cover every
   transition, every blocked guard, PAUSED resume, all three fault causes, and FAULT reset.
   If ES module imports fail under node, use .mjs extensions for the FSM files and tests.
5. Add an npm script "test": "node --test" to package.json. Do not change any other script.

Show me your plan first. Do not add any new dependencies. Explain your approach in two sentences, and add short comments in the code.
```

## What it produced
- `src/fsm/engine.mjs` — Table-driven FSM with 7 states, Moore/Mealy toggle, history logging, and blocked guard reporting
- `src/fsm/clock.mjs` — Master simulation clock supporting pause/resume, 1x/2x/4x speed scaling, and deterministic ticking
- `src/fsm/gates.mjs` — Combinational AND/NOT/OR/INPUT gate-tree evaluator providing full wire inspection maps and failure reasons
- `src/fsm/tests/fsm.test.mjs` — 49 automated unit tests verifying transitions, guards, faults, and clock mechanics
- `package.json` — Added `"test": "node --test src/fsm/tests/*.mjs"` script

## Problems found and how we fixed them
- **`node --test` directory resolution error**: Running `node --test src/fsm/tests/` threw `MODULE_NOT_FOUND` because Node's test runner needed a glob pattern for `.mjs` test files. Fixed by updating the npm test script in `package.json` to `"test": "node --test src/fsm/tests/*.mjs"`.
- **State-dependent door safety logic**: Opening the door is only hazardous during active agitation (WASH / SPIN) and should not trigger a safety fault during SOAK or IDLE. Solved without hardcoding state checks into pure gate trees by injecting a dynamic synthetic input `_DoorUnsafeMidCycle` evaluated during `engine.step()`.

## Our own notes
- **What the code does**: Implements a standalone, zero-dependency logic layer in pure JavaScript (`.mjs`) featuring a table-driven Finite State Machine (7 states: IDLE, SOAK, WASH, RINSE, SPIN, PAUSED, FAULT), combinational AND/NOT gate trees, master simulation clock, and 49 passing unit tests.
- **Key design decision**: Gate evaluations return a complete hierarchical wire map (`{ value, wire: { label, value, children } }`) accompanied by `guardFailReasons()`, enabling downstream UI components to directly render live circuit diagrams and display clear diagnostic explanations for blocked transitions.
