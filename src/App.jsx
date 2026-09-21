// App.jsx — Main application shell integrating FSM engine, 3D lab scene, control panel, state diagram, and HUD toast.
// Replaces the temporary slider with FSM drumRpm output.

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Lab from './scene/Lab.jsx';
import WashingMachine from './scene/WashingMachine.jsx';
import CameraControls from './scene/CameraControls.jsx';
import FsmSimulator from './scene/FsmSimulator.jsx';
import ControlPanel3D from './scene/ControlPanel3D.jsx';
import StateDiagram3D from './scene/StateDiagram3D.jsx';
import { useFsm } from './hooks/useFsm.js';
import { getInputs, setSensor } from './fsm/inputs.js';
import './index.css';

/** Sensor Toggles & Toast HUD Component */
function HudOverlay() {
  const { state, outputs, blockedReasons, mode, intensityPreset } = useFsm();
  const [sensors, setSensors] = useState(getInputs());
  const [activeToast, setActiveToast] = useState(null);

  // Sync inputs snapshot
  const toggleSensor = (name) => {
    const nextVal = !sensors[name];
    setSensor(name, nextVal);
    setSensors({ ...sensors, [name]: nextVal });
  };

  // Toast auto-dismiss effect when guard fails
  useEffect(() => {
    if (blockedReasons && blockedReasons.length > 0) {
      const first = blockedReasons[0];
      const message = `${first.label}: ${first.reasons.join(', ')}`;
      setActiveToast(message);
      const timer = setTimeout(() => setActiveToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [blockedReasons]);

  return (
    <>
      {/* ── Top Guard-Failed Toast Notification ───────────────────── */}
      {activeToast && (
        <div className="hud-toast">
          <span className="toast-icon">⚠️</span>
          <div className="toast-content">
            <span className="toast-title">GUARD FAILED</span>
            <span className="toast-message">{activeToast}</span>
          </div>
        </div>
      )}

      {/* ── Left Sensor Simulation & HUD Panel ─────────────────────── */}
      <div className="hud-panel">
        <div className="hud-header">
          <h2>FSM MECHATRONICS LAB</h2>
          <div className="hud-badge">{state}</div>
        </div>

        <div className="hud-section">
          <h4>SENSOR TOGGLES</h4>
          <div className="sensor-grid">
            {[
              { key: 'DoorClosed', label: 'Door Closed' },
              { key: 'WaterLevelFull', label: 'Water Full' },
              { key: 'WaterLevelEmpty', label: 'Water Empty' },
              { key: 'PumpOK', label: 'Pump OK' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`sensor-btn ${sensors[key] ? 'on' : 'off'}`}
                onClick={() => toggleSensor(key)}
              >
                {label}: {sensors[key] ? 'ON' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        <div className="hud-section">
          <h4>OUTPUT MONITOR</h4>
          <div className="outputs-grid">
            <div className="output-item">Valve: <span>{outputs.valve ? 'ON' : 'OFF'}</span></div>
            <div className="output-item">Motor: <span>{outputs.motor ? 'ON' : 'OFF'}</span></div>
            <div className="output-item">Pump: <span>{outputs.pump ? 'ON' : 'OFF'}</span></div>
            <div className="output-item">Door Lock: <span>{outputs.doorLock ? 'LOCKED' : 'OPEN'}</span></div>
            <div className="output-item">Drum RPM: <span>{outputs.drumRpm} RPM</span></div>
            <div className="output-item">Alarm: <span>{outputs.alarm ? 'ALARM!' : 'NORMAL'}</span></div>
          </div>
        </div>

        <div className="hud-footer">
          Mode: <strong>{mode.toUpperCase()}</strong> | Intensity: <strong>{intensityPreset.label} ({intensityPreset.phaseDuration}s)</strong>
        </div>
      </div>
    </>
  );
}

/** Inner Scene Component consuming FSM state inside Canvas */
function SceneContent() {
  const { outputs } = useFsm();

  return (
    <>
      <FsmSimulator />
      <CameraControls />
      <Lab />
      <WashingMachine drumRpm={outputs.drumRpm} drumDir={1} />
      <ControlPanel3D />
      <StateDiagram3D />
    </>
  );
}

export default function App() {
  return (
    <>
      {/* ── 3D Canvas ──────────────────────────────────────────────── */}
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [3.5, 2.5, 4], fov: 50, near: 0.1, far: 50 }}
        style={{ width: '100vw', height: '100vh' }}
      >
        <SceneContent />
      </Canvas>

      {/* ── HUD Toast & Sensor Controls ────────────────────────────── */}
      <HudOverlay />
    </>
  );
}
