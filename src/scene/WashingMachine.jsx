// WashingMachine.jsx — Industrial washing machine with transparent outer casing.
// Every animated/controllable part is a named sub-component so the FSM
// can drive them individually later. No FSM wiring yet.
//
// Props:
//   drumRpm  — passed to <Drum>
//   drumDir  — passed to <Drum> as direction

import React from 'react';
import * as THREE from 'three';
import Drum from './Drum.jsx';

// ─── Materials (reused across parts) ──────────────────────────────────

// Transparent outer casing — light blue tint, see-through
const casingMaterial = (
  <meshStandardMaterial
    color="#a0c8e0"
    metalness={0.2}
    roughness={0.1}
    transparent
    opacity={0.15}
    side={THREE.DoubleSide}
    depthWrite={false}
  />
);

// Standard industrial metal
const metalGrey = { color: '#6a6a70', metalness: 0.7, roughness: 0.3 };
const metalDark = { color: '#3a3a40', metalness: 0.8, roughness: 0.25 };
const metalLight = { color: '#9a9a9e', metalness: 0.6, roughness: 0.35 };

// ─── Sub-components ───────────────────────────────────────────────────

/** Transparent outer casing — box shape with visible edges */
function OuterCasing() {
  return (
    <group name="outerCasing">
      {/* Main transparent shell */}
      <mesh name="casingShell">
        <boxGeometry args={[1.1, 1.2, 1.0]} />
        {casingMaterial}
      </mesh>
      {/* Edge frame — thin dark metal ribs for structural definition */}
      <mesh name="casingFrame">
        <boxGeometry args={[1.12, 1.22, 1.02]} />
        <meshStandardMaterial
          color="#3a3a40"
          metalness={0.8}
          roughness={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
}

/** Inner tub — the watertight cylinder holding the drum */
function InnerTub() {
  return (
    <mesh
      name="innerTub"
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, 0.02]}
    >
      <cylinderGeometry args={[0.48, 0.48, 0.7, 20, 1, true]} />
      <meshStandardMaterial
        {...metalGrey}
        side={THREE.DoubleSide}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

/** Motor — cylindrical body at the bottom-rear of the machine */
function Motor() {
  return (
    <group name="motor" position={[0, -0.35, -0.35]}>
      {/* Motor body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.22, 12]} />
        <meshStandardMaterial {...metalDark} />
      </mesh>
      {/* Motor shaft */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Mounting brackets */}
      {[-0.08, 0.08].map((x, i) => (
        <mesh key={`mount-${i}`} position={[x, -0.05, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.15]} />
          <meshStandardMaterial {...metalDark} />
        </mesh>
      ))}
    </group>
  );
}

/** Belt — thin torus connecting motor shaft to drum shaft */
function Belt() {
  return (
    <mesh
      name="belt"
      position={[0, -0.15, -0.25]}
      rotation={[0, 0, 0]}
    >
      <torusGeometry args={[0.18, 0.012, 8, 24]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.8} />
    </mesh>
  );
}

/** Inlet valve — small cylinder at the top-left with a pipe */
function InletValve() {
  return (
    <group name="inletValve" position={[-0.35, 0.5, -0.3]}>
      {/* Valve body */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
        <meshStandardMaterial color="#4a6a80" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Valve cap (indicator — will glow when active) */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.02, 8]} />
        <meshStandardMaterial
          color="#2a5a7a"
          emissive="#103050"
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/** Inlet pipe — tube from the valve down into the tub */
function InletPipe() {
  return (
    <group name="inletPipe">
      {/* Vertical drop */}
      <mesh position={[-0.35, 0.3, -0.3]}>
        <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
        <meshStandardMaterial {...metalLight} />
      </mesh>
      {/* Horizontal run into tub */}
      <mesh position={[-0.2, 0.1, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 6]} />
        <meshStandardMaterial {...metalLight} />
      </mesh>
    </group>
  );
}

/** Drain pump — at the bottom with a connecting pipe */
function DrainPump() {
  return (
    <group name="drainPump" position={[0.3, -0.5, 0.1]}>
      {/* Pump body */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 10]} />
        <meshStandardMaterial color="#5a4a40" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Pump housing */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.14, 0.08, 0.14]} />
        <meshStandardMaterial {...metalDark} />
      </mesh>
    </group>
  );
}

