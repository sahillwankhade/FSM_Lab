// App.jsx — Main application shell.
// Sets up the R3F Canvas, loads the scene components, and provides
// temporary HTML test controls for drum RPM and direction.
// No FSM wiring yet — the drum is driven purely by React state.

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Lab from './scene/Lab.jsx';
import WashingMachine from './scene/WashingMachine.jsx';
import CameraControls from './scene/CameraControls.jsx';
import './index.css';

export default function App() {
  // ── Temporary test state for the drum ─────────────────────────────
  const [rpm, setRpm] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = CW, -1 = CCW

  return (
    <>
      {/* ── 3D Canvas ──────────────────────────────────────────────── */}
      <Canvas
        // Clamp pixel ratio for performance on HiDPI displays
        dpr={[1, 1.5]}
        // Start the camera to the right and slightly above, leaving
        // empty space on the right for the future state diagram.
        camera={{ position: [3.5, 2.5, 4], fov: 50, near: 0.1, far: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <CameraControls />
        <Lab />
        <WashingMachine drumRpm={rpm} drumDir={direction} />
      </Canvas>

      {/* ── Temporary test controls (HTML overlay) ─────────────────── */}
      <div className="test-controls">
        <h3>Drum Test</h3>

        <label>
          RPM
          <span className="value-display">{rpm}</span>
          <input
            type="range"
            min={0}
            max={800}
            step={5}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
          />
        </label>

        <button onClick={() => setDirection((d) => d * -1)}>
          Direction: {direction === 1 ? 'CW ↻' : 'CCW ↺'}
        </button>
      </div>
    </>
  );
}
