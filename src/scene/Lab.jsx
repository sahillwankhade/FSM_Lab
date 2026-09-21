// Lab.jsx — Dark mechatronics laboratory environment.
// All procedural geometry, no external textures or models.
// Provides ambient context: floor, walls, lighting, workbench,
// wall screens, and safety markings.

import React from 'react';
import * as THREE from 'three';

// ─── Sub-components for readability ───────────────────────────────────

/** Polished dark floor with subtle reflectivity */
function Floor() {
  return (
    <mesh name="floor" rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        color="#1a1a22"
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

/** Back wall with a subtle grid wireframe overlay */
function BackWall() {
  return (
    <group name="backWall">
      {/* Solid wall */}
      <mesh position={[0, 3, -5]}>
        <boxGeometry args={[20, 6, 0.15]} />
        <meshStandardMaterial color="#141418" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Wireframe grid overlay for industrial feel */}
      <mesh position={[0, 3, -4.9]}>
        <planeGeometry args={[20, 6, 20, 6]} />
        <meshBasicMaterial
          color="#2a2a35"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

/** Side walls (left and right) */
function SideWalls() {
  const wallMat = (
    <meshStandardMaterial color="#141418" metalness={0.4} roughness={0.7} />
  );
  return (
    <group name="sideWalls">
      {/* Left wall */}
      <mesh position={[-10, 3, 0]}>
        <boxGeometry args={[0.15, 6, 20]} />
        {wallMat}
      </mesh>
      {/* Right wall */}
      <mesh position={[10, 3, 0]}>
        <boxGeometry args={[0.15, 6, 20]} />
        <meshStandardMaterial color="#141418" metalness={0.4} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Ceiling — very dark, barely visible */
function Ceiling() {
  return (
    <mesh name="ceiling" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0a0a0f" metalness={0.3} roughness={0.9} />
    </mesh>
  );
}

/** Two glowing "data screens" on the back wall */
function WallScreens() {
  return (
    <group name="wallScreens">
      {/* Left screen */}
      <mesh position={[-3, 3.2, -4.85]}>
        <planeGeometry args={[1.8, 1.1]} />
        <meshStandardMaterial
          color="#0a2a3a"
          emissive="#1a6080"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Left screen bezel */}
      <mesh position={[-3, 3.2, -4.87]}>
        <boxGeometry args={[2.0, 1.3, 0.04]} />
        <meshStandardMaterial color="#222228" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Right screen */}
      <mesh position={[3, 3.2, -4.85]}>
        <planeGeometry args={[1.8, 1.1]} />
        <meshStandardMaterial
          color="#0a2a2a"
          emissive="#10705a"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Right screen bezel */}
      <mesh position={[3, 3.2, -4.87]}>
        <boxGeometry args={[2.0, 1.3, 0.04]} />
        <meshStandardMaterial color="#222228" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Workbench with metallic legs and a warm wood-tone top */
function Workbench() {
  const legMat = <meshStandardMaterial color="#3a3a40" metalness={0.8} roughness={0.3} />;
  return (
    <group name="workbench" position={[-3.5, 0, 1.5]}>
      {/* Table top */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.0, 0.06, 0.8]} />
        <meshStandardMaterial color="#4a3828" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Four legs */}
      {[[-0.9, -0.35], [-0.9, 0.35], [0.9, -0.35], [0.9, 0.35]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.42, z]}>
          <boxGeometry args={[0.05, 0.84, 0.05]} />
          {legMat}
        </mesh>
      ))}
      {/* Small equipment boxes on the bench surface */}
      <mesh position={[-0.5, 0.95, 0.1]}>
        <boxGeometry args={[0.3, 0.15, 0.2]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.3, 0.92, -0.1]}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color="#1e3a2a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Overhead strip lights — long thin emissive bars with point lights */
function StripLights() {
  return (
    <group name="stripLights">
      {[[-2.5, 5.8, -1], [2.5, 5.8, -1]].map(([x, y, z], i) => (
        <group key={`strip-${i}`} position={[x, y, z]}>
          {/* Light housing */}
          <mesh>
            <boxGeometry args={[0.15, 0.06, 2.5]} />
            <meshStandardMaterial
              color="#ddd"
              emissive="#ffffff"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Actual light source */}
          <pointLight
            intensity={0.6}
            distance={8}
            color="#e8e0d4"
            position={[0, -0.1, 0]}
          />
        </group>
      ))}
    </group>
  );
}

/** Faint yellow safety lines on the floor */
function FloorMarkers() {
  return (
    <group name="floorMarkers">
      {/* Rectangular safety zone around the machine area */}
      {[
        { pos: [0, 0.005, -1.5], size: [3.5, 0.04, 0.03] },  // front
        { pos: [0, 0.005, 1.5], size: [3.5, 0.04, 0.03] },   // back
        { pos: [-1.75, 0.005, 0], size: [0.03, 0.04, 3.0] },  // left
        { pos: [1.75, 0.005, 0], size: [0.03, 0.04, 3.0] },   // right
      ].map(({ pos, size }, i) => (
        <mesh key={`marker-${i}`} position={pos}>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color="#8a8a20"
            emissive="#666610"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Main Lab component ───────────────────────────────────────────────

export default function Lab() {
  return (
    <group name="lab">
      {/* ── Lighting ─────────────────────────────────────────────── */}
      {/* Dim ambient for baseline fill */}
      <ambientLight intensity={0.25} color="#d0d0e0" />

      {/* Hemisphere: cool sky above, warm ground reflection */}
      <hemisphereLight
        color="#4060a0"
        groundColor="#302010"
        intensity={0.3}
      />

      {/* Dramatic spot on the washing machine */}
      <spotLight
        position={[2, 5, 3]}
        target-position={[0, 0.8, 0]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.2}
        color="#e0dcd0"
        distance={12}
      />

      {/* ── Geometry ─────────────────────────────────────────────── */}
      <Floor />
      <BackWall />
      <SideWalls />
      <Ceiling />
      <WallScreens />
      <Workbench />
      <StripLights />
      <FloorMarkers />
    </group>
  );
}