/** Drain pipe — from the tub bottom to the pump */
function DrainPipe() {
  return (
    <group name="drainPipe">
      {/* Vertical pipe from tub to pump */}
      <mesh position={[0.15, -0.35, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.35, 6]} />
        <meshStandardMaterial {...metalLight} />
      </mesh>
      {/* Horizontal run to pump */}
      <mesh position={[0.22, -0.5, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
        <meshStandardMaterial {...metalLight} />
      </mesh>
    </group>
  );
}

/** Front door — circular glass window with a frame and lock bolt */
function Door() {
  return (
    <group name="door" position={[0, 0.05, 0.51]}>
      {/* Door frame ring */}
      <mesh name="doorFrame" rotation={[0, 0, 0]}>
        <torusGeometry args={[0.3, 0.03, 8, 24]} />
        <meshStandardMaterial {...metalGrey} />
      </mesh>
      {/* Door glass (slightly transparent) */}
      <mesh name="doorGlass">
        <circleGeometry args={[0.28, 20]} />
        <meshStandardMaterial
          color="#80b0d0"
          metalness={0.1}
          roughness={0.05}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Door handle */}
      <mesh name="doorHandle" position={[0.22, 0, 0.03]}>
        <boxGeometry args={[0.06, 0.12, 0.03]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Door lock bolt — a small bar that slides to lock the door */
function DoorLockBolt() {
  return (
    <mesh
      name="doorLockBolt"
      position={[0.35, 0.05, 0.48]}
    >
      <boxGeometry args={[0.08, 0.025, 0.04]} />
      <meshStandardMaterial
        color="#cc3030"
        emissive="#801010"
        emissiveIntensity={0.3}
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  );
}

/** Base feet — four rubber pads at the corners */
function BaseFeet() {
  const positions = [
    [-0.45, -0.62, -0.4],
    [0.45, -0.62, -0.4],
    [-0.45, -0.62, 0.4],
    [0.45, -0.62, 0.4],
  ];
  return (
    <group name="baseFeet">
      {positions.map(([x, y, z], i) => (
        <mesh key={`foot-${i}`} position={[x, y, z]}>
          <cylinderGeometry args={[0.04, 0.05, 0.04, 8]} />
          <meshStandardMaterial color="#222" metalness={0.3} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Control panel placeholder — flat panel on top-front for future 3D buttons */
function ControlPanelZone() {
  return (
    <group name="controlPanelZone" position={[0, 0.55, 0.45]}>
      {/* Panel surface */}
      <mesh>
        <boxGeometry args={[0.8, 0.15, 0.06]} />
        <meshStandardMaterial
          color="#1a1a20"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Indicator strip (will be replaced by actual buttons later) */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.6, 0.04]} />
        <meshStandardMaterial
          color="#0a2020"
          emissive="#104040"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

// ─── Main WashingMachine component ────────────────────────────────────

export default function WashingMachine({ drumRpm = 0, drumDir = 1 }) {
  return (
    // Position the machine so it sits on the floor (y=0)
    // and is centered in the lab, with empty space to the right
    // for the future state diagram.
    <group name="washingMachine" position={[-0.5, 0.62, 0]}>
      <OuterCasing />
      <InnerTub />

      {/* Drum rotated to face front (Z axis = front-to-back) */}
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
        <Drum rpm={drumRpm} direction={drumDir} />
      </group>

      <Motor />
      <Belt />
      <InletValve />
      <InletPipe />
      <DrainPump />
      <DrainPipe />
      <Door />
      <DoorLockBolt />
      <BaseFeet />
      <ControlPanelZone />
    </group>
  );
}
